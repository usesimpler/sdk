import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import z from "zod";
import "../patch-zod.js";
import { pageTreeSchema, pageWithSectionsSchema, publicSiteSchema } from "./schemas.js";

const apiErrorSchema = z.object({ error: z.string() });
const siteKeySecurity = [{ SiteApiKeyAuth: [] }];

export function registerPagesIntegratorPaths(registry: OpenAPIRegistry): void {
  registry.registerPath({
    method: "get",
    path: "/v1/site",
    summary: "Get the Site implied by a Site API key",
    tags: ["Integrator", "Sites"],
    security: siteKeySecurity,
    responses: {
      "200": {
        description: "Site branding and listing scope",
        content: { "application/json": { schema: publicSiteSchema } },
      },
      "401": {
        description: "Missing or invalid Site API key",
        content: { "application/json": { schema: apiErrorSchema } },
      },
    },
  });

  registry.registerPath({
    method: "get",
    path: "/v1/pages",
    summary: "List Pages as a title-ordered tree",
    tags: ["Integrator", "Pages"],
    security: siteKeySecurity,
    responses: {
      "200": {
        description: "Page tree (no section HTML)",
        content: { "application/json": { schema: pageTreeSchema } },
      },
      "401": {
        description: "Missing or invalid Site API key",
        content: { "application/json": { schema: apiErrorSchema } },
      },
    },
  });

  registry.registerPath({
    method: "get",
    path: "/v1/pages/{slug}",
    summary: "Get a Page by slug with its Sections",
    tags: ["Integrator", "Pages"],
    security: siteKeySecurity,
    request: {
      params: z.object({ slug: z.string() }),
    },
    responses: {
      "200": {
        description: "Page with sections",
        content: { "application/json": { schema: pageWithSectionsSchema } },
      },
      "401": {
        description: "Missing or invalid Site API key",
        content: { "application/json": { schema: apiErrorSchema } },
      },
      "404": {
        description: "Unknown slug",
        content: { "application/json": { schema: apiErrorSchema } },
      },
    },
  });
}
