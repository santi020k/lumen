import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import test from "node:test";

const repositoryRoot = resolve(import.meta.dirname, "..");

const checkerPath = resolve(
  repositoryRoot,
  "scripts",
  "check-native-stable-readiness.mjs",
);

const contractCheckerPath = resolve(
  repositoryRoot,
  "scripts",
  "check-lumen-2-contract.mjs",
);

const contractPath = resolve(
  repositoryRoot,
  "registry",
  "lumen-2-contract.json",
);

const consumerLedgerPath = resolve(
  repositoryRoot,
  "registry",
  "native-consumer-evidence.json",
);

const deviceLedgerPath = resolve(
  repositoryRoot,
  "registry",
  "native-device-evidence.json",
);

const releaseManifestPath = resolve(
  repositoryRoot,
  "registry",
  "release-manifest.json",
);

const soakLedgerPath = resolve(
  repositoryRoot,
  "registry",
  "native-stability-soak.json",
);

const webApiBaselinePath = resolve(
  repositoryRoot,
  "registry",
  "web-api-baseline.json",
);

const webConsumerLedgerPath = resolve(
  repositoryRoot,
  "registry",
  "web-consumer-evidence.json",
);

const contractTemplate = JSON.parse(await readFile(contractPath, "utf8"));
const approvedCandidateRevision = "a".repeat(40);

const pre2VersionArguments = [
  "--compose-version",
  "0.5.0",
  "--react-native-version",
  "0.5.0",
  "--swift-version",
  "1.7.0",
];

const synchronizeSoakBaselines = async (ledger) => {
  for (const baseline of Object.values(ledger.baselines)) {
    const contents = await readFile(resolve(repositoryRoot, baseline.path));

    baseline.sha256 = createHash("sha256").update(contents).digest("hex");
  }
};

const runChecker = (arguments_) =>
  spawnSync(process.execPath, [checkerPath, ...arguments_], {
    cwd: repositoryRoot,
    encoding: "utf8",
  });

const runContractChecker = (arguments_) =>
  spawnSync(process.execPath, [contractCheckerPath, ...arguments_], {
    cwd: repositoryRoot,
    encoding: "utf8",
  });

const approveContract = (contract) => {
  contract.status = "approved";

  contract.approval = {
    approver: "Lumen release owner",
    date: "2026-08-24",
    evidence: [
      `https://github.com/santi020k/lumen/commit/${approvedCandidateRevision}`,
      "https://github.com/santi020k/lumen/pull/200",
    ],
    reviewedRevision: approvedCandidateRevision,
  };
};

const graduateContract = (contract) => {
  approveContract(contract);

  contract.graduation = {
    date: "2026-08-25",
    evidence: [
      `https://github.com/santi020k/lumen/commit/${"b".repeat(40)}`,
      "https://github.com/santi020k/lumen/releases/tag/v2.0.0",
    ],
    releaseRevision: "b".repeat(40),
    verifiedBy: "Lumen release owner",
    version: "2.0.0",
  };
};

const coordinateReleaseManifest = (manifest) => {
  manifest.release.version = "2.0.0";

  manifest.migration = structuredClone(contractTemplate.releaseMigration);

  manifest.release.compose.version = "2.0.0";

  manifest.release.swift.tag = "v2.0.0";

  for (const packageRelease of Object.values(manifest.release.npm.packages)) {
    packageRelease.version = "2.0.0";
  }
};

const withTemporaryContract = async (mutate, callback) => {
  const temporaryDirectory = await mkdtemp(
    resolve(tmpdir(), "lumen-v2-contract-"),
  );

  try {
    const contract = JSON.parse(await readFile(contractPath, "utf8"));

    mutate(contract);

    const temporaryContractPath = resolve(temporaryDirectory, "contract.json");

    await writeFile(
      temporaryContractPath,
      `${JSON.stringify(contract, null, 2)}\n`,
    );

    const result = await callback(temporaryContractPath);

    return result;
  } finally {
    await rm(temporaryDirectory, { force: true, recursive: true });
  }
};

const withTemporaryReleaseManifest = async (mutate, callback) => {
  const temporaryDirectory = await mkdtemp(
    resolve(tmpdir(), "lumen-v2-release-manifest-"),
  );

  try {
    const manifest = JSON.parse(await readFile(releaseManifestPath, "utf8"));

    coordinateReleaseManifest(manifest);

    mutate(manifest);

    const temporaryManifestPath = resolve(
      temporaryDirectory,
      "release-manifest.json",
    );

    await writeFile(
      temporaryManifestPath,
      `${JSON.stringify(manifest, null, 2)}\n`,
    );

    const result = await callback(temporaryManifestPath);

    return result;
  } finally {
    await rm(temporaryDirectory, { force: true, recursive: true });
  }
};

const withTemporaryWebApiBaseline = async (mutate, callback) => {
  const temporaryDirectory = await mkdtemp(
    resolve(tmpdir(), "lumen-v2-web-api-"),
  );

  try {
    const baseline = JSON.parse(await readFile(webApiBaselinePath, "utf8"));

    mutate(baseline);

    const temporaryBaselinePath = resolve(
      temporaryDirectory,
      "web-api-baseline.json",
    );

    await writeFile(
      temporaryBaselinePath,
      `${JSON.stringify(baseline, null, 2)}\n`,
    );

    return await callback(temporaryBaselinePath);
  } finally {
    await rm(temporaryDirectory, { force: true, recursive: true });
  }
};

const createSoakEvidenceRecord = (repository, revision, runId) => ({
  repository,
  revision,
  revisionUrl: `${repository}/commit/${revision}`,
  verificationUrl: `${repository}/actions/runs/${runId}`,
});

const createSoakIteration = (ledger, index) => {
  const revision = `${index + 1}`.repeat(40);

  return {
    id: `native-soak.${index}`,
    date: `2026-08-2${index}`,
    revision,
    versions: {
      compose: `0.${index + 5}.0`,
      reactNative: `0.${index + 5}.0`,
      swift: `1.${index + 6}.0`,
      wear: `0.${index + 5}.0`,
    },
    baselines: Object.fromEntries(
      Object.entries(ledger.baselines).map(([adapter, baseline]) => [
        adapter,
        baseline.sha256,
      ]),
    ),
    evidence: {
      artifactVerification: createSoakEvidenceRecord(
        "https://github.com/santi020k/lumen",
        revision,
        `native-${index + 1}`,
      ),
      release: createSoakEvidenceRecord(
        "https://github.com/santi020k/lumen",
        revision,
        index + 1,
      ),
      consumerValidation: {
        compose: createSoakEvidenceRecord(
          "https://github.com/example/compose",
          "4".repeat(40),
          `${index + 1}-1`,
        ),
        reactNative: createSoakEvidenceRecord(
          "https://github.com/example/react-native",
          "5".repeat(40),
          `${index + 1}-2`,
        ),
        swiftUI: createSoakEvidenceRecord(
          "https://github.com/example/swift",
          "6".repeat(40),
          `${index + 1}-3`,
        ),
        swiftWidget: createSoakEvidenceRecord(
          "https://github.com/example/swift-widget",
          "7".repeat(40),
          `${index + 1}-4`,
        ),
        wear: createSoakEvidenceRecord(
          "https://github.com/example/wear",
          "8".repeat(40),
          `${index + 1}-5`,
        ),
      },
    },
  };
};

const completeDevicePass = (pass, index) => {
  pass.status = "complete";

  pass.environment = {
    device: `Physical test device ${index}`,
    osVersion: `Platform ${index}.0`,
  };

  pass.date = "2026-08-23";

  pass.revision = approvedCandidateRevision;

  pass.tester = "Native release tester";

  pass.evidence = [
    `https://github.com/santi020k/lumen/commit/${pass.revision}`,
    `https://github.com/santi020k/lumen/actions/runs/${index + 1}`,
  ];

  pass.checks = Object.fromEntries(
    Object.keys(pass.checks).map((check) => [check, true]),
  );

  pass.blockingIssues = [];
};

const completeConsumer = (consumer, index) => {
  consumer.status = "complete";

  consumer.consumer.owner = `Product owner ${index}`;

  consumer.consumer.repository = `https://github.com/example/consumer-${index}`;

  consumer.minimumOperatingSystems = [`Platform ${index}.0`];

  consumer.toolchain = `Native toolchain ${index}`;

  consumer.checks = Object.fromEntries(
    Object.keys(consumer.checks).map((check) => [check, true]),
  );

  consumer.evidence = [
    `https://github.com/example/consumer-${index}/commit/${consumer.upgrade.revision}`,
    `https://github.com/example/consumer-${index}/actions/runs/${index + 1}`,
  ];

  consumer.blockingIssues = [];
};

const completeWebConsumer = (consumer, index, candidateVersion) => {
  const revision = `${index + 4}`.repeat(40);

  consumer.status = "complete";

  consumer.consumer.name ??= `Web consumer ${index}`;

  consumer.consumer.repository ??= `https://github.com/example/web-consumer-${index}`;

  consumer.consumer.workflow ??= ".github/workflows/lumen-canary.yml";

  consumer.upgrade ??= {
    fromVersion: "1.0.0",
    revision: "",
    toVersion: candidateVersion,
  };

  consumer.upgrade.revision = revision;

  consumer.upgrade.toVersion = candidateVersion;

  consumer.checks = Object.fromEntries(
    Object.keys(consumer.checks).map((check) => [check, true]),
  );

  const repositoryUrl = consumer.consumer.repository.replace(/\.git$/u, "");

  consumer.evidence = [
    `${repositoryUrl}/commit/${revision}`,
    `${repositoryUrl}/actions/runs/${index + 1}`,
  ];

  consumer.blockingIssues = [];
};

const withCompleteLedgers = async (callback, mutate = () => {}) => {
  const temporaryDirectory = await mkdtemp(
    resolve(tmpdir(), "lumen-native-stable-"),
  );

  try {
    const soakLedger = JSON.parse(await readFile(soakLedgerPath, "utf8"));

    const consumerLedger = JSON.parse(
      await readFile(consumerLedgerPath, "utf8"),
    );

    const deviceLedger = JSON.parse(await readFile(deviceLedgerPath, "utf8"));

    const webConsumerLedger = JSON.parse(
      await readFile(webConsumerLedgerPath, "utf8"),
    );

    let passIndex = 0;

    await synchronizeSoakBaselines(soakLedger);

    soakLedger.iterations = [
      createSoakIteration(soakLedger, 0),
      createSoakIteration(soakLedger, 1),
    ];

    const versionKeys = {
      compose: "compose",
      "react-native": "reactNative",
      "swift-widget": "swift",
      swiftui: "swift",
      wear: "wear",
    };

    for (const consumer of consumerLedger.adapters) {
      const versionKey = versionKeys[consumer.id];

      consumer.upgrade ??= {
        fromVersion: "",
        revision: "a".repeat(40),
        toVersion: "",
      };

      consumer.upgrade.fromVersion =
        soakLedger.iterations[0].versions[versionKey];

      consumer.upgrade.toVersion =
        soakLedger.iterations[1].versions[versionKey];
    }

    consumerLedger.adapters.forEach(completeConsumer);

    for (const adapter of deviceLedger.adapters) {
      completeDevicePass(adapter.minimum, passIndex);

      passIndex += 1;

      completeDevicePass(adapter.current, passIndex);

      passIndex += 1;
    }

    const candidateRevision = approvedCandidateRevision;

    webConsumerLedger.candidate.revision = candidateRevision;

    webConsumerLedger.candidate.releaseManifestUrl = `https://raw.githubusercontent.com/santi020k/lumen/${candidateRevision}/registry/release-manifest.json`;

    for (const [index, consumer] of webConsumerLedger.adapters.entries()) {
      completeWebConsumer(consumer, index, webConsumerLedger.candidate.version);
    }

    mutate({ consumerLedger, deviceLedger, soakLedger, webConsumerLedger });

    const temporarySoakPath = resolve(temporaryDirectory, "soak.json");
    const temporaryConsumerPath = resolve(temporaryDirectory, "consumers.json");
    const temporaryDevicePath = resolve(temporaryDirectory, "devices.json");

    const temporaryWebConsumerPath = resolve(
      temporaryDirectory,
      "web-consumers.json",
    );

    await Promise.all([
      writeFile(temporarySoakPath, `${JSON.stringify(soakLedger, null, 2)}\n`),
      writeFile(
        temporaryConsumerPath,
        `${JSON.stringify(consumerLedger, null, 2)}\n`,
      ),
      writeFile(
        temporaryDevicePath,
        `${JSON.stringify(deviceLedger, null, 2)}\n`,
      ),
      writeFile(
        temporaryWebConsumerPath,
        `${JSON.stringify(webConsumerLedger, null, 2)}\n`,
      ),
    ]);

    const result = await callback({
      consumerLedger: temporaryConsumerPath,
      deviceLedger: temporaryDevicePath,
      soakLedger: temporarySoakPath,
      webConsumerLedger: temporaryWebConsumerPath,
    });

    return result;
  } finally {
    await rm(temporaryDirectory, { force: true, recursive: true });
  }
};

const withValidEmptySoakLedger = async (callback) => {
  const temporaryDirectory = await mkdtemp(
    resolve(tmpdir(), "lumen-native-empty-soak-"),
  );

  try {
    const soakLedger = JSON.parse(await readFile(soakLedgerPath, "utf8"));

    await synchronizeSoakBaselines(soakLedger);

    soakLedger.iterations = [];

    const temporarySoakPath = resolve(temporaryDirectory, "soak.json");

    await writeFile(
      temporarySoakPath,
      `${JSON.stringify(soakLedger, null, 2)}\n`,
    );

    const result = await callback(temporarySoakPath);

    return result;
  } finally {
    await rm(temporaryDirectory, { force: true, recursive: true });
  }
};

const runCompleteStableRelease = (mutateLedgers = () => {}) =>
  withTemporaryContract(approveContract, (temporaryContractPath) =>
    withTemporaryReleaseManifest(
      () => {},
      (temporaryManifestPath) =>
        withCompleteLedgers(
          (ledgers) =>
            runChecker([
              "--compose-version",
              "2.0.0",
              "--react-native-version",
              "2.0.0",
              "--swift-version",
              "2.0.0",
              "--contract",
              temporaryContractPath,
              "--release-manifest",
              temporaryManifestPath,
              "--consumer-ledger",
              ledgers.consumerLedger,
              "--soak-ledger",
              ledgers.soakLedger,
              "--device-ledger",
              ledgers.deviceLedger,
              "--web-consumer-ledger",
              ledgers.webConsumerLedger,
            ]),
          mutateLedgers,
        ),
    ),
  );

test("does not require final launch evidence for pre-2 artifacts", () => {
  const result = runChecker(pre2VersionArguments);

  assert.equal(result.status, 0, result.stderr);

  assert.match(result.stdout, /Native stable readiness is not required/);
});

test("does not treat release candidates as stable releases", () => {
  const result = runChecker([
    "--compose-version",
    "2.0.0-rc.1",
    "--react-native-version",
    "2.0.0-rc.1",
    "--swift-version",
    "2.0.0-rc.1",
  ]);

  assert.equal(result.status, 0, result.stderr);

  assert.match(result.stdout, /Native stable readiness is not required/);
});

test("rejects a stable launch with the legacy root-export-only web baseline", async () => {
  const result = await withTemporaryWebApiBaseline(
    (baseline) => {
      baseline.schemaVersion = 1;
    },
    (temporaryBaselinePath) =>
      runChecker([
        "--compose-version",
        "2.0.0",
        "--react-native-version",
        "2.0.0",
        "--swift-version",
        "2.0.0",
        "--web-api-baseline",
        temporaryBaselinePath,
      ]),
  );

  assert.equal(result.status, 1);

  assert.match(result.stderr, /Unsupported web API baseline schema version/);
});

for (const release of [
  { adapter: "Compose", versionArgumentIndex: 1 },
  { adapter: "React Native", versionArgumentIndex: 3 },
  { adapter: "SwiftUI", versionArgumentIndex: 5 },
]) {
  test(`rejects an uncoordinated ${release.adapter} version 2 launch`, () => {
    const arguments_ = [...pre2VersionArguments];

    arguments_[release.versionArgumentIndex] = "2.0.0";

    const result = runChecker(arguments_);

    assert.equal(result.status, 1);

    assert.match(
      result.stderr,
      /Lumen 2 must launch every native adapter together/,
    );
  });
}

test("blocks a coordinated version 2 launch while its contract is draft", () => {
  const result = runChecker([
    "--compose-version",
    "2.0.0",
    "--react-native-version",
    "2.0.0",
    "--swift-version",
    "2.0.0",
  ]);

  assert.equal(result.status, 1);

  assert.match(
    result.stdout,
    /Native stable readiness is required for Compose 2\.0\.0/,
  );

  assert.match(result.stderr, /requires an approved contract/);
});

test("rejects an approved contract without attributable approval evidence", async () => {
  const result = await withTemporaryContract(
    (contract) => {
      contract.status = "approved";
    },
    (temporaryContractPath) =>
      runChecker([
        "--compose-version",
        "2.0.0",
        "--react-native-version",
        "2.0.0",
        "--swift-version",
        "2.0.0",
        "--contract",
        temporaryContractPath,
      ]),
  );

  assert.equal(result.status, 1);

  assert.match(result.stderr, /approval\.approver must be a non-empty string/);
});

test("rejects approval while contract decisions remain unresolved", async () => {
  const result = await withTemporaryContract(
    (contract) => {
      approveContract(contract);

      contract.changes[0].status = "candidate";

      contract.investigations[0].status = "deferred";

      contract.investigations[0].decisionGate = "Resolve before approval.";
    },
    (temporaryContractPath) =>
      runChecker([
        "--compose-version",
        "2.0.0",
        "--react-native-version",
        "2.0.0",
        "--swift-version",
        "2.0.0",
        "--contract",
        temporaryContractPath,
      ]),
  );

  assert.equal(result.status, 1);

  assert.match(result.stderr, /Approved contract contains candidate changes/);

  assert.match(
    result.stderr,
    /Approved contract contains deferred investigations/,
  );
});

test("reports malformed contract collections without an uncaught type error", async () => {
  const result = await withTemporaryContract(
    (contract) => {
      approveContract(contract);

      contract.changes = {};

      contract.investigations = null;
    },
    (temporaryContractPath) =>
      runChecker([
        "--compose-version",
        "2.0.0",
        "--react-native-version",
        "2.0.0",
        "--swift-version",
        "2.0.0",
        "--contract",
        temporaryContractPath,
      ]),
  );

  assert.equal(result.status, 1);

  assert.match(
    result.stderr,
    /changes must contain at least one reviewed candidate/,
  );

  assert.match(result.stderr, /investigations must be an array/);

  assert.doesNotMatch(result.stderr, /TypeError/);
});

test("rejects invalid migration removal records", async (t) => {
  const cases = [
    {
      mutate: (contract) =>
        contract.releaseMigration.removedExports.push(
          contract.releaseMigration.removedExports[0],
        ),
      name: "duplicate entry",
      pattern: /removedExports must not contain duplicates/,
    },
    {
      mutate: (contract) =>
        contract.releaseMigration.removedExports.push("@example/missing#Ghost"),
      name: "unknown package",
      pattern: /does not belong to a reviewed Lumen 2 breaking-change package/,
    },
    {
      mutate: (contract) =>
        contract.releaseMigration.removedExports.push(
          "@santi020k/lumen-react#Button",
        ),
      name: "still-exported symbol",
      pattern: /is still exported from the current package root/,
    },
    {
      mutate: (contract) => {
        contract.releaseMigration.removedExports[2] =
          "@santi020k/lumen-react#ToastViewPort";
      },
      name: "symbol not handled by the migrator",
      pattern: /is not handled by the Lumen v2 migrator/,
    },
  ];

  for (const contractCase of cases) {
    await t.test(contractCase.name, async () => {
      const result = await withTemporaryContract(
        contractCase.mutate,
        (temporaryContractPath) =>
          runContractChecker(["--contract", temporaryContractPath]),
      );

      assert.equal(result.status, 1);

      assert.match(result.stderr, contractCase.pattern);
    });
  }
});

test("rejects an initial Lumen 2 launch with a lagging public npm package", async () => {
  const result = await withTemporaryContract(
    approveContract,
    (temporaryContractPath) =>
      withTemporaryReleaseManifest(
        (manifest) => {
          manifest.release.npm.packages["@santi020k/lumen-tokens"].version =
            "1.9.0";
        },
        (temporaryManifestPath) =>
          runChecker([
            "--compose-version",
            "2.0.0",
            "--react-native-version",
            "2.0.0",
            "--swift-version",
            "2.0.0",
            "--contract",
            temporaryContractPath,
            "--release-manifest",
            temporaryManifestPath,
          ]),
      ),
  );

  assert.equal(result.status, 1);

  assert.match(
    result.stderr,
    /@santi020k\/lumen-tokens must launch at 2\.0\.0/,
  );
});

test("rejects an initial Lumen 2 launch with an omitted public npm package", async () => {
  const result = await withTemporaryContract(
    approveContract,
    (temporaryContractPath) =>
      withTemporaryReleaseManifest(
        (manifest) => {
          delete manifest.release.npm.packages["@santi020k/lumen-tokens"];
        },
        (temporaryManifestPath) =>
          runChecker([
            "--compose-version",
            "2.0.0",
            "--react-native-version",
            "2.0.0",
            "--swift-version",
            "2.0.0",
            "--contract",
            temporaryContractPath,
            "--release-manifest",
            temporaryManifestPath,
          ]),
      ),
  );

  assert.equal(result.status, 1);

  assert.match(
    result.stderr,
    /release manifest must list every public npm package/,
  );
});

test("rejects an initial Lumen 2 launch without the approved migration metadata", async () => {
  const result = await withTemporaryContract(
    approveContract,
    (temporaryContractPath) =>
      withTemporaryReleaseManifest(
        (manifest) => {
          manifest.migration.codemod = null;

          manifest.migration.removedExports = [];
        },
        (temporaryManifestPath) =>
          runChecker([
            "--compose-version",
            "2.0.0",
            "--react-native-version",
            "2.0.0",
            "--swift-version",
            "2.0.0",
            "--contract",
            temporaryContractPath,
            "--release-manifest",
            temporaryManifestPath,
          ]),
      ),
  );

  assert.equal(result.status, 1);

  assert.match(
    result.stderr,
    /initial Lumen 2 release manifest migration metadata must match the approved contract/,
  );
});

test("blocks an approved coordinated version 2 launch while evidence is incomplete", async () => {
  const result = await withTemporaryContract(
    approveContract,
    (temporaryContractPath) =>
      withTemporaryReleaseManifest(
        () => {},
        (temporaryManifestPath) =>
          withValidEmptySoakLedger((temporarySoakPath) =>
            runChecker([
              "--compose-version",
              "2.0.0",
              "--react-native-version",
              "2.0.0",
              "--swift-version",
              "2.0.0",
              "--contract",
              temporaryContractPath,
              "--release-manifest",
              temporaryManifestPath,
              "--soak-ledger",
              temporarySoakPath,
            ]),
          ),
      ),
  );

  assert.equal(result.status, 1);

  assert.match(result.stderr, /Native stability soak is incomplete/);
});

test("blocks a coordinated version 2 launch while web consumer evidence is incomplete", async () => {
  const result = await withTemporaryContract(
    approveContract,
    (temporaryContractPath) =>
      withTemporaryReleaseManifest(
        () => {},
        (temporaryManifestPath) =>
          withCompleteLedgers((ledgers) =>
            runChecker([
              "--compose-version",
              "2.0.0",
              "--react-native-version",
              "2.0.0",
              "--swift-version",
              "2.0.0",
              "--contract",
              temporaryContractPath,
              "--release-manifest",
              temporaryManifestPath,
              "--consumer-ledger",
              ledgers.consumerLedger,
              "--soak-ledger",
              ledgers.soakLedger,
              "--device-ledger",
              ledgers.deviceLedger,
            ]),
          ),
      ),
  );

  assert.equal(result.status, 1);

  assert.match(
    result.stderr,
    /Complete web evidence requires the full lowercase Lumen candidate revision|Every web adapter requires complete consumer evidence/,
  );
});

test("allows a coordinated stable release after every evidence ledger is complete", async () => {
  const result = await runCompleteStableRelease();

  assert.equal(result.status, 0, result.stderr);

  assert.match(
    result.stdout,
    /Validated 2\/2 native stability soak iterations/,
  );

  assert.match(
    result.stdout,
    /5 native real-consumer records; 0 remain incomplete/,
  );

  assert.match(
    result.stdout,
    /22 native physical-device evidence slots; 0 remain incomplete/,
  );

  assert.match(result.stdout, /Lumen 2 approved contract check passed/);

  assert.match(result.stdout, /Web consumer evidence is valid and complete/);

  assert.match(
    result.stdout,
    /All 10 public npm packages are coordinated at 2\.0\.0/,
  );

  assert.match(result.stdout, /Coordinated stable release gates are complete/);
});

test("rejects web consumers tested against a different approved candidate", async () => {
  const result = await runCompleteStableRelease(({ webConsumerLedger }) => {
    const unrelatedRevision = "c".repeat(40);

    webConsumerLedger.candidate.revision = unrelatedRevision;

    webConsumerLedger.candidate.releaseManifestUrl = `https://raw.githubusercontent.com/santi020k/lumen/${unrelatedRevision}/registry/release-manifest.json`;
  });

  assert.equal(result.status, 1);

  assert.match(
    result.stderr,
    /Web consumers must test the approved Lumen 2 candidate revision/,
  );
});

test("rejects physical-device evidence for a different approved candidate", async () => {
  const result = await runCompleteStableRelease(({ deviceLedger }) => {
    const firstAdapter = deviceLedger.adapters[0];
    const unrelatedRevision = "c".repeat(40);

    firstAdapter.minimum.revision = unrelatedRevision;

    firstAdapter.minimum.evidence = [
      `https://github.com/santi020k/lumen/commit/${unrelatedRevision}`,
      "https://github.com/santi020k/lumen/actions/runs/999",
    ];
  });

  assert.equal(result.status, 1);

  assert.match(
    result.stderr,
    /must test the approved Lumen 2 candidate revision/,
  );
});

test("does not force post-graduation 2.x releases into package-family lockstep", async () => {
  const result = await withTemporaryContract(
    graduateContract,
    (temporaryContractPath) =>
      withCompleteLedgers((ledgers) =>
        runChecker([
          "--compose-version",
          "2.1.0",
          "--react-native-version",
          "2.2.0",
          "--swift-version",
          "2.3.0",
          "--contract",
          temporaryContractPath,
          "--consumer-ledger",
          ledgers.consumerLedger,
          "--soak-ledger",
          ledgers.soakLedger,
          "--device-ledger",
          ledgers.deviceLedger,
          "--web-consumer-ledger",
          ledgers.webConsumerLedger,
        ]),
      ),
  );

  assert.equal(result.status, 0, result.stderr);

  assert.doesNotMatch(result.stdout, /public npm packages are coordinated/);
});

test("does not reuse the Lumen 2 graduation contract for a later major", async () => {
  const result = await withTemporaryContract(
    graduateContract,
    (temporaryContractPath) =>
      runChecker([
        "--compose-version",
        "3.0.0",
        "--react-native-version",
        "3.0.0",
        "--swift-version",
        "3.0.0",
        "--contract",
        temporaryContractPath,
      ]),
  );

  assert.equal(result.status, 1);

  assert.match(
    result.stderr,
    /Compose 3\.0\.0 requires a separate major-release contract; this gate covers stable Lumen 2\.x/,
  );
});

test("rejects post-2.0 versions before graduation is verified", async () => {
  const result = await withTemporaryContract(
    approveContract,
    (temporaryContractPath) =>
      runChecker([
        "--compose-version",
        "2.0.1",
        "--react-native-version",
        "2.1.0",
        "--swift-version",
        "2.2.0",
        "--contract",
        temporaryContractPath,
      ]),
  );

  assert.equal(result.status, 1);

  assert.match(result.stderr, /Compose must first graduate at 2\.0\.0/);
});
