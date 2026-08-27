import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { relative, resolve, sep } from "node:path";

const repositoryRoot = resolve(import.meta.dirname, "..");

const readArgument = (name) => {
  const index = process.argv.indexOf(name);

  if (index === -1) return undefined;

  const value = process.argv[index + 1];

  assert.ok(value && !value.startsWith("--"), `${name} requires a value`);

  return value;
};

const repository = resolve(readArgument("--repository") ?? repositoryRoot);
const versionArgument = readArgument("--version");

const version =
  versionArgument ??
  JSON.parse(
    await readFile(resolve(repository, "packages/lumen/package.json"), "utf8"),
  ).version;

assert.match(
  version ?? "",
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?$/,
  "The release version must be semantic",
);

if (version !== "2.0.0") {
  process.stdout.write(
    `Approved release revision integrity is not required for ${version}.\n`,
  );

  process.exit(0);
}

const contractArgument =
  readArgument("--contract") ?? "registry/lumen-2-contract.json";

const contractPath = resolve(repository, contractArgument);

const contractRelativePath = relative(repository, contractPath)
  .split(sep)
  .join("/");

const candidateRef = readArgument("--candidate-ref") ?? "HEAD";
const contract = JSON.parse(await readFile(contractPath, "utf8"));

assert.ok(
  contractRelativePath && !contractRelativePath.startsWith("../"),
  "The approval contract must be inside the release repository",
);

assert.equal(
  contract.status,
  "approved",
  "Initial Lumen 2 publication requires an approved contract",
);

assert.match(
  contract.approval?.reviewedRevision ?? "",
  /^[\da-f]{40}$/i,
  "The approved contract requires a full reviewed candidate revision",
);

const runGit = (arguments_, label) => {
  const result = spawnSync("git", arguments_, {
    cwd: repository,
    encoding: "utf8",
  });

  assert.equal(result.status, 0, label);

  return result.stdout.trim();
};

const resolveCommit = (reference, label) => {
  const revision = runGit(
    ["rev-parse", "--verify", `${reference}^{commit}`],
    `Could not resolve ${label} ref ${reference}`,
  );

  assert.match(
    revision,
    /^[\da-f]{40}$/i,
    `${label} ref must resolve to a full Git commit`,
  );

  return revision.toLowerCase();
};

const candidateRevision = resolveCommit(candidateRef, "publication candidate");

const reviewedRevision = resolveCommit(
  contract.approval.reviewedRevision,
  "approved candidate",
);

const ancestry = spawnSync(
  "git",
  ["merge-base", "--is-ancestor", reviewedRevision, candidateRevision],
  { cwd: repository, encoding: "utf8" },
);

assert.equal(
  ancestry.status,
  0,
  "The approved candidate revision must be an ancestor of the publication commit",
);

const changedFiles = runGit(
  ["diff", "--name-only", reviewedRevision, candidateRevision, "--"],
  "Could not inspect changes after the approved candidate revision",
)
  .split("\n")
  .filter(Boolean)
  .sort();

assert.deepEqual(
  changedFiles,
  [contractRelativePath],
  "Only the contract approval record may change after the reviewed Lumen 2 candidate revision",
);

process.stdout.write(
  `Approved Lumen 2 candidate ${reviewedRevision} has only the ${contractRelativePath} approval delta.\n`,
);
