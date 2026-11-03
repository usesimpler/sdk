import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { registerListingsIntegratorPaths } from "../listings/openapi.js";
import { registerPagesIntegratorPaths } from "../pages/openapi.js";

/** Register Site surface paths on the given OpenAPI registry. */
export function registerIntegratorPaths(registry: OpenAPIRegistry): void {
  registerListingsIntegratorPaths(registry);
  registerPagesIntegratorPaths(registry);
}
