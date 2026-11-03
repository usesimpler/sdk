import "../patch-zod.js";
import z from "zod";
import { listingStageSchema } from "./listing-stage.js";

/** Agent on a Site API key listing: name, phone, and photo when one is set. */
const siteListingAgentSchema = z
  .object({
    first_name: z.string(),
    last_name: z.string(),
    phone: z.string().nullable().optional(),
    photo_url: z.string().optional(),
  })
  .strict()
  .openapi("SiteListingAgent");

const siteLinkedContactSchema = z
  .object({
    contact_id: z.string(),
    relationship_type: z.string(),
    sort_order: z.number(),
    first_name: z.string(),
    last_name: z.string(),
    email: z.string().nullable(),
    phone: z.string().nullable(),
  })
  .openapi("SiteListingLinkedContact");

const siteLinkedDealSchema = z
  .object({
    deal_id: z.string(),
    relationship_type: z.string(),
    sort_order: z.number(),
    name: z.string(),
    stage_name: z.string().nullable(),
    pipeline_name: z.string().nullable(),
    from_listing_fk: z.boolean(),
  })
  .openapi("SiteListingLinkedDeal");

const siteLinkedInstagramMediaSchema = z
  .object({
    id: z.string(),
    ig_media_id: z.string(),
    media_type: z.string().nullable(),
    permalink: z.string().nullable(),
    caption: z.string().nullable(),
    thumbnail_url: z.string().nullable(),
    posted_at: z.string().nullable(),
    created_at: z.string(),
    insights_latest: z.unknown().nullable(),
  })
  .openapi("SiteListingInstagramMedia");

/**
 * Listing body for a Site API key.
 * Address, price, description, dates, and Stage stay.
 * Seller, campaign, org, team, accepted Offer, and agent email and member ids do not.
 */
export const siteListingSchema = z
  .object({
    id: z.string(),
    listing_type: z.enum(["sale", "lease"]).optional(),
    list_price: z.number().nullable().optional(),
    lease_amount: z.number().nullable().optional(),
    lease_amount_frequency: z.string().nullable().optional(),
    list_date: z.string().nullable().optional(),
    expiry_date: z.string().nullable().optional(),
    modification_timestamp: z.string().nullable().optional(),
    created_at: z.string().optional(),
    updated_at: z.string().optional(),
    description: z.string().nullable().optional(),
    stage_id: z.string().nullable().optional(),
    stage: listingStageSchema.nullable().optional(),
    street_address: z.string().nullable().optional(),
    street_number: z.string().nullable().optional(),
    street_name: z.string().nullable().optional(),
    unit_number: z.string().nullable().optional(),
    city: z.string().nullable().optional(),
    state_or_province: z.string().nullable().optional(),
    postal_code: z.string().nullable().optional(),
    country: z.string().nullable().optional(),
    county_or_parish: z.string().nullable().optional(),
    latitude: z.number().nullable().optional(),
    longitude: z.number().nullable().optional(),
    listing_id: z.string().nullable().optional(),
    thumbnail_url: z.string().nullable().optional(),
    derived_stage_id: z.string().nullable().optional(),
    derived_stage: listingStageSchema.nullable().optional(),
    linked_contacts: z.array(siteLinkedContactSchema).optional(),
    linked_deals: z.array(siteLinkedDealSchema).optional(),
    linked_instagram_media: z.array(siteLinkedInstagramMediaSchema).optional(),
    list_agent: siteListingAgentSchema.optional(),
    co_list_agent: siteListingAgentSchema.optional(),
  })
  .strict()
  .openapi("SiteListing");

export const siteListListingsResponseSchema = z
  .object({
    data: z.array(siteListingSchema),
    total: z.number(),
  })
  .openapi("SiteListListingsResponse");

export type SiteListing = z.infer<typeof siteListingSchema>;
export type SiteListListingsResponse = z.infer<typeof siteListListingsResponseSchema>;

/** Site API key list: `{ data, total }` of public listings. */
export function parseSiteListingsResponse(raw: unknown): SiteListing[] {
  const parsed = siteListListingsResponseSchema.safeParse(raw);
  if (!parsed.success) return [];
  return parsed.data.data;
}

export function parseSiteListing(raw: unknown): SiteListing {
  return siteListingSchema.parse(raw);
}
