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
  "check-graduated-release-revision.mjs",
);

const run = (command, arguments_, cwd) =>
  spawnSync(command, arguments_, { cwd, encoding: "utf8" });

const runChecker = (repository, contract = "contract.json") =>
  run(
    process.execPath,
    [checkerPath, "--repository", repository, "--contract", contract],
    repository,
  );

const createRepository = async () => {
  const directory = await mkdtemp(resolve(tmpdir(), "lumen-graduation-"));

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

const writeContract = (directory, graduation) =>
  writeFile(
    resolve(directory, "contract.json"),
    `${JSON.stringify({ graduation }, null, 2)}\n`,
  );

const graduationFor = (releaseRevision) => ({
  date: "2026-09-05",
  evidence: ["https://github.com/santi020k/lumen/releases/tag/v2.0.0"],
  releaseRevision,
  verifiedBy: "Lumen release owner",
  version: "2.0.0",
});

test("does not require a release ref before graduation is recorded", async () => {
  const directory = await mkdtemp(resolve(tmpdir(), "lumen-pre-graduation-"));

  try {
    await writeContract(directory, undefined);

    const result = runChecker(directory);

    assert.equal(result.status, 0, result.stderr);

    assert.match(result.stdout, /graduation revision is not recorded yet/);
  } finally {
    await rm(directory, { force: true, recursive: true });
  }
});

test("accepts graduation tied to the peeled v2.0.0 commit", async () => {
  const directory = await createRepository();

  try {
    assert.equal(
      run("git", ["tag", "-a", "v2.0.0", "-m", "Release v2.0.0"], directory)
        .status,
      0,
    );

    const releaseRevision = run(
      "git",
      ["rev-parse", "HEAD"],
      directory,
    ).stdout.trim();

    await writeContract(directory, graduationFor(releaseRevision));

    const result = runChecker(directory);

    assert.equal(result.status, 0, result.stderr);

    assert.match(result.stdout, /graduation matches v2\.0\.0 at/);
  } finally {
    await rm(directory, { force: true, recursive: true });
  }
});

test("rejects graduation when the repository release tag is missing", async () => {
  const directory = await createRepository();

  try {
    const releaseRevision = run(
      "git",
      ["rev-parse", "HEAD"],
      directory,
    ).stdout.trim();

    await writeContract(directory, graduationFor(releaseRevision));

    const result = runChecker(directory);

    assert.equal(result.status, 1);

    assert.match(
      result.stderr,
      /Could not resolve graduated release ref v2\.0\.0/,
    );
  } finally {
    await rm(directory, { force: true, recursive: true });
  }
});

test("rejects graduation tied to a different revision than v2.0.0", async () => {
  const directory = await createRepository();

  try {
    assert.equal(run("git", ["tag", "v2.0.0"], directory).status, 0);

    await writeFile(resolve(directory, "release.txt"), "later revision\n");

    assert.equal(run("git", ["add", "release.txt"], directory).status, 0);

    assert.equal(
      run("git", ["commit", "--message", "test: add later revision"], directory)
        .status,
      0,
    );

    const laterRevision = run(
      "git",
      ["rev-parse", "HEAD"],
      directory,
    ).stdout.trim();

    await writeContract(directory, graduationFor(laterRevision));

    const result = runChecker(directory);

    assert.equal(result.status, 1);

    assert.match(result.stderr, /must match the peeled v2\.0\.0 commit/);
  } finally {
    await rm(directory, { force: true, recursive: true });
  }
});
