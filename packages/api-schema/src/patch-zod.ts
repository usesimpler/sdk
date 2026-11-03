/**
 * Extend Zod with `.openapi()` for OpenAPI generation.
 * Import once before schemas that use OpenAPI metadata.
 */
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import z from "zod";

extendZodWithOpenApi(z);
