import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

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

const expectedTag = `compose-v${version}`;
const groupPath = "com/santi020k";
const artifactIds = ["lumen-compose", "lumen-compose-wear"];

const primarySuffixes = [
  ".aar",
  ".module",
  ".pom",
  "-sources.jar",
  "-javadoc.jar",
];

const readDirectXmlPath = (xml, path, label) => {
  const source = xml.replace(/<!--[\s\S]*?-->/gu, "");
  const tagPattern = /<(\/?)((?:[A-Za-z_][\w.-]*:)?[A-Za-z_][\w.-]*)(?:\s[^<>]*?)?(\/?)>/gu;
  const stack = [];
  const values = [];
  let captureStart;
  let match;

  while ((match = tagPattern.exec(source)) !== null) {
    const [, closing, name, selfClosing] = match;

    if (closing) {
      assert.equal(stack.at(-1), name, `${label} must be well-formed XML`);

      if (
        captureStart !== undefined &&
        stack.length === path.length &&
        stack.every((entry, index) => entry === path[index])
      ) {
        const value = source.slice(captureStart, match.index).trim();

        assert.ok(!value.includes("<"), `${label} must contain plain text`);

        values.push(value);

        captureStart = undefined;
      }

      stack.pop();

      continue;
    }

    if (selfClosing) continue;

    stack.push(name);

    if (
      stack.length === path.length &&
      stack.every((entry, index) => entry === path[index])
    ) {
      captureStart = tagPattern.lastIndex;
    }
  }

  assert.equal(stack.length, 0, `${label} must be well-formed XML`);

  assert.equal(values.length, 1, `${label} must appear exactly once`);

  return values[0];
};

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

  assert.equal(
    readDirectXmlPath(pom, ["project", "groupId"], `${artifactId} POM groupId`),
    "com.santi020k",
    `${artifactId} POM must identify the Lumen Maven group`,
  );

  assert.equal(
    readDirectXmlPath(
      pom,
      ["project", "artifactId"],
      `${artifactId} POM artifactId`,
    ),
    artifactId,
    `${artifactId} POM must identify its published artifact`,
  );

  assert.equal(
    readDirectXmlPath(pom, ["project", "version"], `${artifactId} POM version`),
    version,
    `${artifactId} POM must identify the published version`,
  );

  assert.equal(
    readDirectXmlPath(pom, ["project", "scm", "tag"], `${artifactId} POM SCM tag`),
    expectedTag,
    `${artifactId} POM must identify the immutable ${expectedTag} source tag`,
  );

  assert.equal(
    readDirectXmlPath(pom, ["project", "scm", "url"], `${artifactId} POM SCM URL`),
    `https://github.com/santi020k/lumen/tree/${expectedTag}`,
    `${artifactId} POM must browse the immutable source tag`,
  );
}

process.stdout.write(
  `Verified 10 signed Maven artifacts and checksums for Compose ${version} at ${expectedTag}.\n`,
);
