import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import test from "node:test";

const repositoryRoot = resolve(import.meta.dirname, "..");

const checkerPath = resolve(
  repositoryRoot,
  "scripts",
  "check-published-package-family.mjs",
);

const expectedPackages = [
  { name: "@santi020k/lumen", version: "2.0.0" },
  { name: "@santi020k/lumen-core", version: "2.0.0" },
  { name: "@santi020k/lumen-react", version: "2.0.0" },
];

const withReleaseManifest = async (callback) => {
  const directory = await mkdtemp(
    resolve(tmpdir(), "lumen-published-package-family-"),
  );

  const manifestPath = resolve(directory, "release-manifest.json");

  await writeFile(
    manifestPath,
    `${JSON.stringify(
      {
        schemaVersion: 1,
        release: {
          npm: {
            packages: Object.fromEntries(
              expectedPackages.map(({ name, version }) => [
                name,
                { peerDependencies: {}, version },
              ]),
            ),
          },
          version: "2.0.0",
        },
      },
      null,
      2,
    )}\n`,
  );

  try {
    return callback(manifestPath);
  } finally {
    await rm(directory, { force: true, recursive: true });
  }
};

const runChecker = (manifestPath, publishedPackages, version = "2.0.0") =>
  spawnSync(
    process.execPath,
    [
      checkerPath,
      "--version",
      version,
      "--release-manifest",
      manifestPath,
      "--published-packages",
      JSON.stringify(publishedPackages),
    ],
    { cwd: repositoryRoot, encoding: "utf8" },
  );

test("accepts the complete coordinated Lumen 2 npm family", async () => {
  const result = await withReleaseManifest((manifestPath) =>
    runChecker(manifestPath, expectedPackages),
  );

  assert.equal(result.status, 0, result.stderr);

  assert.match(result.stdout, /Verified all 3 coordinated npm packages/);
});

test("rejects a missing package after a partial initial publication", async () => {
  const result = await withReleaseManifest((manifestPath) =>
    runChecker(manifestPath, expectedPackages.slice(0, -1)),
  );

  assert.equal(result.status, 1);

  assert.match(
    result.stderr,
    /must publish the complete coordinated npm package family/,
  );
});

test("rejects a published package at the wrong version", async () => {
  const result = await withReleaseManifest((manifestPath) =>
    runChecker(manifestPath, [
      expectedPackages[0],
      expectedPackages[1],
      { ...expectedPackages[2], version: "1.9.0" },
    ]),
  );

  assert.equal(result.status, 1);

  assert.match(
    result.stderr,
    /must publish the complete coordinated npm package family/,
  );
});

test("rejects duplicate or unexpected package output", async () => {
  const result = await withReleaseManifest((manifestPath) =>
    runChecker(manifestPath, [...expectedPackages, expectedPackages[0]]),
  );

  assert.equal(result.status, 1);

  assert.match(
    result.stderr,
    /must publish the complete coordinated npm package family/,
  );
});

test("does not require full-family publication after the initial milestone", async () => {
  const result = await withReleaseManifest((manifestPath) =>
    runChecker(manifestPath, [expectedPackages[0]], "2.1.0"),
  );

  assert.equal(result.status, 0, result.stderr);

  assert.match(result.stdout, /not required for 2\.1\.0/);
});
