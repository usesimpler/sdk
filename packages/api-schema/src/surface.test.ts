import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import * as schema from "./index.js";

/** Modules the Integrator schema package may export. Site surface only. */
const SITE_MODULES = [
  "./listings/listing-stage.js",
  "./listings/media.js",
  "./listings/openapi.js",
  "./listings/site-listing.js",
  "./listings/validate.js",
  "./openapi/register-integrator-paths.js",
  "./pages/openapi.js",
  "./pages/schemas.js",
];

/** Runtime exports. Types are not values and are not part of this list. */
const SITE_VALUE_EXPORTS = [
  "listingMediaItemSchema",
  "listingStageSchema",
  "pageNodeSchema",
  "pageSectionSchema",
  "pageTreeSchema",
  "pageWithSectionsSchema",
  "parseSiteListing",
  "parseSiteListingsResponse",
  "publicSiteSchema",
  "registerIntegratorPaths",
  "registerListingsIntegratorPaths",
  "registerPagesIntegratorPaths",
  "safeParseListingMediaList",
  "safeParseSiteListing",
  "safeParseSiteListingsPaginatedResponse",
  "siteListListingsResponseSchema",
  "siteListingSchema",
];

describe("Integrator schema package", () => {
  it("exports only Site surface schemas and their OpenAPI registration", () => {
    const source = readFileSync(new URL("./index.ts", import.meta.url), "utf8");
    const modules = [...source.matchAll(/from\s+"([^"]+)"/g)].map((match) => match[1]);

    expect([...new Set(modules)].sort()).toEqual(SITE_MODULES);
    expect(Object.keys(schema).sort()).toEqual(SITE_VALUE_EXPORTS);
    expect(schema).not.toHaveProperty("listingSchema");
    expect(schema).not.toHaveProperty("dealSchema");
  });
});
