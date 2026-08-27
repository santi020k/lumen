import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { validateMavenPomMetadata } from "./maven-pom-metadata.mjs";

const readArgument = (name) => {
  const index = process.argv.indexOf(name);

  if (index === -1) return undefined;

  const value = process.argv[index + 1];

  assert.ok(value && !value.startsWith("--"), `${name} requires a value`);

  return value;
};

const version = readArgument("--version");
const testRoot = readArgument("--test-root");

const repositoryUrl =
  readArgument("--repository-url") ?? "https://repo.maven.apache.org/maven2";

assert.match(
  version ?? "",
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[\dA-Za-z.-]+)?$/u,
  "--version must be an exact semantic version",
);

assert.match(repositoryUrl, /^https:\/\/[^/]+(?:\/[^/]+)*$/u);

if (testRoot) {
  assert.equal(
    process.env.NODE_ENV,
    "test",
    "--test-root is available only under NODE_ENV=test",
  );
}

const groupPath = "com/santi020k";
const artifactIds = ["lumen-compose", "lumen-compose-wear"];

const primarySuffixes = [
  ".aar",
  ".module",
  ".pom",
  "-sources.jar",
  "-javadoc.jar",
];

const readArtifact = async (relativePath) => {
  if (testRoot) {
    try {
      return await readFile(resolve(testRoot, relativePath));
    } catch {
      assert.fail(`Maven release artifact is missing: ${relativePath}`);
    }
  }

  const response = await fetch(`${repositoryUrl}/${relativePath}`);

  assert.ok(
    response.ok,
    `Maven Central artifact is unavailable: ${relativePath} (${response.status})`,
  );

  return Buffer.from(await response.arrayBuffer());
};

for (const artifactId of artifactIds) {
  const coordinatePath = `${groupPath}/${artifactId}/${version}`;
  const prefix = `${coordinatePath}/${artifactId}-${version}`;
  let pom;

  for (const suffix of primarySuffixes) {
    const relativePath = `${prefix}${suffix}`;

    const [contents, checksumContents, signatureContents] = await Promise.all([
      readArtifact(relativePath),
      readArtifact(`${relativePath}.sha512`),
      readArtifact(`${relativePath}.asc`),
    ]);

    const checksum = checksumContents.toString("utf8").trim().toLowerCase();

    assert.match(
      checksum,
      /^[\da-f]{128}$/u,
      `${relativePath}.sha512 must contain a SHA-512 digest`,
    );

    assert.equal(
      createHash("sha512").update(contents).digest("hex"),
      checksum,
      `${relativePath} does not match its Maven Central SHA-512 checksum`,
    );

    const signature = signatureContents.toString("utf8").trim();

    assert.ok(
      signature.startsWith("-----BEGIN PGP SIGNATURE-----") &&
        signature.endsWith("-----END PGP SIGNATURE-----"),
      `${relativePath} requires an armored PGP signature`,
    );

    if (suffix === ".pom") pom = contents.toString("utf8");
  }

  assert.ok(pom, `${artifactId} requires a POM`);

  validateMavenPomMetadata({ artifactId, pom, version });
}

process.stdout.write(
  `Verified 10 signed Maven artifacts and checksums for Compose ${version} at compose-v${version}.\n`,
);
