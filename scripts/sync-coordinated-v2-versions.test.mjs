import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import test from "node:test";

import {
  synchronizeComposeVersion,
  synchronizeCoordinatedPackageVersions,
  synchronizeGeneratedChangelogVersion,
} from "./sync-coordinated-v2-versions.mjs";

const repositoryRoot = resolve(import.meta.dirname, "..");

const synchronizerPath = resolve(
  repositoryRoot,
  "scripts",
  "sync-coordinated-v2-versions.mjs",
);

const releaseManifestGeneratorSource = await readFile(
  resolve(repositoryRoot, "scripts", "generate-release-manifest.mjs"),
  "utf8",
);

test("aligns every public package at the initial coordinated Lumen 2 milestone", () => {
  const manifests = [
    { name: "@santi020k/lumen", version: "2.0.0" },
    { name: "@santi020k/lumen-react-native", version: "1.0.0" },
    { name: "@santi020k/lumen-tokens", version: "1.0.0" },
  ];

  const result = synchronizeCoordinatedPackageVersions({
    contract: { status: "draft", targetVersion: "2.0.0" },
    manifests,
  });

  assert.deepEqual(
    manifests.map((manifest) => manifest.version),
    ["2.0.0", "2.0.0", "2.0.0"],
  );

  assert.deepEqual(result.changed, [
    "@santi020k/lumen-react-native",
    "@santi020k/lumen-tokens",
  ]);
});

test("does not force independent package versions after graduation", () => {
  const manifests = [
    { name: "@santi020k/lumen", version: "2.0.0" },
    { name: "@santi020k/lumen-icons-brand", version: "2.1.0" },
  ];

  const result = synchronizeCoordinatedPackageVersions({
    contract: {
      graduation: { version: "2.0.0" },
      status: "approved",
      targetVersion: "2.0.0",
    },
    manifests,
  });

  assert.deepEqual(result.changed, []);

  assert.equal(manifests[1].version, "2.1.0");
});

test("aligns the shared Compose and Wear version property at 2.0.0", () => {
  assert.deepEqual(
    synchronizeComposeVersion({
      source: "android.useAndroidX=true\nlumenComposeVersion=0.5.0\n",
      targetVersion: "2.0.0",
    }),
    {
      changed: true,
      fromVersion: "0.5.0",
      source: "android.useAndroidX=true\nlumenComposeVersion=2.0.0\n",
      targetVersion: "2.0.0",
    },
  );
});

test("rejects ambiguous Compose version properties", () => {
  assert.throws(
    () =>
      synchronizeComposeVersion({
        source: "lumenComposeVersion=0.5.0\nlumenComposeVersion=0.6.0\n",
        targetVersion: "2.0.0",
      }),
    /must declare lumenComposeVersion exactly once/u,
  );
});

test("does not alter an ordinary pre-2 release plan", () => {
  const manifests = [
    { name: "@santi020k/lumen", version: "1.7.0" },
    { name: "@santi020k/lumen-react-native", version: "1.0.0" },
  ];

  const result = synchronizeCoordinatedPackageVersions({
    contract: { status: "draft", targetVersion: "2.0.0" },
    manifests,
  });

  assert.deepEqual(result.changed, []);

  assert.equal(manifests[1].version, "1.0.0");
});

test("rejects a package newer than the milestone before graduation", () => {
  assert.throws(
    () =>
      synchronizeCoordinatedPackageVersions({
        contract: { status: "draft", targetVersion: "2.0.0" },
        manifests: [
          { name: "@santi020k/lumen", version: "2.0.0" },
          { name: "@santi020k/lumen-react", version: "2.1.0" },
        ],
      }),
    /newer than the initial 2\.0\.0 milestone/u,
  );
});

test("aligns only the newly generated changelog heading", () => {
  const source = `# @santi020k/lumen-tokens

## 1.0.0

New release.

## 1.0.0-rc.0

Historical release.
`;

  assert.equal(
    synchronizeGeneratedChangelogVersion({
      fromVersion: "1.0.0",
      packageName: "@santi020k/lumen-tokens",
      source,
      targetVersion: "2.0.0",
    }),
    source.replace("## 1.0.0\n", "## 2.0.0\n"),
  );
});

test("rejects a changelog whose leading release does not match the generated version", () => {
  assert.throws(
    () =>
      synchronizeGeneratedChangelogVersion({
        fromVersion: "1.0.0",
        packageName: "@santi020k/lumen-tokens",
        source: "# @santi020k/lumen-tokens\n\n## 0.2.0\n",
        targetVersion: "2.0.0",
      }),
    /must lead with the generated 1\.0\.0 release/u,
  );
});

test("the CLI leaves private packages unchanged while aligning public manifests", async () => {
  const temporaryRoot = await mkdtemp(
    resolve(tmpdir(), "lumen-coordinate-v2-"),
  );

  try {
    await Promise.all([
      mkdir(resolve(temporaryRoot, "packages", "compose"), {
        recursive: true,
      }),
      mkdir(resolve(temporaryRoot, "packages", "lumen"), { recursive: true }),
      mkdir(resolve(temporaryRoot, "packages", "private-template"), {
        recursive: true,
      }),
      mkdir(resolve(temporaryRoot, "packages", "tokens"), { recursive: true }),
      mkdir(resolve(temporaryRoot, "registry"), { recursive: true }),
    ]);

    await Promise.all([
      writeFile(
        resolve(temporaryRoot, "packages", "compose", "gradle.properties"),
        "lumenComposeVersion=0.5.0\n",
      ),
      writeFile(
        resolve(temporaryRoot, "packages", "lumen", "package.json"),
        `${JSON.stringify({ name: "@santi020k/lumen", version: "2.0.0" }, null, 2)}\n`,
      ),
      writeFile(
        resolve(temporaryRoot, "packages", "private-template", "package.json"),
        `${JSON.stringify({ name: "@santi020k/private-template", private: true, version: "0.0.1" }, null, 2)}\n`,
      ),
      writeFile(
        resolve(temporaryRoot, "packages", "tokens", "package.json"),
        `${JSON.stringify({ name: "@santi020k/lumen-tokens", version: "1.0.0" }, null, 2)}\n`,
      ),
      writeFile(
        resolve(temporaryRoot, "packages", "tokens", "CHANGELOG.md"),
        "# @santi020k/lumen-tokens\n\n## 1.0.0\n\n### Major Changes\n",
      ),
      writeFile(
        resolve(temporaryRoot, "registry", "lumen-2-contract.json"),
        `${JSON.stringify({ status: "draft", targetVersion: "2.0.0" }, null, 2)}\n`,
      ),
    ]);

    const result = spawnSync(
      process.execPath,
      [synchronizerPath, "--repository", temporaryRoot],
      { encoding: "utf8" },
    );

    assert.equal(result.status, 0, result.stderr);

    assert.match(
      result.stdout,
      /Aligned 1 public npm packages plus Compose and Wear at 2\.0\.0/u,
    );

    const publicManifest = JSON.parse(
      await readFile(
        resolve(temporaryRoot, "packages", "tokens", "package.json"),
        "utf8",
      ),
    );

    const privateManifest = JSON.parse(
      await readFile(
        resolve(temporaryRoot, "packages", "private-template", "package.json"),
        "utf8",
      ),
    );

    const publicChangelog = await readFile(
      resolve(temporaryRoot, "packages", "tokens", "CHANGELOG.md"),
      "utf8",
    );

    const composeProperties = await readFile(
      resolve(temporaryRoot, "packages", "compose", "gradle.properties"),
      "utf8",
    );

    assert.equal(publicManifest.version, "2.0.0");

    assert.match(
      publicChangelog,
      /^# @santi020k\/lumen-tokens\n\n## 2\.0\.0\n/u,
    );

    assert.match(composeProperties, /^lumenComposeVersion=2\.0\.0$/mu);

    assert.equal(privateManifest.version, "0.0.1");
  } finally {
    await rm(temporaryRoot, { force: true, recursive: true });
  }
});

test("aligns the real Changesets exit-prerelease artifacts at 2.0.0", async () => {
  const temporaryRoot = await mkdtemp(
    resolve(tmpdir(), "lumen-changesets-v2-"),
  );

  try {
    await Promise.all([
      mkdir(resolve(temporaryRoot, ".changeset"), { recursive: true }),
      mkdir(resolve(temporaryRoot, "scripts"), { recursive: true }),
      mkdir(resolve(temporaryRoot, "packages", "compose"), {
        recursive: true,
      }),
      mkdir(resolve(temporaryRoot, "packages", "lumen"), { recursive: true }),
      mkdir(resolve(temporaryRoot, "packages", "tokens"), { recursive: true }),
      mkdir(resolve(temporaryRoot, "registry"), { recursive: true }),
    ]);

    const changesetConfig = {
      access: "public",
      baseBranch: "main",
      changelog: "./changelog.cjs",
      commit: false,
      fixed: [],
      ignore: [],
      linked: [],
      updateInternalDependencies: "patch",
    };

    await Promise.all([
      writeFile(
        resolve(temporaryRoot, "packages", "compose", "gradle.properties"),
        "lumenComposeVersion=0.5.0\n",
      ),
      writeFile(
        resolve(temporaryRoot, "package.json"),
        `${JSON.stringify({ name: "fixture", packageManager: "pnpm@10.15.1", private: true }, null, 2)}\n`,
      ),
      writeFile(
        resolve(temporaryRoot, "pnpm-workspace.yaml"),
        "packages:\n  - packages/*\n",
      ),
      writeFile(
        resolve(temporaryRoot, ".changeset", "config.json"),
        `${JSON.stringify(changesetConfig, null, 2)}\n`,
      ),
      writeFile(
        resolve(temporaryRoot, ".changeset", "changelog.cjs"),
        'module.exports = {\n  getDependencyReleaseLine: async () => "",\n  getReleaseLine: async changeset => `- ${changeset.summary}`\n}\n',
      ),
      writeFile(
        resolve(temporaryRoot, ".changeset", "pre.json"),
        `${JSON.stringify({ mode: "exit", tag: "rc" }, null, 2)}\n`,
      ),
      writeFile(
        resolve(temporaryRoot, ".changeset", "coordinated.md"),
        '---\n"@santi020k/lumen": major\n"@santi020k/lumen-tokens": major\n---\n\nCoordinate Lumen 2.\n',
      ),
      writeFile(
        resolve(temporaryRoot, "scripts", "generate-release-manifest.mjs"),
        releaseManifestGeneratorSource,
      ),
      writeFile(
        resolve(temporaryRoot, "packages", "lumen", "package.json"),
        `${JSON.stringify({ name: "@santi020k/lumen", version: "1.7.0-rc.0" }, null, 2)}\n`,
      ),
      writeFile(
        resolve(temporaryRoot, "packages", "lumen", "CHANGELOG.md"),
        "# @santi020k/lumen\n\n## 1.7.0-rc.0\n",
      ),
      writeFile(
        resolve(temporaryRoot, "packages", "tokens", "package.json"),
        `${JSON.stringify({ name: "@santi020k/lumen-tokens", version: "0.2.0-rc.0" }, null, 2)}\n`,
      ),
      writeFile(
        resolve(temporaryRoot, "packages", "tokens", "CHANGELOG.md"),
        "# @santi020k/lumen-tokens\n\n## 0.2.0-rc.0\n",
      ),
      writeFile(
        resolve(temporaryRoot, "registry", "lumen-2-contract.json"),
        `${JSON.stringify(
          {
            releaseMigration: {
              codemod: "lumen migrate v2 --dry-run",
              deprecatedExports: [],
              removedExports: [],
              runtime: {
                astro: "Load the Astro runtime.",
                elements: "Register the Elements catalog.",
                react: "Use the React behavior hooks.",
              },
            },
            status: "draft",
            targetVersion: "2.0.0",
          },
          null,
          2,
        )}\n`,
      ),
    ]);

    const changesetResult = spawnSync(
      resolve(repositoryRoot, "node_modules", ".bin", "changeset"),
      ["version"],
      { cwd: temporaryRoot, encoding: "utf8" },
    );

    assert.equal(changesetResult.status, 0, changesetResult.stderr);

    const intermediateTokens = JSON.parse(
      await readFile(
        resolve(temporaryRoot, "packages", "tokens", "package.json"),
        "utf8",
      ),
    );

    assert.equal(intermediateTokens.version, "1.0.0");

    const synchronizationResult = spawnSync(
      process.execPath,
      [synchronizerPath, "--repository", temporaryRoot],
      { encoding: "utf8" },
    );

    assert.equal(synchronizationResult.status, 0, synchronizationResult.stderr);

    for (const packageDirectory of ["lumen", "tokens"]) {
      const manifest = JSON.parse(
        await readFile(
          resolve(temporaryRoot, "packages", packageDirectory, "package.json"),
          "utf8",
        ),
      );

      const changelog = await readFile(
        resolve(temporaryRoot, "packages", packageDirectory, "CHANGELOG.md"),
        "utf8",
      );

      assert.equal(manifest.version, "2.0.0");

      assert.match(changelog, /\n## 2\.0\.0\n/u);
    }

    assert.equal(
      await readFile(
        resolve(temporaryRoot, "packages", "compose", "gradle.properties"),
        "utf8",
      ),
      "lumenComposeVersion=2.0.0\n",
    );

    const generationResult = spawnSync(
      process.execPath,
      [resolve(temporaryRoot, "scripts", "generate-release-manifest.mjs")],
      { cwd: temporaryRoot, encoding: "utf8" },
    );

    assert.equal(generationResult.status, 0, generationResult.stderr);

    const releaseManifest = JSON.parse(
      await readFile(
        resolve(temporaryRoot, "registry", "release-manifest.json"),
        "utf8",
      ),
    );

    assert.equal(releaseManifest.release.version, "2.0.0");

    assert.equal(releaseManifest.release.swift.tag, "v2.0.0");

    assert.equal(releaseManifest.release.compose.version, "2.0.0");

    assert.deepEqual(
      Object.fromEntries(
        Object.entries(releaseManifest.release.npm.packages).map(
          ([name, packageRelease]) => [name, packageRelease.version],
        ),
      ),
      {
        "@santi020k/lumen": "2.0.0",
        "@santi020k/lumen-tokens": "2.0.0",
      },
    );
  } finally {
    await rm(temporaryRoot, { force: true, recursive: true });
  }
});
