import "../patch-zod.js";
import z from "zod";

/** Listing media returned to a Site API key. */
export const listingMediaItemSchema = z
  .object({
    id: z.string(),
    url: z.string(),
    thumb_url: z.string(),
    card_url: z.string(),
    filename: z.string(),
    content_type: z.string(),
    sort_order: z.number(),
    is_cover: z.boolean(),
  })
  .openapi("ListingMediaItem");

export type ListingMediaItem = z.infer<typeof listingMediaItemSchema>;
