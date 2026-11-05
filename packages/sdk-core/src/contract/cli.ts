#!/usr/bin/env node
import {
  listingMediaItemSchema,
  pageTreeSchema,
  pageWithSectionsSchema,
  publicSiteSchema,
} from "@usesimpler/api-schema";
import { createSimplerClient } from "../create-client.js";
import { runSiteSurfaceContract } from "./site-surface.js";

const apiBase = process.env.SIMPLER_API_BASE;
const siteApiKey = process.env.SITE_API_KEY;

if (!apiBase || !siteApiKey) {
  console.error("SIMPLER_API_BASE and SITE_API_KEY are required.");
  process.exit(1);
}

runSiteSurfaceContract({
  apiBase,
  siteApiKey,
  createClient: createSimplerClient,
  schemas: {
    parsePublicSite: (value) => publicSiteSchema.parse(value),
    parsePageTree: (value) => pageTreeSchema.parse(value),
    parsePage: (value) => pageWithSectionsSchema.parse(value),
    parseMediaList: (value) => listingMediaItemSchema.array().parse(value),
  },
}).catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error(message);
  process.exit(1);
});
