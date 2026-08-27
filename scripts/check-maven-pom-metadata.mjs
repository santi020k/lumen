import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { validateMavenPomMetadata } from "./maven-pom-metadata.mjs";

const readArguments = (name) =>
  process.argv.flatMap((argument, index) =>
    argument === name ? [process.argv[index + 1]] : [],
  );

const versionArguments = readArguments("--version");
const artifactIds = readArguments("--artifact-id");
const pomPaths = readArguments("--pom");

assert.equal(versionArguments.length, 1, "--version must appear exactly once");

assert.equal(
  artifactIds.length,
  pomPaths.length,
  "Every --artifact-id requires one matching --pom",
);

assert.ok(artifactIds.length > 0, "At least one POM must be provided");

const [version] = versionArguments;

assert.match(
  version,
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[\dA-Za-z.-]+)?$/u,
  "--version must be an exact semantic version",
);

for (const [index, artifactId] of artifactIds.entries()) {
  assert.match(
    artifactId,
    /^lumen-compose(?:-wear)?$/u,
    `Unsupported Maven artifact: ${artifactId}`,
  );

  validateMavenPomMetadata({
    artifactId,
    pom: await readFile(pomPaths[index], "utf8"),
    version,
  });
}

process.stdout.write(
  `Verified structural Maven metadata for ${artifactIds.join(", ")} ${version}.\n`,
);
