import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import test from "node:test";

const repositoryRoot = resolve(import.meta.dirname, "..");

const checkerPath = resolve(
  repositoryRoot,
  "scripts",
  "check-coordinated-release-revision.mjs",
);

const run = (command, arguments_, cwd) =>
  spawnSync(command, arguments_, {
    cwd,
    encoding: "utf8",
  });

const runChecker = (arguments_, cwd) =>
  run(process.execPath, [checkerPath, ...arguments_], cwd);

const createRepository = async () => {
  const directory = await mkdtemp(
    resolve(tmpdir(), "lumen-coordinated-release-"),
  );

  assert.equal(
    run("git", ["init", "--initial-branch=main"], directory).status,
    0,
  );

  assert.equal(
    run(
      "git",
      ["config", "user.email", "release-test@santi020k.com"],
      directory,
    ).status,
    0,
  );

  assert.equal(
    run("git", ["config", "user.name", "Lumen Release Test"], directory).status,
    0,
  );

  await writeFile(resolve(directory, "release.txt"), "candidate\n");

  assert.equal(run("git", ["add", "release.txt"], directory).status, 0);

  assert.equal(
    run(
      "git",
      ["commit", "--message", "test: add release candidate"],
      directory,
    ).status,
    0,
  );

  return directory;
};

test("does not require coordinated refs before the initial stable major", async () => {
  const directory = await mkdtemp(resolve(tmpdir(), "lumen-pre-v2-release-"));

  try {
    const result = runChecker(["--version", "1.9.0"], directory);

    assert.equal(result.status, 0, result.stderr);

    assert.match(result.stdout, /not required for 1\.9\.0/);
  } finally {
    await rm(directory, { force: true, recursive: true });
  }
});

test("accepts an annotated v2.0.0 tag on the candidate commit", async () => {
  const directory = await createRepository();

  try {
    assert.equal(
      run("git", ["tag", "-a", "v2.0.0", "-m", "Release v2.0.0"], directory)
        .status,
      0,
    );

    const result = runChecker(
      ["--version", "2.0.0", "--repository", directory],
      directory,
    );

    assert.equal(result.status, 0, result.stderr);

    assert.match(
      result.stdout,
      /Initial Compose 2\.0\.0 is coordinated with v2\.0\.0/,
    );
  } finally {
    await rm(directory, { force: true, recursive: true });
  }
});

test("rejects initial Compose publication without the repository release tag", async () => {
  const directory = await createRepository();

  try {
    const result = runChecker(
      ["--version", "2.0.0", "--repository", directory],
      directory,
    );

    assert.equal(result.status, 1);

    assert.match(
      result.stderr,
      /Could not resolve coordinated release ref v2\.0\.0/,
    );
  } finally {
    await rm(directory, { force: true, recursive: true });
  }
});

test("rejects Compose 2.0.0 from a different commit than v2.0.0", async () => {
  const directory = await createRepository();

  try {
    assert.equal(run("git", ["tag", "v2.0.0"], directory).status, 0);

    await writeFile(resolve(directory, "release.txt"), "different candidate\n");

    assert.equal(run("git", ["add", "release.txt"], directory).status, 0);

    assert.equal(
      run(
        "git",
        ["commit", "--message", "test: diverge release candidate"],
        directory,
      ).status,
      0,
    );

    const result = runChecker(
      ["--version", "2.0.0", "--repository", directory],
      directory,
    );

    assert.equal(result.status, 1);

    assert.match(result.stderr, /must resolve to the same Git commit/);
  } finally {
    await rm(directory, { force: true, recursive: true });
  }
});
