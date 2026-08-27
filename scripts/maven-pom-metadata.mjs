import assert from "node:assert/strict";

const stripXmlComments = (xml, label) => {
  let cursor = 0;
  let source = "";

  while (cursor < xml.length) {
    const start = xml.indexOf("<!--", cursor);

    if (start === -1) {
      source += xml.slice(cursor);

      break;
    }

    source += xml.slice(cursor, start);

    const end = xml.indexOf("-->", start + 4);

    assert.notEqual(end, -1, `${label} must not contain an unterminated comment`);

    const comment = xml.slice(start + 4, end);

    assert.ok(
      !comment.includes("<!--") && !comment.includes("--"),
      `${label} must contain valid XML comments`,
    );

    cursor = end + 3;
  }

  assert.ok(!source.includes("-->"), `${label} must contain valid XML comments`);

  return source.replace(/^\s*<\?xml\s[^?]*\?>/u, "");
};

const readDirectXmlPath = (xml, path, label) => {
  const source = stripXmlComments(xml, label);
  const tagPattern = /<(\/?)((?:[A-Za-z_][\w.-]*:)?[A-Za-z_][\w.-]*)(?:\s[^<>]*?)?(\/?)>/gu;
  const stack = [];
  const values = [];
  let captureStart;
  let match;
  let tokenEnd = 0;

  while ((match = tagPattern.exec(source)) !== null) {
    assert.ok(
      !source.slice(tokenEnd, match.index).includes("<"),
      `${label} must be well-formed XML`,
    );

    tokenEnd = tagPattern.lastIndex;

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

  assert.ok(
    !source.slice(tokenEnd).includes("<"),
    `${label} must be well-formed XML`,
  );

  assert.equal(stack.length, 0, `${label} must be well-formed XML`);

  assert.equal(values.length, 1, `${label} must appear exactly once`);

  return values[0];
};

export const validateMavenPomMetadata = ({ artifactId, pom, version }) => {
  const expectedTag = `compose-v${version}`;

  const artifactMetadata = {
    "lumen-compose": {
      description:
        "Accessible Jetpack Compose foundations and primitives for Lumen UI.",
      name: "Lumen UI for Jetpack Compose",
    },
    "lumen-compose-wear": {
      description: "At-a-glance, accessible wearable primitives for Lumen UI.",
      name: "Lumen UI for Wear OS",
    },
  }[artifactId];

  assert.ok(artifactMetadata, `Unsupported Maven artifact: ${artifactId}`);

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

  for (const [path, expected, label] of [
    [["project", "name"], artifactMetadata.name, "name"],
    [
      ["project", "description"],
      artifactMetadata.description,
      "description",
    ],
    [
      ["project", "licenses", "license", "name"],
      "MIT License",
      "license name",
    ],
    [
      ["project", "licenses", "license", "url"],
      "https://opensource.org/license/mit",
      "license URL",
    ],
    [
      ["project", "licenses", "license", "distribution"],
      "repo",
      "license distribution",
    ],
    [
      ["project", "developers", "developer", "id"],
      "santi020k",
      "developer ID",
    ],
    [
      ["project", "developers", "developer", "name"],
      "Santiago Molina",
      "developer name",
    ],
    [
      ["project", "developers", "developer", "url"],
      "https://santi020k.com",
      "developer URL",
    ],
    [
      ["project", "scm", "connection"],
      "scm:git:https://github.com/santi020k/lumen.git",
      "SCM connection",
    ],
    [
      ["project", "scm", "developerConnection"],
      "scm:git:ssh://git@github.com/santi020k/lumen.git",
      "SCM developer connection",
    ],
  ]) {
    assert.equal(
      readDirectXmlPath(pom, path, `${artifactId} POM ${label}`),
      expected,
      `${artifactId} POM must identify its expected ${label}`,
    );
  }

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
};
