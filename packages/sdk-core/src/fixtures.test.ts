import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createSimplerClient } from "./create-client.js";

function fixture(name: string): unknown {
  return JSON.parse(
    readFileSync(new URL(`../../api-schema/fixtures/${name}`, import.meta.url), "utf8"),
  );
}

function jsonResponse(body: unknown) {
  return {
    ok: true,
    status: 200,
    json: async () => body,
    url: "http://api.test/v1",
  };
}

describe("Simpler API client against integrator schema fixtures", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("reads Site branding, a Page, listings, and media from the fixtures", async () => {
    const site = fixture("public-site.json") as { title: string };
    const page = fixture("page-with-sections.json") as { slug: string; sections: unknown[] };
    const listings = fixture("site-listings.json");
    const media = fixture("listing-media.json") as Array<{ filename: string }>;
    const fetchMock = vi.fn(async (url: string) => {
      if (url.endsWith("/v1/site")) return jsonResponse(site);
      if (url.endsWith("/v1/pages/home")) return jsonResponse(page);
      if (url.endsWith("/v1/listings")) return jsonResponse(listings);
      if (url.endsWith("/v1/listings/listing-1/media")) return jsonResponse(media);
      throw new Error(`Unexpected url ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    const client = createSimplerClient({
      apiBase: "http://api.test",
      auth: { type: "oauth", accessToken: "session-token" },
    }).forSite("site_abc");

    await expect(client.site.get()).resolves.toMatchObject({ title: "Acme" });
    await expect(client.pages.getBySlug("home")).resolves.toMatchObject({
      slug: "home",
      sections: [{ body: "Hello" }],
    });
    await expect(client.listings.list()).resolves.toMatchObject([
      { id: "listing-1", street_address: "100 Listing St", list_price: 500000 },
    ]);
    await expect(client.listings.listMedia("listing-1")).resolves.toMatchObject([
      { filename: "a.webp", is_cover: true },
    ]);
  });
});
