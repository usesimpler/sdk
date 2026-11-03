import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { SUPPORT_WINDOW } from "../support-window.js";
import { buildPublicOpenApiDocument } from "./build-public-document.js";
import { PUBLIC_OPENAPI_PATHS } from "./public-paths.js";

describe("public OpenAPI document", () => {
  it("pins the Integrator API surface paths", () => {
    const doc = buildPublicOpenApiDocument();
    expect(Object.keys(doc.paths ?? {}).sort()).toEqual([...PUBLIC_OPENAPI_PATHS].sort());
    expect(doc.paths?.["/v1/deals"]).toBeUndefined();
  });

  it("matches the published document and states the support window", () => {
    const doc = buildPublicOpenApiDocument();
    const published = JSON.parse(
      readFileSync(new URL("../../../../openapi/public-openapi.json", import.meta.url), "utf8"),
    );
    expect(published).toEqual(JSON.parse(JSON.stringify(doc)));
    expect(doc.info.description).toContain(SUPPORT_WINDOW);

    const readme = readFileSync(new URL("../../../../README.md", import.meta.url), "utf8");
    const schemaReadme = readFileSync(new URL("../../README.md", import.meta.url), "utf8");
    const clientReadme = readFileSync(
      new URL("../../../sdk-core/README.md", import.meta.url),
      "utf8",
    );
    expect(readme).toContain(SUPPORT_WINDOW);
    expect(schemaReadme).toContain(SUPPORT_WINDOW);
    expect(clientReadme).toContain(SUPPORT_WINDOW);
    expect(readme).toContain("openapi/public-openapi.json");
  });
});
