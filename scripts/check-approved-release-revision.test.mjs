import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import test from "node:test";

import { createCatalogHash } from '../packages/mcp/scripts/catalog-hash.mjs';

const repositoryRoot = resolve(import.meta.dirname, "..");
const lumen4Contract = JSON.parse(await readFile(resolve(repositoryRoot, "registry/lumen-4-contract.json"), "utf8"));

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

  const draft = major === 4 ? structuredClone(lumen4Contract) : {
    schemaVersion: 1,
    status: "draft",
    targetVersion: `${major}.0.0`,
  };

  draft.status = "draft";

  delete draft.approval;

  if (major === 4) {
    for (const path of new Set(draft.changes.flatMap(change => [...change.evidence, ...change.docs]))) {
      const target = resolve(directory, path);

      await mkdir(resolve(target, ".."), { recursive: true });

      await writeFile(target, "Reviewed release fixture evidence\n");
    }
  }

  await Promise.all([
    writeContract(directory, draft, major),
    writeFile(resolve(directory, "source.txt"), "reviewed source\n"),
  ]);

  if (major === 4) {
    await mkdir(resolve(directory, 'packages/lumen'), { recursive: true });

    await mkdir(resolve(directory, 'packages/mcp/data'), { recursive: true });

    await writeFile(resolve(directory, 'packages/lumen/v4-migration.json'), JSON.stringify(draft));

    await writeFile(resolve(directory, 'packages/mcp/data/lumen-data.json'), JSON.stringify({ migration: draft, components: ['reviewed component'] }));
  }

  const reviewedRevision = commit(
    directory,
    "test: create reviewed release candidate",
  );

  return { directory, major, reviewedRevision };
};

const approveCandidate = async (directory, reviewedRevision, major = 2, syncMirrors = true) => {
  const draft = JSON.parse(
    await readFile(
      resolve(directory, "registry", `lumen-${major}-contract.json`),
      "utf8",
    ),
  );

  await writeContract(directory, {
    ...draft,
    approval: {
      approver: "Santiago Molina (release owner)",
      date: "2026-09-01",
      decision: "Publish the reviewed release candidate.",
      evidence: [
        `https://github.com/santi020k/lumen/commit/${reviewedRevision}`,
        "https://github.com/santi020k/lumen/issues/200",
      ],
      reviewedRevision,
    },
    status: "approved",
  }, major);

  if (major === 4 && syncMirrors) {
    const contract = JSON.parse(await readFile(resolve(directory, 'registry/lumen-4-contract.json'), 'utf8'));

    for (const path of ['packages/lumen/v4-migration.json', 'packages/mcp/data/lumen-data.json']) {
      const target = resolve(directory, path);

      if (!existsSync(target)) continue;

      const data = JSON.parse(await readFile(target, 'utf8'));

      if (path.includes('/mcp/')) data.migration = contract;

      await writeFile(target, JSON.stringify(path.includes('/mcp/') ? data : contract));
    }
  }

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

const mirrorCandidate = () => createCandidate(4);

const regenerateApprovalMirrors = async directory => {
  const contract = JSON.parse(await readFile(resolve(directory, 'registry/lumen-4-contract.json'), 'utf8'));

  await writeFile(resolve(directory, 'packages/lumen/v4-migration.json'), JSON.stringify(contract));

  await writeFile(resolve(directory, 'packages/mcp/data/lumen-data.json'), JSON.stringify({ migration: contract, components: ['reviewed component'] }));

  commit(directory, 'test: regenerate approval metadata mirrors');
};

test('v4 approval permits synchronized generated metadata but rejects unrelated MCP changes', async () => {
  const { directory, reviewedRevision } = await mirrorCandidate();

  try {
    await approveCandidate(directory, reviewedRevision, 4, false);

    const stale = runChecker(directory, [], 4);

    assert.notEqual(stale.status, 0);

    assert.match(stale.stderr, /Candidate migration mirrors must match/);

    await regenerateApprovalMirrors(directory);

    const approved = runChecker(directory, [], 4);

    assert.equal(approved.status, 0, approved.stderr);

    const path = resolve(directory, 'packages/mcp/data/lumen-data.json');
    const data = JSON.parse(await readFile(path, 'utf8'));

    data.components.push('unreviewed component');

    await writeFile(path, JSON.stringify(data));

    commit(directory, 'test: alter bundled component after approval');

    const changed = runChecker(directory, [], 4);

    assert.notEqual(changed.status, 0);

    assert.match(changed.stderr, /Only approval metadata may change in generated migration mirrors/);
  } finally {
    await rm(directory, { force: true, recursive: true });
  }
});

for (const path of ['packages/lumen/v4-migration.json', 'packages/mcp/data/lumen-data.json']) {
  test(`v4 approval rejects missing required reviewed mirror ${path}`, async () => {
    const { directory } = await createCandidate(4);

    try {
      await rm(resolve(directory, path));

      const reviewedRevision = commit(directory, 'test: omit required reviewed migration mirror');

      await approveCandidate(directory, reviewedRevision, 4);

      const missing = runChecker(directory, [], 4);

      assert.notEqual(missing.status, 0);

      assert.match(missing.stderr, /Required migration mirror is missing from the reviewed revision/);
    } finally {
      await rm(directory, { force: true, recursive: true });
    }
  });
}

for (const path of ['packages/lumen/v4-migration.json', 'packages/mcp/data/lumen-data.json']) {
  test(`v4 approval rejects altered migration rules in ${path}`, async () => {
    const { directory, reviewedRevision } = await mirrorCandidate();

    try {
      await approveCandidate(directory, reviewedRevision, 4);

      const target = resolve(directory, path);
      const data = JSON.parse(await readFile(target, 'utf8'));
      const migration = path.includes('/mcp/') ? data.migration : data;

      migration.changes[0].migration = 'Unreviewed migration instruction';

      await writeFile(target, JSON.stringify(data));

      commit(directory, 'test: alter mirrored migration instructions');

      const changed = runChecker(directory, [], 4);

      assert.notEqual(changed.status, 0);

      assert.match(changed.stderr, /Candidate migration mirrors must match/);
    } finally {
      await rm(directory, { force: true, recursive: true });
    }
  });
}

for (const major of [4, 5]) {
  test(`major ${major} requires explicit approval of the exact reviewed candidate`, async () => {
    const { directory, reviewedRevision } = await createCandidate(major);

    try {
      const draft = runChecker(directory, [], major);

      assert.notEqual(draft.status, 0);

      assert.match(draft.stderr, /requires an approved contract/);

      await approveCandidate(directory, reviewedRevision, major);

      const approved = runChecker(directory, [], major);

      assert.equal(approved.status, 0, approved.stderr);

      await writeFile(resolve(directory, 'source.txt'), 'unreviewed change\n');

      commit(directory, 'test: change source after approval');

      const changed = runChecker(directory, [], major);

      assert.notEqual(changed.status, 0);

      assert.match(changed.stderr, /Only the contract approval record may change/);
    } finally {
      await rm(directory, { force: true, recursive: true });
    }
  });
}

test('the direct v4 publication guard rejects status and revision without attributable approval evidence', async () => {
  const { directory, reviewedRevision } = await createCandidate(4);

  try {
    const draft = JSON.parse(await readFile(resolve(directory, 'registry/lumen-4-contract.json'), 'utf8'));

    await writeContract(directory, {
      ...draft,
      status: 'approved',
      approval: { reviewedRevision },
    }, 4);

    commit(directory, 'test: write incomplete release approval');

    const result = runChecker(directory, [], 4);

    assert.notEqual(result.status, 0);

    assert.match(result.stderr, /approval\.approver must be a non-empty string/);

    assert.match(result.stderr, /approval\.decision must be a non-empty string/);

    assert.match(result.stderr, /approval\.evidence must be a non-empty string array/);
  } finally {
    await rm(directory, { force: true, recursive: true });
  }
});

test('the direct v4 publication guard checks evidence in its target repository', async () => {
  const { directory, reviewedRevision } = await createCandidate(4);

  try {
    await approveCandidate(directory, reviewedRevision, 4);

    await rm(resolve(directory, 'docs/lumen-4-readiness.md'));

    commit(directory, 'test: remove candidate evidence');

    const result = runChecker(directory, [], 4);

    assert.notEqual(result.status, 0);

    assert.match(result.stderr, /Referenced file does not exist: docs\/lumen-4-readiness\.md/);
  } finally {
    await rm(directory, { force: true, recursive: true });
  }
});

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

test('v4 approval validates a large bundled snapshot and still rejects payload tampering', async () => {
  const { directory } = await mirrorCandidate();

  try {
    const path = resolve(directory, 'packages/mcp/data/lumen-data.json');
    const data = JSON.parse(await readFile(path, 'utf8'));

    data.documentation = 'reviewed content '.repeat(150_000);

    await writeFile(path, JSON.stringify(data));

    const reviewedRevision = commit(directory, 'test: include production-sized bundled documentation');

    await approveCandidate(directory, reviewedRevision, 4);

    const approved = runChecker(directory, [], 4);

    assert.equal(approved.status, 0, approved.stderr);

    const changed = JSON.parse(await readFile(path, 'utf8'));

    changed.documentation += 'unreviewed content';

    await writeFile(path, JSON.stringify(changed));

    commit(directory, 'test: tamper with large bundled documentation');

    const rejected = runChecker(directory, [], 4);

    assert.notEqual(rejected.status, 0);

    assert.match(rejected.stderr, /Only approval metadata may change/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('real generated MCP catalog hash ignores only approval metadata', async () => {
  const reviewed = JSON.parse(await readFile(resolve(repositoryRoot, 'packages/mcp/data/lumen-data.json'), 'utf8'));

  const payload = {
    components: reviewed.components,
    docs: reviewed.docs,
    migration: reviewed.migration,
    nativeComponents: reviewed.nativeComponents,
    nativeSources: reviewed.nativeSources,
    recipes: reviewed.recipes,
    releaseManifest: reviewed.releaseManifest,
    rules: reviewed.rules,
    tokens: reviewed.tokens,
  };

  const draftHash = createCatalogHash(payload);

  assert.equal(draftHash, reviewed.meta.catalogHash);

  const approved = structuredClone(payload);

  approved.migration.status = 'approved';

  approved.migration.approval = { approver: 'Test release owner', reviewedRevision: 'a'.repeat(40) };

  assert.equal(createCatalogHash(approved), draftHash);

  approved.migration.changes[0].migration += ' altered migration';

  assert.notEqual(createCatalogHash(approved), draftHash);

  const changed = structuredClone(payload);

  changed.rules += ' changed instructions';

  assert.notEqual(createCatalogHash(changed), draftHash);
});

test('v4 approval validates the complete production MCP snapshot', async () => {
  const { directory } = await mirrorCandidate();

  try {
    const snapshot = await readFile(resolve(repositoryRoot, 'packages/mcp/data/lumen-data.json'), 'utf8');

    await writeFile(resolve(directory, 'packages/mcp/data/lumen-data.json'), snapshot);

    const reviewedRevision = commit(directory, 'test: review full production snapshot');

    await approveCandidate(directory, reviewedRevision, 4);

    const result = runChecker(directory, [], 4);

    assert.equal(result.status, 0, result.stderr);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
