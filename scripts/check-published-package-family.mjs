import assert from "node:assert/strict";
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

const version =
  readArgument("--version") ??
  JSON.parse(
    await readFile(
      resolve(repositoryRoot, "packages", "lumen", "package.json"),
      "utf8",
    ),
  ).version;

const auditPackagesMode = process.argv.includes("--audit-packages");
const lockfileArgument = readArgument("--lockfile");

const publishedPackagesSource =
  readArgument("--published-packages") ?? process.env.PUBLISHED_PACKAGES;

const readPublishedPackages = (source) => {
  const entries = JSON.parse(source);

  assert.ok(Array.isArray(entries), "Changesets published-packages output must be an array");

  return entries.map((entry) => {
    assert.equal(typeof entry?.name, "string", "Every published package requires a name");

    assert.equal(typeof entry.version, "string", `Published package ${entry.name} requires a version`);

    return { name: entry.name, version: entry.version };
  }).sort((left, right) => left.name.localeCompare(right.name));
};

if (!["2.0.0", "3.0.0", "4.0.0"].includes(version)) {
  if (auditPackagesMode) {
    process.stdout.write(`${JSON.stringify(readPublishedPackages(publishedPackagesSource || "[]"))}\n`);

    process.exit(0);
  }

  process.stdout.write(
    `Coordinated npm package-family publication is not required for ${version}.\n`,
  );

  process.exit(0);
}

const releaseManifestPath = resolve(
  repositoryRoot,
  readArgument("--release-manifest") ?? "registry/release-manifest.json",
);

const releaseManifest = JSON.parse(await readFile(releaseManifestPath, "utf8"));

assert.equal(
  releaseManifest.release?.version,
  version,
  "The release manifest version must match the published Lumen version",
);

const expectedPackages = Object.entries(
  releaseManifest.release?.npm?.packages ?? {},
)
  .map(([name, metadata]) => ({ name, version: metadata.version }))
  .sort((left, right) => left.name.localeCompare(right.name));

assert.ok(
  expectedPackages.length > 0,
  "The release manifest must list the coordinated npm package family",
);

for (const entry of expectedPackages) {
  assert.equal(
    entry.version,
    version,
    `${entry.name} must be coordinated at ${version} in the release manifest`,
  );
}

if (auditPackagesMode) {
  process.stdout.write(`${JSON.stringify(expectedPackages)}\n`);

  process.exit(0);
}

let actualPackages;

if (lockfileArgument) {
  const lockfile = JSON.parse(await readFile(resolve(lockfileArgument), "utf8"));

  actualPackages = expectedPackages.map((entry) => ({
    name: entry.name,
    version: lockfile.packages?.[`node_modules/${entry.name}`]?.version,
  }));
} else {
  assert.ok(
    publishedPackagesSource,
    `Initial Lumen ${version.split(".")[0]} publication requires the Changesets published-packages output`,
  );

  actualPackages = readPublishedPackages(publishedPackagesSource);
}

assert.deepEqual(
  actualPackages,
  expectedPackages,
  `Initial Lumen ${version.split(".")[0]} publication must publish the complete coordinated npm package family`,
);

process.stdout.write(
  `Verified all ${expectedPackages.length} coordinated npm packages at ${version}.\n`,
);
