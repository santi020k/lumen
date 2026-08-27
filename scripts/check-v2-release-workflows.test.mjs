import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

const repositoryRoot = resolve(import.meta.dirname, "..");
const workflowDirectory = resolve(repositoryRoot, ".github", "workflows");

const readWorkflow = (name) =>
  readFile(resolve(workflowDirectory, name), "utf8");

const [
  canaryWorkflow,
  ciWorkflow,
  composeWorkflow,
  npmWorkflow,
  publishedNativeWorkflow,
] = await Promise.all([
  readWorkflow("release-canary.yml"),
  readWorkflow("ci.yml"),
  readWorkflow("publish-compose.yml"),
  readWorkflow("release.yml"),
  readWorkflow("verify-native-release.yml"),
]);

const [nativeSmokeSource, npmProvenanceSource] = await Promise.all([
  readFile(
    resolve(repositoryRoot, "scripts", "smoke-react-native-native-package.mjs"),
    "utf8",
  ),
  readFile(
    resolve(repositoryRoot, "scripts", "check-npm-release-provenance.mjs"),
    "utf8",
  ),
]);

const classifiers = [...canaryWorkflow.matchAll(/if grep -Eq '([^']+)'/gu)];

assert.equal(
  classifiers.length,
  3,
  "expected web, Swift, and Compose path classifiers",
);

const webClassifier = new RegExp(classifiers[0][1], "u");
const swiftClassifier = new RegExp(classifiers[1][1], "u");
const composeClassifier = new RegExp(classifiers[2][1], "u");

const v2Inputs = [
  ".github/workflows/publish-compose.yml",
  ".github/workflows/release.yml",
  ".github/workflows/verify-native-release.yml",
  "registry/compose-api-classification.json",
  "registry/lumen-2-contract.json",
  "registry/native-api-baseline.json",
  "registry/native-consumer-evidence.json",
  "registry/native-device-evidence.json",
  "registry/native-stability-soak.json",
  "registry/swift-api-baseline.json",
  "registry/swift-widget-api-baseline.json",
  "registry/wear-api-classification.json",
  "registry/web-api-baseline.json",
  "scripts/check-web-api-baseline.mjs",
  "scripts/check-web-api-baseline.test.mjs",
  "scripts/check-approved-release-revision.mjs",
  "scripts/check-approved-release-revision.test.mjs",
  "scripts/check-coordinated-release-revision.mjs",
  "scripts/check-coordinated-release-revision.test.mjs",
  "scripts/check-graduated-release-revision.mjs",
  "scripts/check-graduated-release-revision.test.mjs",
  "scripts/generate-release-manifest.test.mjs",
  "scripts/check-lumen-2-contract.mjs",
  "scripts/check-maven-release-artifacts.mjs",
  "scripts/check-maven-release-artifacts.test.mjs",
  "scripts/check-npm-release-provenance.mjs",
  "scripts/check-npm-release-provenance.test.mjs",
  "scripts/check-native-consumer-evidence.mjs",
  "scripts/check-native-consumer-evidence.test.mjs",
  "scripts/check-native-device-evidence.mjs",
  "scripts/check-native-device-evidence.test.mjs",
  "scripts/check-native-stability-soak.mjs",
  "scripts/check-native-stability-soak.test.mjs",
  "scripts/check-native-stable-readiness.mjs",
  "scripts/check-native-stable-readiness.test.mjs",
  "scripts/check-v2-release-workflows.test.mjs",
];

const swiftWidgetInputs = [
  "packages/swift-widget/Sources/LumenWidgetUI/WidgetComponents.swift",
  "registry/swift-widget-api-baseline.json",
];

const assertOrderedCommands = (workflow, workflowName, commands) => {
  let previousIndex = -1;

  for (const command of commands) {
    const index = workflow.indexOf(command);

    assert.ok(index >= 0, `${workflowName} must run ${command}`);

    assert.ok(
      index > previousIndex,
      `${workflowName} must run ${command} in release-gate order`,
    );

    previousIndex = index;
  }
};

test("v2 release inputs trigger the workflow and select the web canary", () => {
  for (const input of v2Inputs) {
    assert.ok(
      canaryWorkflow.includes(`      - "${input}"`),
      `${input} must trigger the workflow`,
    );

    assert.match(input, webClassifier, `${input} must select the web canary`);
  }
});

test("the web canary executes every v2 release gate", () => {
  assertOrderedCommands(canaryWorkflow, "release canary", [
    "pnpm run check:release-manifest",
    "node --test scripts/generate-release-manifest.test.mjs",
    "pnpm run check:web-api-baseline",
    "pnpm run test:web-api-baseline",
    "pnpm run check:lumen-2-contract",
    "pnpm run check:native-stability-soak",
    "pnpm run test:native-stability-soak",
    "pnpm run check:native-consumer-evidence",
    "pnpm run test:native-consumer-evidence",
    "pnpm run check:native-device-evidence",
    "pnpm run test:native-device-evidence",
    "pnpm run check:native-stable-readiness",
    "pnpm run test:native-stable-readiness",
    "pnpm run test:approved-release-revision",
    "pnpm run test:coordinated-release-revision",
    "pnpm run check:graduated-release-revision",
    "pnpm run test:graduated-release-revision",
    "pnpm run test:maven-release-artifacts",
    "pnpm run test:npm-release-provenance",
    "pnpm run test:v2-release-workflows",
  ]);
});

test("coordinated revision checks select both release decision canaries", () => {
  for (const input of [
    "scripts/check-approved-release-revision.mjs",
    "scripts/check-approved-release-revision.test.mjs",
    "scripts/check-coordinated-release-revision.mjs",
    "scripts/check-coordinated-release-revision.test.mjs",
    "scripts/check-graduated-release-revision.mjs",
    "scripts/check-graduated-release-revision.test.mjs",
  ]) {
    assert.match(input, webClassifier, `${input} must select the web canary`);

    assert.match(
      input,
      composeClassifier,
      `${input} must select the Compose canary`,
    );
  }
});

test("WidgetKit changes select the Swift canary and validate both Swift API baselines", () => {
  for (const input of swiftWidgetInputs) {
    assert.match(
      input,
      swiftClassifier,
      `${input} must select the Swift canary`,
    );
  }

  assert.ok(
    canaryWorkflow.includes(
      '      - "registry/swift-widget-api-baseline.json"',
    ),
    "the WidgetKit API baseline must trigger the release canary",
  );

  assert.ok(
    canaryWorkflow.includes("run: pnpm run check:swift-api-baseline"),
    "the Swift canary must validate both Swift package products",
  );

  assert.ok(
    ciWorkflow.includes("run: pnpm run check:swift-api-baseline"),
    "pull-request CI must validate both Swift package products",
  );
});

test("npm publication validates the contract before stable readiness", () => {
  assertOrderedCommands(npmWorkflow, "npm publication", [
    "node scripts/check-approved-release-revision.mjs",
    "node scripts/check-graduated-release-revision.mjs",
    "node scripts/check-lumen-2-contract.mjs",
    "pnpm run check:native-stable-readiness",
  ]);
});

test("Compose publication validates the contract before stable readiness", () => {
  assertOrderedCommands(composeWorkflow, "Compose publication", [
    "node scripts/check-graduated-release-revision.mjs",
    "node scripts/check-lumen-2-contract.mjs",
    "node scripts/check-native-stable-readiness.mjs",
  ]);
});

test("initial Compose publication verifies the shared release commit before credentials", () => {
  assertOrderedCommands(composeWorkflow, "Compose publication", [
    "fetch-depth: 0",
    "name: Verify coordinated Lumen 2 revision",
    "node scripts/check-coordinated-release-revision.mjs",
    ' --candidate-ref "$GITHUB_SHA"',
    "name: Verify approved Lumen 2 candidate",
    "node scripts/check-approved-release-revision.mjs",
    "name: Verify graduated Lumen 2 release",
    "node scripts/check-graduated-release-revision.mjs",
    "name: Validate publication credentials",
    "name: Upload to Maven Central",
  ]);
});

test("canonical package commands enforce graduation identity before publication", async () => {
  const packageManifest = JSON.parse(
    await readFile(resolve(repositoryRoot, "package.json"), "utf8"),
  );

  assertOrderedCommands(packageManifest.scripts.validate, "validation", [
    "pnpm run check:graduated-release-revision",
    "pnpm run test:graduated-release-revision",
    "pnpm run test:maven-release-artifacts",
    "pnpm run test:npm-release-provenance",
    "pnpm run test:v2-release-workflows",
  ]);

  assertOrderedCommands(
    packageManifest.scripts["publish-packages"],
    "direct npm publication",
    [
      "pnpm run check:graduated-release-revision",
      "pnpm run check:native-stable-readiness",
      "changeset publish",
    ],
  );
});

test("published React Native consumers bind signed npm provenance to the release revision", () => {
  const workflowPath = ".github/workflows/verify-native-release.yml";

  assert.match(workflowPath, webClassifier);

  assert.match(workflowPath, swiftClassifier);

  assert.match(workflowPath, composeClassifier);

  assert.equal(
    [...publishedNativeWorkflow.matchAll(/--revision "\$EXPECTED_REVISION"/gu)]
      .length,
    2,
    "Android and iOS consumers must pass the requested revision",
  );

  assert.ok(
    nativeSmokeSource.includes("check:npm-release-provenance"),
    "the published npm consumer must validate provenance",
  );

  assert.ok(
    npmProvenanceSource.includes('["audit", "signatures", "--json"]'),
    "the provenance checker must verify npm signatures",
  );

  assert.ok(
    npmProvenanceSource.includes("resolvedDependencies"),
    "the provenance checker must inspect the signed source revision",
  );
});

test("published Compose artifacts bind checksums and POM metadata to the release tag", () => {
  assert.ok(
    publishedNativeWorkflow.includes(
      "node scripts/check-maven-release-artifacts.mjs",
    ),
    "the published-native workflow must verify Maven artifacts",
  );

  assert.ok(
    publishedNativeWorkflow.includes('--version "$COMPOSE_VERSION"'),
    "the Maven verifier must use the requested Compose version",
  );
});
