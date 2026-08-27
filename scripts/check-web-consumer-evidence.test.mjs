import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import process from "node:process";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const checker = path.join(root, "scripts/check-web-consumer-evidence.mjs");
const sourceLedger = path.join(root, "registry/web-consumer-evidence.json");

const runChecker = (ledgerPath, ...arguments_) =>
  spawnSync(
    process.execPath,
    [checker, `--ledger=${ledgerPath}`, ...arguments_],
    { encoding: "utf8" },
  );

const completeLedger = (ledger) => {
  ledger.candidate.revision = "a".repeat(40);

  ledger.candidate.releaseManifestUrl = `https://raw.githubusercontent.com/santi020k/lumen/${ledger.candidate.revision}/registry/release-manifest.json`;

  ledger.adapters.forEach((entry, index) => {
    const revision = (index + 11).toString(16).repeat(40);

    entry.status = "complete";

    entry.consumer = {
      name: `Consumer ${entry.id}`,
      repository: `https://github.com/example/consumer-${entry.id}`,
      workflow: ".github/workflows/lumen-canary.yml",
    };

    entry.upgrade = {
      fromVersion: "1.0.0",
      revision,
      toVersion: ledger.candidate.version,
    };

    entry.checks = Object.fromEntries(
      Object.keys(entry.checks).map((key) => [key, true]),
    );

    entry.evidence = [
      `https://github.com/example/consumer-${entry.id}/commit/${revision}`,
      `https://github.com/example/consumer-${entry.id}/actions/runs/${index + 1}`,
    ];

    entry.blockingIssues = [];
  });
};

const runTemporaryLedger = async (mutate, ...arguments_) => {
  const directory = await mkdtemp(path.join(tmpdir(), "lumen-web-consumer-"));

  try {
    const ledger = JSON.parse(await readFile(sourceLedger, "utf8"));

    completeLedger(ledger);

    mutate(ledger);

    const ledgerPath = path.join(directory, "ledger.json");

    await writeFile(ledgerPath, `${JSON.stringify(ledger, null, 2)}\n`);

    return runChecker(ledgerPath, ...arguments_);
  } finally {
    await rm(directory, { force: true, recursive: true });
  }
};

test("accepts the truthful pending web consumer ledger", () => {
  const result = runChecker(sourceLedger);

  assert.equal(result.status, 0, result.stderr);
});

test("keeps Lumen 2 graduation blocked while consumer evidence is pending", () => {
  const result = runChecker(sourceLedger, "--require-complete");

  assert.notEqual(result.status, 0);

  assert.match(result.stderr, /candidate revision|Every web adapter/u);
});

test("accepts a complete immutable web consumer matrix", async () => {
  const result = await runTemporaryLedger(() => {}, "--require-complete");

  assert.equal(result.status, 0, result.stderr);

  assert.match(result.stdout, /valid and complete/u);
});

test("rejects a complete record backed by a disguised Lumen fixture", async () => {
  const result = await runTemporaryLedger((ledger) => {
    ledger.adapters[0].consumer.repository =
      "https://github.com/santi020k/lumen.git/";
  });

  assert.notEqual(result.status, 0);

  assert.match(result.stderr, /cannot qualify with a Lumen-owned fixture/u);
});

test("rejects evidence from a repository other than the declared consumer", async () => {
  const result = await runTemporaryLedger((ledger) => {
    const entry = ledger.adapters[0];

    entry.evidence = [
      `https://github.com/example/unrelated-consumer/commit/${entry.upgrade.revision}`,
      "https://github.com/example/unrelated-consumer/actions/runs/1",
    ];
  });

  assert.notEqual(result.status, 0);

  assert.match(
    result.stderr,
    /must belong to the declared consumer repository/u,
  );
});

test("rejects a mutable release-manifest URL", async () => {
  const result = await runTemporaryLedger((ledger) => {
    ledger.candidate.releaseManifestUrl =
      "https://raw.githubusercontent.com/santi020k/lumen/main/registry/release-manifest.json";
  }, "--require-complete");

  assert.notEqual(result.status, 0);

  assert.match(result.stderr, /exact immutable Lumen release manifest/u);
});

test("rejects an exact-looking release manifest from an unrelated origin", async () => {
  const result = await runTemporaryLedger((ledger) => {
    ledger.candidate.releaseManifestUrl = `https://example.com/santi020k/lumen/${ledger.candidate.revision}/registry/release-manifest.json`;
  }, "--require-complete");

  assert.notEqual(result.status, 0);

  assert.match(result.stderr, /immutable Lumen release manifest origin/u);
});

test("rejects prerelease evidence as completed graduation", async () => {
  const result = await runTemporaryLedger((ledger) => {
    ledger.candidate.version = "2.0.0-rc.1";

    for (const entry of ledger.adapters)
      entry.upgrade.toVersion = ledger.candidate.version;
  }, "--require-complete");

  assert.notEqual(result.status, 0);

  assert.match(result.stderr, /must target the stable Lumen 2\.0\.0 release/u);
});

test("rejects a complete record without a workflow path", async () => {
  const result = await runTemporaryLedger((ledger) => {
    ledger.adapters[0].consumer.workflow = null;
  });

  assert.notEqual(result.status, 0);

  assert.match(result.stderr, /repository-relative workflow path/u);
});

test("rejects arbitrary HTTPS evidence as mutable", async () => {
  const result = await runTemporaryLedger((ledger) => {
    ledger.adapters[0].evidence[1] =
      "https://github.com/example/consumer-astro/actions/workflows/lumen-canary.yml";
  });

  assert.notEqual(result.status, 0);

  assert.match(result.stderr, /immutable workflow or revision URLs/u);
});

test("rejects evidence for a different consumer revision", async () => {
  const result = await runTemporaryLedger((ledger) => {
    ledger.adapters[0].evidence[0] = `https://github.com/example/consumer-astro/commit/${"e".repeat(40)}`;
  });

  assert.notEqual(result.status, 0);

  assert.match(result.stderr, /must include the exact consumer revision/u);
});

test("rejects a workflow URL that merely contains the consumer revision", async () => {
  const result = await runTemporaryLedger((ledger) => {
    const entry = ledger.adapters[0];

    entry.evidence = [
      `https://github.com/example/consumer-astro/actions/runs/1/${entry.upgrade.revision}`,
      "https://github.com/example/consumer-astro/actions/runs/2",
    ];
  });

  assert.notEqual(result.status, 0);

  assert.match(result.stderr, /must include the exact consumer revision/u);
});

test("rejects a pending record that claims completed checks", async () => {
  const result = await runTemporaryLedger((ledger) => {
    const entry = ledger.adapters[0];

    entry.status = "pending";

    entry.blockingIssues = ["Qualification is pending."];
  });

  assert.notEqual(result.status, 0);

  assert.match(result.stderr, /pending checks must be false/u);
});
