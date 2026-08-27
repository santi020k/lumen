import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import test from "node:test";

// cspell:words dsse SLSA

const repositoryRoot = resolve(import.meta.dirname, "..");

const checkerPath = resolve(
  repositoryRoot,
  "scripts",
  "check-npm-release-provenance.mjs",
);

const packageName = "@santi020k/lumen-react-native";
const version = "2.0.0";
const revision = "a".repeat(40);

const digestBytes = createHash("sha512")
  .update("lumen release tarball")
  .digest();

const integrity = `sha512-${digestBytes.toString("base64")}`;
const digest = digestBytes.toString("hex");

const createStatement = (overrides = {}) => ({
  _type: "https://in-toto.io/Statement/v1",
  predicate: {
    buildDefinition: {
      buildType:
        "https://slsa-framework.github.io/github-actions-buildtypes/workflow/v1",
      externalParameters: {
        workflow: {
          path: ".github/workflows/release.yml",
          ref: "refs/heads/main",
          repository: "https://github.com/santi020k/lumen",
        },
      },
      resolvedDependencies: [
        {
          digest: { gitCommit: revision },
          uri: "git+https://github.com/santi020k/lumen@refs/heads/main",
        },
      ],
    },
    runDetails: {
      builder: { id: "https://github.com/actions/runner/github-hosted" },
      metadata: {
        invocationId:
          "https://github.com/santi020k/lumen/actions/runs/123/attempts/1",
      },
    },
  },
  predicateType: "https://slsa.dev/provenance/v1",
  subject: [
    {
      digest: { sha512: digest },
      name: "pkg:npm/%40santi020k/lumen-react-native@2.0.0",
    },
  ],
  ...overrides,
});

const writeFixture = async (directory, statement) => {
  const lockfilePath = resolve(directory, "package-lock.json");
  const attestationsPath = resolve(directory, "attestations.json");

  await Promise.all([
    writeFile(
      lockfilePath,
      `${JSON.stringify(
        {
          lockfileVersion: 3,
          packages: {
            [`node_modules/${packageName}`]: { integrity, version },
          },
        },
        null,
        2,
      )}\n`,
    ),
    writeFile(
      attestationsPath,
      `${JSON.stringify(
        {
          attestations: [
            {
              bundle: {
                dsseEnvelope: {
                  payload: Buffer.from(JSON.stringify(statement)).toString(
                    "base64",
                  ),
                },
              },
              predicateType: "https://slsa.dev/provenance/v1",
            },
          ],
        },
        null,
        2,
      )}\n`,
    ),
  ]);

  return { attestationsPath, lockfilePath };
};

const runChecker = (
  lockfilePath,
  attestationsPath,
  expectedRevision = revision,
  nodeEnvironment = "test",
) =>
  spawnSync(
    process.execPath,
    [
      checkerPath,
      "--package",
      packageName,
      "--version",
      version,
      "--revision",
      expectedRevision,
      "--lockfile",
      lockfilePath,
      "--test-attestations",
      attestationsPath,
    ],
    {
      encoding: "utf8",
      env: { ...process.env, NODE_ENV: nodeEnvironment },
    },
  );

const withFixture = async (
  statement,
  assertion,
  expectedRevision = revision,
  nodeEnvironment = "test",
) => {
  const directory = await mkdtemp(resolve(tmpdir(), "lumen-provenance-"));

  try {
    const paths = await writeFixture(directory, statement);

    await assertion(
      runChecker(
        paths.lockfilePath,
        paths.attestationsPath,
        expectedRevision,
        nodeEnvironment,
      ),
    );
  } finally {
    await rm(directory, { force: true, recursive: true });
  }
};

test("accepts signed provenance for the installed tarball and release revision", async () => {
  await withFixture(createStatement(), (result) => {
    assert.equal(result.status, 0, result.stderr);

    assert.match(result.stdout, /Verified signed npm provenance/);
  });
});

test("does not allow fixture attestations outside the test environment", async () => {
  await withFixture(
    createStatement(),
    (result) => {
      assert.equal(result.status, 1);

      assert.match(
        result.stderr,
        /--test-attestations is available only under NODE_ENV=test/,
      );
    },
    revision,
    "production",
  );
});

test("rejects provenance from a different release revision", async () => {
  await withFixture(
    createStatement(),
    (result) => {
      assert.equal(result.status, 1);

      assert.match(result.stderr, /must resolve the release revision/);
    },
    "b".repeat(40),
  );
});

test("rejects provenance whose subject digest differs from the installed tarball", async () => {
  const statement = createStatement();

  statement.subject[0].digest.sha512 = "b".repeat(128);

  await withFixture(statement, (result) => {
    assert.equal(result.status, 1);

    assert.match(result.stderr, /digest must match the installed npm tarball/);
  });
});

test("rejects provenance produced by a different workflow", async () => {
  const statement = createStatement();

  statement.predicate.buildDefinition.externalParameters.workflow.path =
    ".github/workflows/untrusted.yml";

  await withFixture(statement, (result) => {
    assert.equal(result.status, 1);

    assert.match(result.stderr, /release\.yml/);
  });
});

test("rejects provenance produced from a different workflow ref", async () => {
  const statement = createStatement();

  statement.predicate.buildDefinition.externalParameters.workflow.ref =
    "refs/heads/release/v2.0.0";

  await withFixture(statement, (result) => {
    assert.equal(result.status, 1);

    assert.match(result.stderr, /must use the release branch refs\/heads\/main/);
  });
});

test("rejects provenance whose source URI names a different ref", async () => {
  const statement = createStatement();

  statement.predicate.buildDefinition.resolvedDependencies[0].uri =
    "git+https://github.com/santi020k/lumen@refs/heads/release/v2.0.0";

  await withFixture(statement, (result) => {
    assert.equal(result.status, 1);

    assert.match(result.stderr, /must use the exact Lumen release branch/);
  });
});
