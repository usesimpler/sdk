import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { createSimplerClient, type SiteScopedSimplerClient } from "./create-client.js";
import type { PageNode, PageWithSections, PublicSite, SiteListing } from "./index.js";

const corePackage = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")) as {
  private?: boolean;
  version: string;
  dependencies?: Record<string, string>;
  scripts?: Record<string, string>;
  devDependencies?: Record<string, string>;
  publishConfig?: { access?: string; provenance?: boolean };
};

const schemaPackage = JSON.parse(
  readFileSync(new URL("../../api-schema/package.json", import.meta.url), "utf8"),
) as { name: string; version: string; private?: boolean };

const changesetConfig = JSON.parse(
  readFileSync(new URL("../../../.changeset/config.json", import.meta.url), "utf8"),
) as { fixed?: string[][] };

type MarketingReads = {
  site: { get: () => Promise<PublicSite> };
  pages: {
    list: () => Promise<PageNode[]>;
    getBySlug: (slug: string) => Promise<PageWithSections>;
  };
  listings: {
    list: () => Promise<SiteListing[]>;
    get: (id: string) => Promise<SiteListing>;
    listMedia: (id: string) => Promise<unknown>;
  };
};

function marketingReads(client: SiteScopedSimplerClient): MarketingReads {
  return client;
}

function readDist(): string {
  const dist = new URL("../dist/", import.meta.url);
  const chunks: string[] = [];
  const walk = (dir: URL) => {
    for (const entry of readdirSync(dir)) {
      const path = join(dir.pathname, entry);
      if (statSync(path).isDirectory()) {
        walk(new URL(`${entry}/`, dir));
        continue;
      }
      if (path.endsWith(".js") || path.endsWith(".d.ts")) chunks.push(readFileSync(path, "utf8"));
    }
  };
  walk(dist);
  return chunks.join("\n");
}

describe("Simpler API client publish surface", () => {
  it("depends on the published integrator schema package and versions in lockstep", () => {
    expect(corePackage.private).toBeUndefined();
    expect(schemaPackage.private).toBeUndefined();
    expect(corePackage.publishConfig).toMatchObject({ access: "public", provenance: true });
    expect(corePackage.dependencies?.["@usesimpler/api-schema"]).toBe("workspace:*");
    expect(corePackage.devDependencies ?? {}).not.toHaveProperty("@usesimpler/api-schema");
    expect(corePackage.version).toBe(schemaPackage.version);
    expect(schemaPackage.name).toBe("@usesimpler/api-schema");
    expect(changesetConfig.fixed).toEqual([["@usesimpler/api-schema", "@usesimpler/sdk-core"]]);
    expect(corePackage.scripts?.build).not.toContain("tsup");
    expect(corePackage.scripts?.build).not.toContain("inline-public-types");
    expect(corePackage.devDependencies ?? {}).not.toHaveProperty("tsup");
  });

  it("emits a client that imports the schema package instead of bundling it", () => {
    const built = readDist();
    expect(built).toContain("@usesimpler/api-schema");
    expect(built).toContain("PublicSite");
    expect(built).toContain("SiteListing");
    expect(built).not.toContain("siteListingSchema");
    expect(built).not.toContain("inline-public-types");
  });

  it("packs the built client and its documentation", () => {
    const raw = execFileSync("pnpm", ["pack", "--dry-run", "--json"], {
      cwd: new URL("..", import.meta.url),
      encoding: "utf8",
    });
    const parsed = JSON.parse(raw) as { files: Array<{ path: string }> } | Array<{ files: Array<{ path: string }> }>;
    const packed = Array.isArray(parsed) ? parsed[0] : parsed;
    const paths = packed?.files.map((file) => file.path) ?? [];

    expect(paths).toContain("dist/index.js");
    expect(paths).toContain("README.md");
    expect(
      paths.filter(
        (path) =>
          path !== "package.json" &&
          path !== "README.md" &&
          path !== "LICENSE" &&
          !path.startsWith("dist/"),
      ),
    ).toEqual([]);
  });

  it("forSite exposes branding, pages, and listing list, get, and media", () => {
    const client = createSimplerClient({
      apiBase: "http://api.test",
      auth: { type: "oauth", accessToken: "session-token" },
    });
    const siteClient = marketingReads(client.forSite("site_abc"));

    expect(Object.keys(siteClient).sort()).toEqual(["listings", "pages", "site", "withResources"]);
    expect(Object.keys(siteClient.listings).sort()).toEqual(["get", "list", "listMedia"]);
    expect(siteClient).not.toHaveProperty("deals");
    expect(siteClient).not.toHaveProperty("tasks");
    expect(typeof siteClient.site.get).toBe("function");
    expect(typeof siteClient.pages.list).toBe("function");
    expect(typeof siteClient.pages.getBySlug).toBe("function");
  });

  it("forTeam and forOrg expose no resources", () => {
    const client = createSimplerClient({
      apiBase: "http://api.test",
      auth: { type: "session", getAccessToken: async () => "sess" },
    });
    const forks = [client.forTeam("team-1"), client.forOrg({ orgSlug: "acme" })];
    for (const fork of forks) {
      expect(Object.keys(fork).sort()).toEqual(["request", "withResources"]);
    }
    expect(client).not.toHaveProperty("integrations");
    expect(client).not.toHaveProperty("meTeams");
    expect(client).not.toHaveProperty("deals");
  });
});
