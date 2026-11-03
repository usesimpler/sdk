import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { safeParseListingMediaList, safeParseSiteListing } from "./listings/validate.js";
import { siteListListingsResponseSchema } from "./listings/site-listing.js";
import { pageTreeSchema, pageWithSectionsSchema, publicSiteSchema } from "./pages/schemas.js";

function fixture(name: string): unknown {
  return JSON.parse(readFileSync(new URL(`../fixtures/${name}`, import.meta.url), "utf8"));
}

describe("fixtures derived from the integrator schemas", () => {
  it("accepts the Site listing fixture and keeps the public address", () => {
    const list = fixture("site-listings.json") as { data: unknown[] };
    const parsed = safeParseSiteListing(list.data[0]);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.data.street_address).toBe("100 Listing St");
    expect(parsed.data.list_price).toBe(500000);
    expect(parsed.data).not.toHaveProperty("seller");
    expect(parsed.data.list_agent).not.toHaveProperty("email");
  });

  it("accepts the Site listing list, media, site, and page fixtures", () => {
    expect(siteListListingsResponseSchema.safeParse(fixture("site-listings.json")).success).toBe(
      true,
    );
    expect(safeParseListingMediaList(fixture("listing-media.json")).ok).toBe(true);
    expect(publicSiteSchema.safeParse(fixture("public-site.json")).success).toBe(true);
    expect(pageWithSectionsSchema.safeParse(fixture("page-with-sections.json")).success).toBe(true);
    expect(pageTreeSchema.safeParse(fixture("page-tree.json")).success).toBe(true);
  });
});
