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

const major = Number.parseInt(version.split(".")[0], 10);
const initialMajorVersion = `${major}.0.0`;

if (![2, 3].includes(major) || version !== initialMajorVersion) {
  process.stdout.write(
    `Approved release revision integrity is not required for ${version}.\n`,
  );

  process.exit(0);
}

const publishedTag = spawnSync(
  "git",
  ["rev-parse", "--verify", `v${version}^{commit}`],
  { cwd: repository, encoding: "utf8" },
);

if (publishedTag.status === 0) {
  process.stdout.write(
    `Approved release revision integrity was already enforced before v${version} was published.\n`,
  );

  process.exit(0);
}

const contractArgument =
  readArgument("--contract") ?? `registry/lumen-${major}-contract.json`;

const contractPath = resolve(repository, contractArgument);

const contractRelativePath = relative(repository, contractPath)
  .split(sep)
  .join("/");

const candidateRef = readArgument("--candidate-ref") ?? "HEAD";
const contract = JSON.parse(await readFile(contractPath, "utf8"));
const releaseLabel = `Lumen ${major}`;

assert.ok(
  contractRelativePath && !contractRelativePath.startsWith("../"),
  "The approval contract must be inside the release repository",
);

assert.equal(
  contract.targetVersion,
  version,
  `${releaseLabel} contract must target ${version}`,
);

assert.equal(
  contract.status,
  "approved",
  `Initial ${releaseLabel} publication requires an approved contract`,
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

const workingTreeStatus = runGit(
  ["status", "--porcelain=v1", "--untracked-files=all"],
  "Could not inspect the publication working tree",
);

assert.equal(
  workingTreeStatus,
  "",
  `Initial ${releaseLabel} publication requires a clean working tree with no tracked or untracked changes`,
);

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
  `Only the contract approval record may change after the reviewed ${releaseLabel} candidate revision`,
);

const reviewedContract = JSON.parse(
  runGit(
    ["show", `${reviewedRevision}:${contractRelativePath}`],
    `Could not read the reviewed ${releaseLabel} contract`,
  ),
);

assert.equal(
  reviewedContract.status,
  "draft",
  `The reviewed ${releaseLabel} candidate contract must be draft`,
);

assert.equal(
  reviewedContract.approval,
  undefined,
  `The reviewed ${releaseLabel} candidate contract must not contain approval metadata`,
);

const approvalNeutralContract = structuredClone(contract);

approvalNeutralContract.status = "draft";

delete approvalNeutralContract.approval;

assert.deepEqual(
  approvalNeutralContract,
  reviewedContract,
  `Only status and approval metadata may change inside the ${releaseLabel} contract after review`,
);

process.stdout.write(
  `Approved ${releaseLabel} candidate ${reviewedRevision} has only the ${contractRelativePath} approval delta.\n`,
);
