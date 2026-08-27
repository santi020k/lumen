import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import test from "node:test";

const repositoryRoot = resolve(import.meta.dirname, "..");

const checkerPath = resolve(
  repositoryRoot,
  "scripts",
  "check-maven-release-artifacts.mjs",
);

const version = "2.0.0";
const artifactIds = ["lumen-compose", "lumen-compose-wear"];

const primarySuffixes = [
  ".aar",
  ".module",
  ".pom",
  "-sources.jar",
  "-javadoc.jar",
];

const pomFor = (artifactId, tag = "compose-v2.0.0") => `<?xml version="1.0"?>
<project>
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
    <tag>${tag}</tag>
    <url>https://github.com/santi020k/lumen/tree/${tag}</url>
  </scm>
</project>
`;

const writeSignedArtifact = async (path, contents) => {
  await mkdir(dirname(path), { recursive: true });

  await Promise.all([
    writeFile(path, contents),
    writeFile(
      `${path}.sha512`,
      `${createHash("sha512").update(contents).digest("hex")}\n`,
    ),
    writeFile(
      `${path}.asc`,
      "-----BEGIN PGP SIGNATURE-----\nfixture\n-----END PGP SIGNATURE-----\n",
    ),
  ]);
};

const createRepository = async (mutate = async () => {}) => {
  const directory = await mkdtemp(resolve(tmpdir(), "lumen-maven-release-"));

  for (const artifactId of artifactIds) {
    const prefix = resolve(
      directory,
      "com",
      "santi020k",
      artifactId,
      version,
      `${artifactId}-${version}`,
    );

    for (const suffix of primarySuffixes) {
      const contents =
        suffix === ".pom"
          ? pomFor(artifactId)
          : Buffer.from(`${artifactId}${suffix}`);

      await writeSignedArtifact(`${prefix}${suffix}`, contents);
    }
  }

  await mutate(directory);

  return directory;
};

const runChecker = (directory, nodeEnvironment = "test") =>
  spawnSync(
    process.execPath,
    [checkerPath, "--version", version, "--test-root", directory],
    {
      encoding: "utf8",
      env: { ...process.env, NODE_ENV: nodeEnvironment },
    },
  );

const withRepository = async (mutate, assertion) => {
  const directory = await createRepository(mutate);

  try {
    await assertion(runChecker(directory), directory);
  } finally {
    await rm(directory, { force: true, recursive: true });
  }
};

test("accepts signed artifacts whose checksums and source tags match", async () => {
  await withRepository(
    async () => {},
    (result) => {
      assert.equal(result.status, 0, result.stderr);

      assert.match(result.stdout, /Verified 10 signed Maven artifacts/);
    },
  );
});

test("rejects an artifact whose checksum does not match", async () => {
  await withRepository(
    async (directory) => {
      const artifactPath = resolve(
        directory,
        "com/santi020k/lumen-compose/2.0.0/lumen-compose-2.0.0.aar",
      );

      await writeFile(artifactPath, "changed artifact");
    },
    (result) => {
      assert.equal(result.status, 1);

      assert.match(
        result.stderr,
        /does not match its Maven Central SHA-512 checksum/,
      );
    },
  );
});

test("rejects an artifact without an armored signature", async () => {
  await withRepository(
    async (directory) => {
      const signaturePath = resolve(
        directory,
        "com/santi020k/lumen-compose-wear/2.0.0/lumen-compose-wear-2.0.0.pom.asc",
      );

      await writeFile(signaturePath, "not a signature");
    },
    (result) => {
      assert.equal(result.status, 1);

      assert.match(result.stderr, /requires an armored PGP signature/);
    },
  );
});

test("rejects a POM that points at a different source tag", async () => {
  await withRepository(
    async (directory) => {
      const pomPath = resolve(
        directory,
        "com/santi020k/lumen-compose/2.0.0/lumen-compose-2.0.0.pom",
      );

      await writeSignedArtifact(
        pomPath,
        pomFor("lumen-compose", "compose-v2.0.1"),
      );
    },
    (result) => {
      assert.equal(result.status, 1);

      assert.match(
        result.stderr,
        /must identify the immutable compose-v2\.0\.0 source tag/,
      );
    },
  );
});

test("rejects expected metadata hidden in an XML comment", async () => {
  await withRepository(
    async (directory) => {
      const artifactId = "lumen-compose";

      const pomPath = resolve(
        directory,
        `com/santi020k/${artifactId}/2.0.0/${artifactId}-2.0.0.pom`,
      );

      await writeSignedArtifact(
        pomPath,
        `<?xml version="1.0"?>
<project>
  <!--
  <groupId>com.santi020k</groupId>
  <artifactId>${artifactId}</artifactId>
  <version>${version}</version>
  <tag>compose-v2.0.0</tag>
  <url>https://github.com/santi020k/lumen/tree/compose-v2.0.0</url>
  -->
  <groupId>com.example</groupId>
  <artifactId>unrelated</artifactId>
  <version>9.0.0</version>
  <scm>
    <tag>unrelated-v9.0.0</tag>
    <url>https://github.com/example/unrelated</url>
  </scm>
</project>
`,
      );
    },
    (result) => {
      assert.equal(result.status, 1);

      assert.match(result.stderr, /must identify the Lumen Maven group/);
    },
  );
});

test("rejects coordinates found only in a nested dependency", async () => {
  await withRepository(
    async (directory) => {
      const artifactId = "lumen-compose";

      const pomPath = resolve(
        directory,
        `com/santi020k/${artifactId}/2.0.0/${artifactId}-2.0.0.pom`,
      );

      await writeSignedArtifact(
        pomPath,
        `<?xml version="1.0"?>
<project>
  <groupId>com.santi020k</groupId>
  <artifactId>unrelated</artifactId>
  <version>${version}</version>
  <scm>
    <tag>compose-v2.0.0</tag>
    <url>https://github.com/santi020k/lumen/tree/compose-v2.0.0</url>
  </scm>
  <dependencies>
    <dependency>
      <artifactId>${artifactId}</artifactId>
    </dependency>
  </dependencies>
</project>
`,
      );
    },
    (result) => {
      assert.equal(result.status, 1);

      assert.match(result.stderr, /must identify its published artifact/);
    },
  );
});

test("does not allow fixture repositories outside the test environment", async () => {
  const directory = await createRepository();

  try {
    const result = runChecker(directory, "production");

    assert.equal(result.status, 1);

    assert.match(
      result.stderr,
      /--test-root is available only under NODE_ENV=test/,
    );
  } finally {
    await rm(directory, { force: true, recursive: true });
  }
});
