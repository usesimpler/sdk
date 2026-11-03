import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

const sha = (process.env.GITHUB_SHA ?? execSync("git rev-parse HEAD", { encoding: "utf8" }).trim()).slice(
  0,
  12,
);

const schemaPath = "packages/api-schema/package.json";
const clientPath = "packages/sdk-core/package.json";

function read(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function canaryVersion(current) {
  const match = /^(\d+)\.(\d+)\.(\d+)/.exec(current);
  if (!match) throw new Error(`Cannot build a canary version from ${current}`);
  return `${match[1]}.${match[2]}.${Number(match[3]) + 1}-canary.${sha}`;
}

const schema = read(schemaPath);
const client = read(clientPath);
if (schema.version !== client.version) {
  throw new Error(
    `Packages are not in lockstep (${schema.version} vs ${client.version}). Refusing to publish a canary.`,
  );
}

const version = canaryVersion(schema.version);
schema.version = version;
client.version = version;
client.dependencies["@usesimpler/api-schema"] = version;

writeFileSync(schemaPath, `${JSON.stringify(schema, null, 2)}\n`);
writeFileSync(clientPath, `${JSON.stringify(client, null, 2)}\n`);
console.log(version);
