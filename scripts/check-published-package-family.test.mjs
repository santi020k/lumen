import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
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

const withReleaseManifest = async (callback, version = "2.0.0") => {
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
              expectedPackages.map(({ name }) => [
                name,
                { peerDependencies: {}, version },
              ]),
            ),
          },
          version,
        },
      },
      null,
      2,
    )}\n`,
  );

  try {
    return await callback(manifestPath);
  } finally {
    await rm(directory, { force: true, recursive: true });
  }
};

const runChecker = (manifestPath, publishedPackages, version = "2.0.0", extraArguments = []) =>
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
      ...extraArguments,
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

test("accepts the complete coordinated Lumen 3 npm family", async () => {
  const publishedPackages = expectedPackages.map((entry) => ({
    ...entry,
    version: "3.0.0",
  }));

  const result = await withReleaseManifest(
    (manifestPath) => runChecker(manifestPath, publishedPackages, "3.0.0"),
    "3.0.0",
  );

  assert.equal(result.status, 0, result.stderr);

  assert.match(result.stdout, /Verified all 3 coordinated npm packages at 3\.0\.0/);
});

test("accepts the complete coordinated Lumen 4 npm family", async () => {
  const publishedPackages = expectedPackages.map((entry) => ({
    ...entry,
    version: "4.0.0",
  }));

  const result = await withReleaseManifest(
    (manifestPath) => runChecker(manifestPath, publishedPackages, "4.0.0"),
    "4.0.0",
  );

  assert.equal(result.status, 0, result.stderr);

  assert.match(result.stdout, /Verified all 3 coordinated npm packages at 4\.0\.0/);
});

test("rejects partial initial Lumen 4 publication", async () => {
  const publishedPackages = expectedPackages.slice(0, -1).map((entry) => ({
    ...entry,
    version: "4.0.0",
  }));

  const result = await withReleaseManifest(
    (manifestPath) => runChecker(manifestPath, publishedPackages, "4.0.0"),
    "4.0.0",
  );

  assert.equal(result.status, 1);

  assert.match(
    result.stderr,
    /Initial Lumen 4 publication must publish the complete coordinated npm package family/,
  );
});

for (const newlyPublishedCount of [0, 1, expectedPackages.length]) {
  test(`audits the complete v4 registry family after ${newlyPublishedCount} new publications`, async () => {
    const packages = expectedPackages.map((entry) => ({ ...entry, version: "4.0.0" }));

    await withReleaseManifest(async (manifestPath) => {
      const selected = runChecker(manifestPath, packages.slice(0, newlyPublishedCount), "4.0.0", ["--audit-packages"]);

      assert.equal(selected.status, 0, selected.stderr);

      assert.deepEqual(JSON.parse(selected.stdout), [...packages].sort((left, right) => left.name.localeCompare(right.name)));

      const lockfilePath = resolve(manifestPath, "..", "package-lock.json");

      await writeFile(lockfilePath, JSON.stringify({
        packages: Object.fromEntries(packages.map((entry) => [
          `node_modules/${entry.name}`, { version: entry.version },
        ])),
      }));

      const verified = runChecker(manifestPath, [], "4.0.0", ["--lockfile", lockfilePath]);

      assert.equal(verified.status, 0, verified.stderr);

      assert.match(verified.stdout, /Verified all 3 coordinated npm packages at 4\.0\.0/);
    }, "4.0.0");
  });
}

for (const invalidVersion of [undefined, "3.0.0"]) {
  test(`rejects an incomplete v4 registry audit with installed version ${invalidVersion}`, async () => {
    await withReleaseManifest(async (manifestPath) => {
      const lockfilePath = resolve(manifestPath, "..", "package-lock.json");
      const packages = expectedPackages.map((entry) => ({ ...entry, version: "4.0.0" }));
      const installed = packages.slice(0, -1);

      if (invalidVersion) installed.push({ ...packages.at(-1), version: invalidVersion });

      await writeFile(lockfilePath, JSON.stringify({
        packages: Object.fromEntries(installed.map((entry) => [
          `node_modules/${entry.name}`, { version: entry.version },
        ])),
      }));

      const result = runChecker(manifestPath, [], "4.0.0", ["--lockfile", lockfilePath]);

      assert.equal(result.status, 1);

      assert.match(result.stderr, /must publish the complete coordinated npm package family/);
    }, "4.0.0");
  });
}

test("ordinary releases audit only their new publications", async () => {
  const packages = [{ name: "@santi020k/lumen", version: "4.0.1" }];

  const result = await withReleaseManifest((manifestPath) =>
    runChecker(manifestPath, packages, "4.0.1", ["--audit-packages"]), "4.0.1");

  assert.equal(result.status, 0, result.stderr);

  assert.deepEqual(JSON.parse(result.stdout), packages);
});

test("ordinary no-op releases have no new publication audit", async () => {
  const result = await withReleaseManifest((manifestPath) =>
    runChecker(manifestPath, [], "4.0.1", ["--audit-packages"]), "4.0.1");

  assert.equal(result.status, 0, result.stderr);

  assert.deepEqual(JSON.parse(result.stdout), []);
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

const v5Contract = JSON.parse(await readFile(new URL('../registry/lumen-5-contract.json', import.meta.url), 'utf8'));

const v5Packages = Object.entries(v5Contract.npmPublicationVersions)
  .map(([name, version]) => ({ name, version }))
  .sort((left, right) => left.name.localeCompare(right.name));

const withV5Manifest = callback => withReleaseManifest(async manifestPath => {
  await writeFile(manifestPath, JSON.stringify({
    release: { version: '5.0.0', npm: { packages: Object.fromEntries([
      ...v5Packages.map(({ name, version }) => [name, { version }]),
      ['@santi020k/lumen-tokens', { version: '4.0.0' }]
    ]) } }
  }));

  return callback(manifestPath);
}, '5.0.0');

for (const count of [0, 1, v5Packages.length]) {
  test(`audits every reviewed mixed-version v5 package after ${count} new publications`, async () => {
    await withV5Manifest(async manifestPath => {
      const selected = runChecker(manifestPath, v5Packages.slice(0, count), '5.0.0', ['--audit-packages']);

      assert.equal(selected.status, 0, selected.stderr);

      assert.deepEqual(JSON.parse(selected.stdout), v5Packages);

      assert.equal(v5Packages.length, 9);

      assert.equal(v5Packages.some(entry => entry.name === '@santi020k/lumen-tokens'), false);

      const lockfilePath = resolve(manifestPath, '..', 'package-lock.json');

      await writeFile(lockfilePath, JSON.stringify({ packages: Object.fromEntries(v5Packages.map(entry => [
        `node_modules/${entry.name}`, { version: entry.version }
      ])) }));

      const verified = runChecker(manifestPath, [], '5.0.0', ['--lockfile', lockfilePath]);

      assert.equal(verified.status, 0, verified.stderr);
    });
  });
}

test('accepts the complete initial mixed-version v5 publication', async () => {
  const result = await withV5Manifest(manifestPath => runChecker(manifestPath, v5Packages, '5.0.0'));

  assert.equal(result.status, 0, result.stderr);
});

for (const invalidVersion of [undefined, '5.0.0']) {
  test(`rejects a missing or wrong v5 companion version ${invalidVersion}`, async () => {
    await withV5Manifest(async manifestPath => {
      const companion = '@santi020k/lumen-react-hook-form';
      const installed = v5Packages.filter(entry => entry.name !== companion);

      if (invalidVersion) installed.push({ name: companion, version: invalidVersion });

      const lockfilePath = resolve(manifestPath, '..', 'package-lock.json');

      await writeFile(lockfilePath, JSON.stringify({ packages: Object.fromEntries(installed.map(entry => [
        `node_modules/${entry.name}`, { version: entry.version }
      ])) }));

      const result = runChecker(manifestPath, [], '5.0.0', ['--lockfile', lockfilePath]);

      assert.equal(result.status, 1);

      assert.match(result.stderr, /must publish the complete coordinated npm package family/);
    });
  });
}

test('rejects v5 manifest drift from the reviewed publication set', async () => {
  await withV5Manifest(async manifestPath => {
    const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));

    manifest.release.npm.packages['@santi020k/lumen-react-hook-form'].version = '5.0.0';

    await writeFile(manifestPath, JSON.stringify(manifest));

    const result = runChecker(manifestPath, [], '5.0.0', ['--audit-packages']);

    assert.equal(result.status, 1);

    assert.match(result.stderr, /must match the reviewed v5 publication version/);
  });
});
