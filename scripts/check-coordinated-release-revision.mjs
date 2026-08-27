import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const repositoryRoot = resolve(import.meta.dirname, "..");

const readArgument = (name) => {
  const index = process.argv.indexOf(name);

  if (index === -1) return undefined;

  const value = process.argv[index + 1];

  assert.ok(value && !value.startsWith("--"), `${name} requires a value`);

  return value;
};

const version = readArgument("--version");

assert.match(
  version ?? "",
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?$/,
  "--version must be a semantic version",
);

if (version !== "2.0.0") {
  process.stdout.write(
    `Coordinated release revision is not required for ${version}.\n`,
  );

  process.exit(0);
}

const repository = resolve(readArgument("--repository") ?? repositoryRoot);
const candidateRef = readArgument("--candidate-ref") ?? "HEAD";
const releaseRef = readArgument("--release-ref") ?? "v2.0.0";
const releaseRemote = readArgument("--release-remote");

const resolveCommit = (reference, label) => {
  const result = spawnSync(
    "git",
    ["rev-parse", "--verify", `${reference}^{commit}`],
    { cwd: repository, encoding: "utf8" },
  );

  assert.equal(
    result.status,
    0,
    `Could not resolve coordinated ${label} ref ${reference}`,
  );

  const revision = result.stdout.trim();

  assert.match(
    revision,
    /^[\da-f]{40}$/i,
    `${label} ref must resolve to a full Git commit`,
  );

  return revision.toLowerCase();
};

const candidateRevision = resolveCommit(candidateRef, "candidate");

const resolveRemoteTag = (remote, tag) => {
  const directReference = `refs/tags/${tag}`;
  const peeledReference = `${directReference}^{}`;

  const result = spawnSync(
    "git",
    ["ls-remote", "--tags", remote, directReference, peeledReference],
    { cwd: repository, encoding: "utf8" },
  );

  assert.equal(
    result.status,
    0,
    `Could not inspect coordinated release tag ${tag} on ${remote}`,
  );

  const references = new Map(
    result.stdout
      .trim()
      .split("\n")
      .filter(Boolean)
      .map((line) => {
        const [revision, reference] = line.split(/\s+/u);

        return [reference, revision];
      }),
  );

  const revision =
    references.get(peeledReference) ?? references.get(directReference) ?? "";

  assert.match(
    revision,
    /^[\da-f]{40}$/i,
    `Could not resolve coordinated release tag ${tag} on ${remote}`,
  );

  return revision.toLowerCase();
};

const releaseRevision = releaseRemote
  ? resolveRemoteTag(releaseRemote, releaseRef)
  : resolveCommit(releaseRef, "release");

assert.equal(
  candidateRevision,
  releaseRevision,
  `Initial Lumen 2.0.0 publication and ${releaseRef} must resolve to the same Git commit`,
);

process.stdout.write(
  `Initial Lumen 2.0.0 publication is coordinated with ${releaseRef} at ${releaseRevision}.\n`,
);
