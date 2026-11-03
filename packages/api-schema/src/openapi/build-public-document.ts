import { OpenAPIRegistry, OpenApiGeneratorV31 } from "@asteasolutions/zod-to-openapi";
import { SUPPORT_WINDOW } from "../support-window.js";
import { registerIntegratorPaths } from "./register-integrator-paths.js";

const siteApiKeyAuth = {
  type: "http" as const,
  scheme: "bearer",
  bearerFormat: "site_ key",
  description:
    "Read-only Site API key (Authorization: Bearer site_…). Implies one Site; do not pass a site id.",
};

/** Public document: Integrator API surface only. */
export function buildPublicOpenApiDocument(): ReturnType<OpenApiGeneratorV31["generateDocument"]> {
  const registry = new OpenAPIRegistry();
  registry.registerComponent("securitySchemes", "SiteApiKeyAuth", siteApiKeyAuth);
  registerIntegratorPaths(registry);
  const generator = new OpenApiGeneratorV31(registry.definitions);
  return generator.generateDocument({
    openapi: "3.1.0",
    info: {
      title: "Simpler Integrator API",
      // Independent of the npm package version, which Changesets bumps in lockstep.
      version: "0.1.0",
      description: `Public OpenAPI document for the Integrator API surface. ${SUPPORT_WINDOW}`,
    },
    servers: [{ url: "/", description: "Relative to the API host" }],
  });
}
