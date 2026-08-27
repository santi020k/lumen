import assert from "node:assert/strict";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const readArgument = (name) => {
  const index = process.argv.indexOf(name);

  if (index === -1) return undefined;

  const value = process.argv[index + 1];

  assert.ok(value && !value.startsWith("--"), `${name} requires a value`);

  return value;
};

const parseVersion = (name, version) => {
  assert.equal(typeof version, "string", `${name} must declare a version`);

  const match =
    /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?$/u.exec(
      version,
    );

  assert.ok(match, `${name} has a non-semantic version: ${version}`);

  return match.slice(1, 4).map(Number);
};

const compareVersions = (left, right) => {
  for (const [index, value] of left.entries()) {
    if (value !== right[index]) return value - right[index];
  }

  return 0;
};

export const synchronizeCoordinatedPackageVersions = ({
  contract,
  manifests,
}) => {
  assert.equal(
    contract.targetVersion,
    "2.0.0",
    "The coordinated version synchronizer only covers Lumen 2",
  );

  const umbrella = manifests.find(
    (manifest) => manifest.name === "@santi020k/lumen",
  );

  assert.ok(
    umbrella,
    "The public package inventory must include @santi020k/lumen",
  );

  if (
    contract.graduation !== undefined ||
    umbrella.version !== contract.targetVersion
  ) {
    return {
      active: false,
      changed: [],
      targetVersion: contract.targetVersion,
    };
  }

  const target = parseVersion("Lumen 2 contract", contract.targetVersion);
  const changed = [];

  for (const manifest of manifests) {
    const current = parseVersion(manifest.name, manifest.version);

    assert.ok(
      compareVersions(current, target) <= 0,
      `${manifest.name} ${manifest.version} is newer than the initial ${contract.targetVersion} milestone`,
    );

    if (manifest.version === contract.targetVersion) continue;

    manifest.version = contract.targetVersion;

    changed.push(manifest.name);
  }

  return { active: true, changed, targetVersion: contract.targetVersion };
};

export const synchronizeComposeVersion = ({ source, targetVersion }) => {
  const lines = source.split("\n");

  const matchingLines = lines
    .map((line, index) => ({ index, line }))
    .filter(({ line }) => line.startsWith("lumenComposeVersion="));

  assert.equal(
    matchingLines.length,
    1,
    "Compose properties must declare lumenComposeVersion exactly once",
  );

  const [{ index, line }] = matchingLines;
  const fromVersion = line.slice("lumenComposeVersion=".length);

  assert.ok(fromVersion, "Compose lumenComposeVersion must not be empty");

  const current = parseVersion("Compose", fromVersion);
  const target = parseVersion("Lumen 2 contract", targetVersion);

  assert.ok(
    compareVersions(current, target) <= 0,
    `Compose ${fromVersion} is newer than the initial ${targetVersion} milestone`,
  );

  if (fromVersion === targetVersion) {
    return { changed: false, fromVersion, source, targetVersion };
  }

  lines[index] = `lumenComposeVersion=${targetVersion}`;

  return {
    changed: true,
    fromVersion,
    source: lines.join("\n"),
    targetVersion,
  };
};

export const synchronizeGeneratedChangelogVersion = ({
  fromVersion,
  packageName,
  source,
  targetVersion,
}) => {
  const firstReleaseHeading = source.indexOf("\n## ");

  assert.notEqual(
    firstReleaseHeading,
    -1,
    `${packageName} changelog must contain a generated release heading`,
  );

  const headingStart = firstReleaseHeading + 1;
  const headingEnd = source.indexOf("\n", headingStart);

  assert.notEqual(
    headingEnd,
    -1,
    `${packageName} changelog release heading must end with a newline`,
  );

  assert.equal(
    source.slice(headingStart, headingEnd),
    `## ${fromVersion}`,
    `${packageName} changelog must lead with the generated ${fromVersion} release`,
  );

  return `${source.slice(0, headingStart)}## ${targetVersion}${source.slice(headingEnd)}`;
};

const run = async () => {
  const repositoryRoot = resolve(
    readArgument("--repository") ?? resolve(import.meta.dirname, ".."),
  );

  const contract = JSON.parse(
    await readFile(
      resolve(repositoryRoot, "registry", "lumen-2-contract.json"),
      "utf8",
    ),
  );

  const packageDirectories = await readdir(
    resolve(repositoryRoot, "packages"),
    {
      withFileTypes: true,
    },
  );

  const packages = [];

  for (const directory of packageDirectories.sort((left, right) =>
    left.name.localeCompare(right.name),
  )) {
    if (!directory.isDirectory()) continue;

    const path = resolve(
      repositoryRoot,
      "packages",
      directory.name,
      "package.json",
    );

    const manifest = JSON.parse(
      await readFile(path, "utf8").catch(() => "null"),
    );

    if (!manifest || manifest.private) continue;

    packages.push({ manifest, originalVersion: manifest.version, path });
  }

  const result = synchronizeCoordinatedPackageVersions({
    contract,
    manifests: packages.map((entry) => entry.manifest),
  });

  if (!result.active) {
    console.log(
      "Coordinated Lumen 2 package and platform version synchronization is not required.",
    );

    return;
  }

  const composePropertiesPath = resolve(
    repositoryRoot,
    "packages",
    "compose",
    "gradle.properties",
  );

  const compose = synchronizeComposeVersion({
    source: await readFile(composePropertiesPath, "utf8"),
    targetVersion: result.targetVersion,
  });

  if (result.changed.length === 0 && !compose.changed) {
    console.log(
      `Public npm packages, Compose, and Wear are already aligned at ${result.targetVersion}.`,
    );

    return;
  }

  const updates = await Promise.all(
    packages
      .filter((entry) => result.changed.includes(entry.manifest.name))
      .map(async (entry) => {
        const changelogPath = resolve(entry.path, "..", "CHANGELOG.md");
        const source = await readFile(changelogPath, "utf8");

        return {
          changelog: synchronizeGeneratedChangelogVersion({
            fromVersion: entry.originalVersion,
            packageName: entry.manifest.name,
            source,
            targetVersion: result.targetVersion,
          }),
          changelogPath,
          entry,
        };
      }),
  );

  await Promise.all([
    ...updates.flatMap(({ changelog, changelogPath, entry }) => [
      writeFile(
        entry.path,
        `${JSON.stringify(entry.manifest, undefined, 2)}\n`,
      ),
      writeFile(changelogPath, changelog),
    ]),
    ...(compose.changed
      ? [writeFile(composePropertiesPath, compose.source)]
      : []),
  ]);

  console.log(
    `Aligned ${result.changed.length} public npm packages plus Compose and Wear at ${result.targetVersion}: ${result.changed.join(", ")}`,
  );
};

if (process.argv[1] === new URL(import.meta.url).pathname) await run();
