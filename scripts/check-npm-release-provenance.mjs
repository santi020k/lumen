import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

// cspell:words dsse SLSA

const readArgument = (name) => {
  const index = process.argv.indexOf(name);

  if (index === -1) return undefined;

  const value = process.argv[index + 1];

  assert.ok(value && !value.startsWith("--"), `${name} requires a value`);

  return value;
};

const packageName = readArgument("--package");
const version = readArgument("--version");
const revision = readArgument("--revision");
const lockfileArgument = readArgument("--lockfile");
const testAttestationsArgument = readArgument("--test-attestations");

const repositoryUrl =
  readArgument("--repository-url") ?? "https://github.com/santi020k/lumen";

const workflowPath =
  readArgument("--workflow-path") ?? ".github/workflows/release.yml";

assert.match(
  packageName ?? "",
  /^(?:@[a-z0-9][a-z0-9._-]*\/)?[a-z0-9][a-z0-9._-]*$/u,
  "--package must be an npm package name",
);

assert.match(
  version ?? "",
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[\dA-Za-z.-]+)?$/u,
  "--version must be an exact semantic version",
);

assert.match(
  revision ?? "",
  /^[\da-f]{40}$/u,
  "--revision must be a full lowercase Git revision",
);

assert.ok(lockfileArgument, "--lockfile is required");

assert.match(repositoryUrl, /^https:\/\/github\.com\/[^/]+\/[^/]+$/u);

assert.match(workflowPath, /^\.github\/workflows\/[\w.-]+\.ya?ml$/u);

if (testAttestationsArgument) {
  assert.equal(
    process.env.NODE_ENV,
    "test",
    "--test-attestations is available only under NODE_ENV=test",
  );
}

const lockfilePath = resolve(lockfileArgument);
const lockfile = JSON.parse(await readFile(lockfilePath, "utf8"));
const installedPackage = lockfile.packages?.[`node_modules/${packageName}`];

assert.equal(
  installedPackage?.version,
  version,
  `${packageName} lockfile entry must use ${version}`,
);

assert.match(
  installedPackage?.integrity ?? "",
  /^sha512-[\d+/A-Za-z]+={0,2}$/u,
  `${packageName}@${version} requires a SHA-512 lockfile integrity`,
);

if (!testAttestationsArgument) {
  const audit = spawnSync("npm", ["audit", "signatures", "--json"], {
    cwd: dirname(lockfilePath),
    encoding: "utf8",
  });

  if (audit.status !== 0) {
    process.stderr.write(audit.stdout);

    process.stderr.write(audit.stderr);
  }

  assert.equal(
    audit.status,
    0,
    `npm signature and provenance verification failed for ${packageName}@${version}`,
  );
}

const attestations = testAttestationsArgument
  ? JSON.parse(await readFile(resolve(testAttestationsArgument), "utf8"))
  : await fetch(
      `https://registry.npmjs.org/-/npm/v1/attestations/${encodeURIComponent(packageName)}@${version}`,
    ).then((response) => {
      assert.ok(
        response.ok,
        `Could not fetch npm attestations for ${packageName}@${version}: ${response.status}`,
      );

      return response.json();
    });

assert.ok(
  Array.isArray(attestations.attestations),
  "Invalid npm attestation response",
);

const provenanceEntry = attestations.attestations.find(
  (entry) => entry.predicateType === "https://slsa.dev/provenance/v1",
);

assert.ok(
  provenanceEntry?.bundle?.dsseEnvelope?.payload,
  `${packageName}@${version} requires signed SLSA provenance`,
);

const statement = JSON.parse(
  Buffer.from(provenanceEntry.bundle.dsseEnvelope.payload, "base64").toString(
    "utf8",
  ),
);

assert.equal(statement.predicateType, "https://slsa.dev/provenance/v1");

const expectedSubjectName = `pkg:npm/${packageName.startsWith("@") ? `%40${packageName.slice(1)}` : packageName}@${version}`;

const expectedDigest = Buffer.from(
  installedPackage.integrity.slice("sha512-".length),
  "base64",
).toString("hex");

const subject = statement.subject?.find(
  (candidate) => candidate.name === expectedSubjectName,
);

assert.ok(subject, `SLSA provenance must identify ${expectedSubjectName}`);

assert.equal(
  subject.digest?.sha512,
  expectedDigest,
  "SLSA provenance digest must match the installed npm tarball",
);

const buildDefinition = statement.predicate?.buildDefinition;
const workflow = buildDefinition?.externalParameters?.workflow;

assert.equal(
  buildDefinition?.buildType,
  "https://slsa-framework.github.io/github-actions-buildtypes/workflow/v1",
  "npm provenance must use the GitHub Actions workflow build type",
);

assert.equal(workflow?.repository, repositoryUrl);

assert.equal(workflow?.path, workflowPath);

const source = buildDefinition?.resolvedDependencies?.find(
  (dependency) => dependency.digest?.gitCommit === revision,
);

assert.ok(
  source,
  `npm provenance must resolve the release revision ${revision}`,
);

assert.ok(
  source.uri?.startsWith(`git+${repositoryUrl}@`),
  "npm provenance source must use the Lumen repository",
);

assert.equal(
  statement.predicate?.runDetails?.builder?.id,
  "https://github.com/actions/runner/github-hosted",
  "npm provenance must be produced by a GitHub-hosted Actions runner",
);

assert.ok(
  statement.predicate?.runDetails?.metadata?.invocationId?.startsWith(
    `${repositoryUrl}/actions/runs/`,
  ),
  "npm provenance must identify its Lumen release workflow run",
);

process.stdout.write(
  `Verified signed npm provenance for ${packageName}@${version} from ${revision}.\n`,
);
