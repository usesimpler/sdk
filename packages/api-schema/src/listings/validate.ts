import { firstIssueMessage, type SafeParseResult } from "../parse-result.js";
import "../patch-zod.js";
import z from "zod";
import { listingMediaItemSchema } from "./media.js";
import { siteListingSchema, siteListListingsResponseSchema } from "./site-listing.js";

export type { SafeParseResult };

export type IntegratorSiteListing = z.infer<typeof siteListingSchema>;
export type IntegratorListingMediaItem = z.infer<typeof listingMediaItemSchema>;
export type IntegratorSiteListListingsResponse = z.infer<typeof siteListListingsResponseSchema>;

export function safeParseSiteListing(raw: unknown): SafeParseResult<IntegratorSiteListing> {
  const result = siteListingSchema.safeParse(raw);
  if (result.success) return { ok: true, data: result.data };
  return { ok: false, error: firstIssueMessage(result.error) };
}

export function safeParseSiteListingsPaginatedResponse(
  raw: unknown,
): SafeParseResult<IntegratorSiteListListingsResponse> {
  const result = siteListListingsResponseSchema.safeParse(raw);
  if (result.success) return { ok: true, data: result.data };
  return { ok: false, error: firstIssueMessage(result.error) };
}

export function safeParseListingMediaList(
  raw: unknown,
): SafeParseResult<IntegratorListingMediaItem[]> {
  const result = z.array(listingMediaItemSchema).safeParse(raw);
  if (result.success) return { ok: true, data: result.data };
  return { ok: false, error: firstIssueMessage(result.error) };
}
