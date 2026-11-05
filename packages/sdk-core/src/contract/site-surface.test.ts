import { readFileSync } from "node:fs";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import {
  listingMediaItemSchema,
  pageTreeSchema,
  pageWithSectionsSchema,
  publicSiteSchema,
} from "@usesimpler/api-schema";
import { afterEach, describe, expect, it } from "vitest";
import { createSimplerClient } from "../create-client.js";
import { runSiteSurfaceContract } from "./site-surface.js";

function fixture(name: string): unknown {
  return JSON.parse(
    readFileSync(new URL(`../../../api-schema/fixtures/${name}`, import.meta.url), "utf8"),
  );
}

const listings = fixture("site-listings.json") as { data: { id: string }[] };
const listing = listings.data[0];

const schemas = {
  parsePublicSite: (value: unknown) => publicSiteSchema.parse(value),
  parsePageTree: (value: unknown) => pageTreeSchema.parse(value),
  parsePage: (value: unknown) => pageWithSectionsSchema.parse(value),
  parseMediaList: (value: unknown) => listingMediaItemSchema.array().parse(value),
};

async function serve(routes: Record<string, unknown>): Promise<{
  apiBase: string;
  close: () => Promise<void>;
}> {
  const server = createServer((req, res) => {
    const body = routes[req.url ?? ""];
    if (body === undefined) {
      res.writeHead(404, { "content-type": "application/json" });
      res.end(JSON.stringify({ error: "Not found." }));
      return;
    }
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify(body));
  });
  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address() as AddressInfo;
  return {
    apiBase: `http://127.0.0.1:${address.port}`,
    close: () =>
      new Promise((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      }),
  };
}

function happyRoutes(): Record<string, unknown> {
  return {
    "/v1/site": fixture("public-site.json"),
    "/v1/pages": fixture("page-tree.json"),
    "/v1/pages/home": fixture("page-with-sections.json"),
    "/v1/listings": listings,
    [`/v1/listings/${listing?.id}`]: listing,
    [`/v1/listings/${listing?.id}/media`]: fixture("listing-media.json"),
  };
}

describe("Site surface contract", () => {
  let close: (() => Promise<void>) | undefined;

  afterEach(async () => {
    await close?.();
    close = undefined;
  });

  it("accepts Site branding, Pages, Listings, and media from a live API", async () => {
    const server = await serve(happyRoutes());
    close = server.close;

    await runSiteSurfaceContract({
      apiBase: server.apiBase,
      siteApiKey: "site_test",
      createClient: createSimplerClient,
      schemas,
    });
  });

  it("fails when the Site branding response drops a required field", async () => {
    const site = fixture("public-site.json") as Record<string, unknown>;
    delete site.slug;
    const server = await serve({ ...happyRoutes(), "/v1/site": site });
    close = server.close;

    await expect(
      runSiteSurfaceContract({
        apiBase: server.apiBase,
        siteApiKey: "site_test",
        createClient: createSimplerClient,
        schemas,
      }),
    ).rejects.toThrow();
  });

  it("fails when a Listing body includes the seller", async () => {
    const broken = {
      data: [{ ...listing, seller: { contact_id: "seller-1" } }],
      total: 1,
    };
    const server = await serve({ ...happyRoutes(), "/v1/listings": broken });
    close = server.close;

    await expect(
      runSiteSurfaceContract({
        apiBase: server.apiBase,
        siteApiKey: "site_test",
        createClient: createSimplerClient,
        schemas,
      }),
    ).rejects.toThrow(/no listings/);
  });
});
