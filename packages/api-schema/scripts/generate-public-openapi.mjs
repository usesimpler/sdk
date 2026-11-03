import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildPublicOpenApiDocument } from "../dist/openapi/build-public-document.js";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const outFile = resolve(repoRoot, "openapi/public-openapi.json");
mkdirSync(dirname(outFile), { recursive: true });
writeFileSync(outFile, `${JSON.stringify(buildPublicOpenApiDocument(), null, 2)}\n`);
