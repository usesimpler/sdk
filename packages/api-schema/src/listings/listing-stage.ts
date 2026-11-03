import "../patch-zod.js";
import z from "zod";

/** Stage name on both the Site listing and the full platform listing. */
export const listingStageSchema = z
  .object({
    id: z.string(),
    name: z.string(),
  })
  .openapi("ListingStage");

export type ListingStage = z.infer<typeof listingStageSchema>;
