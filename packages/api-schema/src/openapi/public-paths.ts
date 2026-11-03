/**
 * Paths on the public OpenAPI document.
 * Adding a path is a promotion onto the Integrator API surface.
 */
export const PUBLIC_OPENAPI_PATHS = [
  "/v1/listings",
  "/v1/listings/{id}",
  "/v1/listings/{id}/media",
  "/v1/pages",
  "/v1/pages/{slug}",
  "/v1/site",
] as const;
