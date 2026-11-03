import z from "zod";
import { firstIssueMessage, type SafeParseResult } from "../parse-result.js";
import "../patch-zod.js";
import type { ListingMediaItem } from "./media.js";
import { listingMediaItemSchema } from "./media.js";
import type { SiteListing, SiteListListingsResponse } from "./site-listing.js";
import { siteListingSchema, siteListListingsResponseSchema } from "./site-listing.js";

export type { SafeParseResult };

function safeParse<T>(schema: z.ZodType<T>, raw: unknown): SafeParseResult<T> {
  const result = schema.safeParse(raw);
  if (result.success) return { ok: true, data: result.data };
  return { ok: false, error: firstIssueMessage(result.error) };
}

export function safeParseSiteListing(raw: unknown): SafeParseResult<SiteListing> {
  return safeParse(siteListingSchema, raw);
}

export function safeParseSiteListingsPaginatedResponse(
  raw: unknown,
): SafeParseResult<SiteListListingsResponse> {
  return safeParse(siteListListingsResponseSchema, raw);
}

export function safeParseListingMediaList(raw: unknown): SafeParseResult<ListingMediaItem[]> {
  return safeParse(z.array(listingMediaItemSchema), raw);
}
