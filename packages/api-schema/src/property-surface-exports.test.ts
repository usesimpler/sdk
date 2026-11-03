import { describe, expect, it } from "vitest";
import * as apiSchema from "./index.js";

describe("Integrator schema package exports", () => {
  it("exports nothing named after Property", () => {
    const propertyExports = Object.keys(apiSchema).filter((name) =>
      /^(property|Property)/.test(name),
    );

    expect(propertyExports).toEqual([]);
  });

  it("does not export registerPropertiesIntegratorPaths", () => {
    expect(Object.keys(apiSchema)).not.toContain("registerPropertiesIntegratorPaths");
  });
});
