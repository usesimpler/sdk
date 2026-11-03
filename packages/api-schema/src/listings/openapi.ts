import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import z from "zod";
import { apiErrorSchema } from "../openapi/api-error.js";
import "../patch-zod.js";
import { listingMediaItemSchema } from "./media.js";
import { siteListingSchema, siteListListingsResponseSchema } from "./site-listing.js";

const siteListingBody =
  "Address, price, description, dates, Stage name, and agent name, phone, and photo. Omits seller, seller contact id, Meta campaign ids, org id, team id, accepted Offer, agent email, and agent member ids.";

const listListingsResponses = {
  "200": {
    description: `Site API key listing list. ${siteListingBody}`,
    content: {
      "application/json": {
        schema: siteListListingsResponseSchema,
      },
    },
  },
};

/** Site surface listing routes. */
export function registerListingsIntegratorPaths(registry: OpenAPIRegistry): void {
  registry.registerPath({
    method: "get",
    path: "/v1/listings",
    summary: "List listings for a Site API key",
    tags: ["Integrator", "Listings"],
    security: [{ SiteApiKeyAuth: [] }],
    responses: listListingsResponses,
  });

  registry.registerPath({
    method: "get",
    path: "/v1/listings/{id}",
    summary: "Get a listing for a Site API key",
    tags: ["Integrator", "Listings"],
    security: [{ SiteApiKeyAuth: [] }],
    request: {
      params: z.object({ id: z.string() }),
    },
    responses: {
      "200": {
        description: `Public listing. ${siteListingBody}`,
        content: {
          "application/json": {
            schema: siteListingSchema,
          },
        },
      },
      "404": {
        description: "Not found",
        content: {
          "application/json": {
            schema: apiErrorSchema,
          },
        },
      },
    },
  });

  registry.registerPath({
    method: "get",
    path: "/v1/listings/{id}/media",
    summary: "Listing media for a Site API key",
    tags: ["Integrator", "Listings"],
    security: [{ SiteApiKeyAuth: [] }],
    request: {
      params: z.object({ id: z.string() }),
    },
    responses: {
      "200": {
        description: "Listing media items",
        content: {
          "application/json": {
            schema: z.array(listingMediaItemSchema),
          },
        },
      },
    },
  });
}
