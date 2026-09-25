import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import test from "node:test";

const repositoryRoot = resolve(import.meta.dirname, "..");

const checkerPath = resolve(
  repositoryRoot,
  "scripts",
  "check-approved-release-revision.mjs",
);

const run = (command, arguments_, cwd) =>
  spawnSync(command, arguments_, {
    cwd,
    encoding: "utf8",
  });

const commit = (directory, message) => {
  assert.equal(run("git", ["add", "--all"], directory).status, 0);

  assert.equal(
    run("git", ["commit", "--message", message], directory).status,
    0,
  );

  const result = run("git", ["rev-parse", "HEAD"], directory);

  assert.equal(result.status, 0);

  return result.stdout.trim();
};

const writeContract = (directory, contract, major = 2) =>
  writeFile(
    resolve(directory, "registry", `lumen-${major}-contract.json`),
    `${JSON.stringify(contract, null, 2)}\n`,
  );

const createCandidate = async (major = 2) => {
  const directory = await mkdtemp(resolve(tmpdir(), "lumen-approved-release-"));

  await mkdir(resolve(directory, "registry"), { recursive: true });

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

  await Promise.all([
    writeContract(directory, {
      schemaVersion: 1,
      status: "draft",
      targetVersion: `${major}.0.0`,
    }, major),
    writeFile(resolve(directory, "source.txt"), "reviewed source\n"),
  ]);

  const reviewedRevision = commit(
    directory,
    "test: create reviewed release candidate",
  );

  return { directory, major, reviewedRevision };
};

const approveCandidate = async (directory, reviewedRevision, major = 2) => {
  const draft = JSON.parse(
    await readFile(
      resolve(directory, "registry", `lumen-${major}-contract.json`),
      "utf8",
    ),
  );

  await writeContract(directory, {
    ...draft,
    approval: {
      approver: "Release owner",
      date: "2026-09-01",
      evidence: ["https://github.com/santi020k/lumen/issues/200"],
      reviewedRevision,
    },
    status: "approved",
  }, major);

  commit(directory, `chore(release): approve Lumen ${major} candidate`);
};

const runChecker = (directory, arguments_ = [], major = 2) =>
  run(
    process.execPath,
    [
      checkerPath,
      "--version",
      `${major}.0.0`,
      "--repository",
      directory,
      ...arguments_,
    ],
    directory,
  );

test("does not require approval ancestry before the initial stable major", async () => {
  const directory = await mkdtemp(resolve(tmpdir(), "lumen-pre-v2-approval-"));

  try {
    const result = run(
      process.execPath,
      [checkerPath, "--version", "1.9.0", "--repository", directory],
      directory,
    );

    assert.equal(result.status, 0, result.stderr);

    assert.match(result.stdout, /not required for 1\.9\.0/);
  } finally {
    await rm(directory, { force: true, recursive: true });
  }
});

test("does not re-enforce an initial-major approval after its tag exists", async () => {
  const { directory } = await createCandidate(3);

  try {
    assert.equal(run("git", ["tag", "v3.0.0"], directory).status, 0);

    const result = runChecker(directory, [], 3);

    assert.equal(result.status, 0, result.stderr);

    assert.match(result.stdout, /already enforced before v3\.0\.0 was published/);
  } finally {
    await rm(directory, { force: true, recursive: true });
  }
});

test("accepts a publish commit whose only delta is the approval record", async () => {
  const { directory, reviewedRevision } = await createCandidate();

  try {
    await approveCandidate(directory, reviewedRevision);

    const result = runChecker(directory);

    assert.equal(result.status, 0, result.stderr);

    assert.match(
      result.stdout,
      /has only the registry\/lumen-2-contract\.json approval delta/,
    );
  } finally {
    await rm(directory, { force: true, recursive: true });
  }
});

test("accepts the initial Lumen 3 approval record", async () => {
  const { directory, reviewedRevision } = await createCandidate(3);

  try {
    await approveCandidate(directory, reviewedRevision, 3);

    const result = runChecker(directory, [], 3);

    assert.equal(result.status, 0, result.stderr);

    assert.match(
      result.stdout,
      /Approved Lumen 3 candidate .*lumen-3-contract\.json approval delta/,
    );
  } finally {
    await rm(directory, { force: true, recursive: true });
  }
});

test("accepts a squash-equivalent publication and fetches the reviewed revision", async () => {
  const { directory, reviewedRevision } = await createCandidate(3);

  const remoteParent = await mkdtemp(
    resolve(tmpdir(), "lumen-approved-release-remote-"),
  );

  const cloneParent = await mkdtemp(
    resolve(tmpdir(), "lumen-approved-release-clone-"),
  );

  const remote = resolve(remoteParent, "origin.git");
  const publication = resolve(cloneParent, "publication");

  try {
    await approveCandidate(directory, reviewedRevision, 3);

    const approvedContract = await readFile(
      resolve(directory, "registry", "lumen-3-contract.json"),
      "utf8",
    );

    assert.equal(
      run("git", ["switch", "--orphan", "squashed-publication"], directory)
        .status,
      0,
    );

    await mkdir(resolve(directory, "registry"), { recursive: true });

    await Promise.all([
      writeFile(
        resolve(directory, "registry", "lumen-3-contract.json"),
        approvedContract,
      ),
      writeFile(resolve(directory, "source.txt"), "reviewed source\n"),
    ]);

    commit(directory, "chore(release): squash reviewed candidate");

    assert.equal(run("git", ["clone", "--bare", directory, remote]).status, 0);

    assert.equal(
      run(
        "git",
        [
          "clone",
          "--depth=1",
          "--branch",
          "squashed-publication",
          `file://${remote}`,
          publication,
        ],
      ).status,
      0,
    );

    assert.notEqual(
      run("git", ["cat-file", "-e", `${reviewedRevision}^{commit}`], publication)
        .status,
      0,
    );

    const result = runChecker(publication, [], 3);

    assert.equal(result.status, 0, result.stderr);

    assert.match(
      result.stdout,
      /Approved Lumen 3 candidate .*lumen-3-contract\.json approval delta/,
    );

    assert.equal(
      run("git", ["cat-file", "-e", `${reviewedRevision}^{commit}`], publication)
        .status,
      0,
    );
  } finally {
    await rm(directory, { force: true, recursive: true });

    await rm(remoteParent, { force: true, recursive: true });

    await rm(cloneParent, { force: true, recursive: true });
  }
});

test("rejects an uncommitted tracked change in the publication working tree", async () => {
  const { directory, reviewedRevision } = await createCandidate();

  try {
    await approveCandidate(directory, reviewedRevision);

    await writeFile(
      resolve(directory, "source.txt"),
      "uncommitted publication bytes\n",
    );

    const result = runChecker(directory);

    assert.equal(result.status, 1);

    assert.match(
      result.stderr,
      /requires a clean working tree with no tracked or untracked changes/,
    );
  } finally {
    await rm(directory, { force: true, recursive: true });
  }
});

test("rejects an untracked file in the publication working tree", async () => {
  const { directory, reviewedRevision } = await createCandidate();

  try {
    await approveCandidate(directory, reviewedRevision);

    await writeFile(
      resolve(directory, "untracked-package-file.txt"),
      "unreviewed\n",
    );

    const result = runChecker(directory);

    assert.equal(result.status, 1);

    assert.match(
      result.stderr,
      /requires a clean working tree with no tracked or untracked changes/,
    );
  } finally {
    await rm(directory, { force: true, recursive: true });
  }
});

test("rejects source changes after the reviewed candidate", async () => {
  const { directory, reviewedRevision } = await createCandidate();

  try {
    await approveCandidate(directory, reviewedRevision);

    await writeFile(
      resolve(directory, "source.txt"),
      "unreviewed source change\n",
    );

    commit(directory, "feat: change source after approval");

    const result = runChecker(directory);

    assert.equal(result.status, 1);

    assert.match(result.stderr, /Only the contract approval record may change/);
  } finally {
    await rm(directory, { force: true, recursive: true });
  }
});

test("rejects non-approval contract changes after the reviewed candidate", async () => {
  const { directory, reviewedRevision } = await createCandidate(3);

  try {
    await approveCandidate(directory, reviewedRevision, 3);

    const contractPath = resolve(
      directory,
      "registry",
      "lumen-3-contract.json",
    );

    const approved = JSON.parse(await readFile(contractPath, "utf8"));

    await writeContract(directory, {
      ...approved,
      policy: {
        compatibility: "unreviewed policy change",
      },
    }, 3);

    commit(directory, "test: mutate contract after review");

    const result = runChecker(directory, [], 3);

    assert.equal(result.status, 1);

    assert.match(
      result.stderr,
      /Only status and approval metadata may change inside the Lumen 3 contract after review/,
    );
  } finally {
    await rm(directory, { force: true, recursive: true });
  }
});

test("rejects an unrelated reviewed revision with different content", async () => {
  const { directory, reviewedRevision } = await createCandidate();

  try {
    assert.equal(
      run("git", ["checkout", "-b", "unrelated"], directory).status,
      0,
    );

    await writeFile(resolve(directory, "branch.txt"), "unrelated candidate\n");

    const unrelatedRevision = commit(
      directory,
      "test: add unrelated candidate",
    );

    assert.equal(run("git", ["checkout", "main"], directory).status, 0);

    await approveCandidate(directory, unrelatedRevision);

    const result = runChecker(directory);

    assert.equal(result.status, 1);

    assert.match(result.stderr, /Only the contract approval record may change/);

    assert.notEqual(unrelatedRevision, reviewedRevision);
  } finally {
    await rm(directory, { force: true, recursive: true });
  }
});
