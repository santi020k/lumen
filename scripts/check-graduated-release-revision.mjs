import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const repositoryRoot = resolve(import.meta.dirname, "..");

const readArgument = (name) => {
  const index = process.argv.indexOf(name);

  if (index === -1) return undefined;

  const value = process.argv[index + 1];

  assert.ok(value && !value.startsWith("--"), `${name} requires a value`);

  return value;
};

const repository = resolve(readArgument("--repository") ?? repositoryRoot);

const contractPath = resolve(
  repository,
  readArgument("--contract") ?? "registry/lumen-2-contract.json",
);

const releaseRef = readArgument("--release-ref") ?? "v2.0.0";
const contract = JSON.parse(await readFile(contractPath, "utf8"));

if (contract.graduation === undefined) {
  process.stdout.write("Lumen 2 graduation revision is not recorded yet.\n");

  process.exit(0);
}

assert.equal(
  contract.graduation.version,
  "2.0.0",
  "Lumen 2 graduation must identify version 2.0.0",
);

const result = spawnSync(
  "git",
  ["rev-parse", "--verify", `${releaseRef}^{commit}`],
  { cwd: repository, encoding: "utf8" },
);

assert.equal(
  result.status,
  0,
  `Could not resolve graduated release ref ${releaseRef}`,
);

const taggedRevision = result.stdout.trim().toLowerCase();

assert.match(
  taggedRevision,
  /^[\da-f]{40}$/u,
  "Graduated release ref must resolve to a full Git commit",
);

assert.equal(
  contract.graduation.releaseRevision,
  taggedRevision,
  `Graduation releaseRevision must match the peeled ${releaseRef} commit`,
);

process.stdout.write(
  `Lumen 2 graduation matches ${releaseRef} at ${taggedRevision}.\n`,
);
