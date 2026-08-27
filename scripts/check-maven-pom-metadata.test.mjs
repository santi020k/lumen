import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import test from "node:test";

const checkerPath = resolve(
  import.meta.dirname,
  "check-maven-pom-metadata.mjs",
);

const version = "2.0.0";

const pomFor = (artifactId) => `<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0">
  <modelVersion>4.0.0</modelVersion>
  <groupId>com.santi020k</groupId>
  <artifactId>${artifactId}</artifactId>
  <version>${version}</version>
  <name>${artifactId === "lumen-compose" ? "Lumen UI for Jetpack Compose" : "Lumen UI for Wear OS"}</name>
  <description>${artifactId === "lumen-compose" ? "Accessible Jetpack Compose foundations and primitives for Lumen UI." : "At-a-glance, accessible wearable primitives for Lumen UI."}</description>
  <licenses>
    <license>
      <name>MIT License</name>
      <url>https://opensource.org/license/mit</url>
      <distribution>repo</distribution>
    </license>
  </licenses>
  <developers>
    <developer>
      <id>santi020k</id>
      <name>Santiago Molina</name>
      <url>https://santi020k.com</url>
    </developer>
  </developers>
  <scm>
    <connection>scm:git:https://github.com/santi020k/lumen.git</connection>
    <developerConnection>scm:git:ssh://git@github.com/santi020k/lumen.git</developerConnection>
    <tag>compose-v${version}</tag>
    <url>https://github.com/santi020k/lumen/tree/compose-v${version}</url>
  </scm>
</project>
`;

const withPoms = async (mutate, callback) => {
  const directory = await mkdtemp(resolve(tmpdir(), "lumen-maven-poms-"));
  const artifacts = ["lumen-compose", "lumen-compose-wear"];

  try {
    const poms = Object.fromEntries(
      artifacts.map((artifactId) => [artifactId, pomFor(artifactId)]),
    );

    mutate(poms);

    await Promise.all(
      artifacts.map((artifactId) =>
        writeFile(resolve(directory, `${artifactId}.pom`), poms[artifactId]),
      ),
    );

    const arguments_ = [checkerPath, "--version", version];

    for (const artifactId of artifacts) {
      arguments_.push(
        "--artifact-id",
        artifactId,
        "--pom",
        resolve(directory, `${artifactId}.pom`),
      );
    }

    await callback(
      spawnSync(process.execPath, arguments_, { encoding: "utf8" }),
    );
  } finally {
    await rm(directory, { force: true, recursive: true });
  }
};

test("accepts both generated publication POM shapes", async () => {
  await withPoms(
    () => {},
    (result) => {
      assert.equal(result.status, 0, result.stderr);

      assert.match(result.stdout, /Verified structural Maven metadata/);
    },
  );
});

test("rejects source metadata hidden in an unterminated comment", async () => {
  await withPoms(
    (poms) => {
      poms["lumen-compose"] = `<project>
  <!--
  <groupId>com.santi020k</groupId>
  <artifactId>lumen-compose</artifactId>
  <version>2.0.0</version>
  <scm>
    <tag>compose-v2.0.0</tag>
    <url>https://github.com/santi020k/lumen/tree/compose-v2.0.0</url>
  </scm>
</project>`;
    },
    (result) => {
      assert.equal(result.status, 1);

      assert.match(result.stderr, /must not contain an unterminated comment/);
    },
  );
});

test("rejects direct coordinates replaced by dependency metadata", async () => {
  await withPoms(
    (poms) => {
      poms["lumen-compose-wear"] = pomFor("unrelated").replace(
        "</project>",
        `  <dependencies>
    <dependency>
      <artifactId>lumen-compose-wear</artifactId>
    </dependency>
  </dependencies>
</project>`,
      );
    },
    (result) => {
      assert.equal(result.status, 1);

      assert.match(result.stderr, /must identify its published artifact/);
    },
  );
});
