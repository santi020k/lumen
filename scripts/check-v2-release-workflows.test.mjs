import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

import { classifyCanaryPaths } from "./classify-workflow-paths.mjs";

// cspell:words mktemp

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

const versionPackagesSource = await readFile(
  resolve(repositoryRoot, "scripts", "version-packages.mjs"),
  "utf8",
);

const composeBuildSource = await readFile(
  resolve(repositoryRoot, "packages", "compose", "build.gradle.kts"),
  "utf8",
);

const assertSelectsCanary = (input, canary) => {
  assert.equal(
    classifyCanaryPaths([input])[canary],
    true,
    `${input} must select the ${canary} canary`,
  );
};

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
  "registry/web-consumer-evidence.json",
  "scripts/check-web-api-baseline.mjs",
  "scripts/check-web-api-baseline.test.mjs",
  "scripts/check-web-consumer-evidence.mjs",
  "scripts/check-web-consumer-evidence.test.mjs",
  "scripts/check-approved-release-revision.mjs",
  "scripts/check-approved-release-revision.test.mjs",
  "scripts/check-coordinated-release-revision.mjs",
  "scripts/check-coordinated-release-revision.test.mjs",
  "scripts/check-graduated-release-revision.mjs",
  "scripts/check-graduated-release-revision.test.mjs",
  "scripts/generate-release-manifest.test.mjs",
  "scripts/sync-coordinated-v2-versions.mjs",
  "scripts/sync-coordinated-v2-versions.test.mjs",
  "scripts/check-lumen-2-contract.mjs",
  "scripts/check-lumen-2-contract.test.mjs",
  "scripts/check-maven-release-artifacts.mjs",
  "scripts/check-maven-release-artifacts.test.mjs",
  "scripts/check-maven-pom-metadata.mjs",
  "scripts/check-maven-pom-metadata.test.mjs",
  "scripts/maven-pom-metadata.mjs",
  "scripts/check-npm-release-provenance.mjs",
  "scripts/check-npm-release-provenance.test.mjs",
  "scripts/check-published-package-family.mjs",
  "scripts/check-published-package-family.test.mjs",
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

    assertSelectsCanary(input, "web");
  }
});

test("the web canary executes every v2 release gate", () => {
  assertOrderedCommands(canaryWorkflow, "release canary", [
    "pnpm run check:release-manifest",
    "node --test scripts/generate-release-manifest.test.mjs",
    "pnpm run check:web-api-baseline",
    "pnpm run test:web-api-baseline",
    "pnpm run check:web-consumer-evidence",
    "pnpm run test:web-consumer-evidence",
    "pnpm run check:lumen-2-contract",
    "pnpm run test:lumen-2-contract",
    "pnpm run check:native-stability-soak",
    "pnpm run test:native-stability-soak",
    "pnpm run check:native-consumer-evidence",
    "pnpm run test:native-consumer-evidence",
    "pnpm run check:native-device-evidence",
    "pnpm run test:native-device-evidence",
    "pnpm run test:native-stable-readiness",
    "pnpm run test:approved-release-revision",
    "pnpm run test:coordinated-release-revision",
    "pnpm run check:graduated-release-revision",
    "pnpm run test:graduated-release-revision",
    "pnpm run test:maven-release-artifacts",
    "pnpm run test:npm-release-provenance",
    "pnpm run test:published-package-family",
    "pnpm run test:v2-release-workflows",
    "pnpm exec playwright install --with-deps chromium",
    "pnpm run test:a11y",
    "LUMEN_FRAMEWORK_CONFORMANCE_PROJECTS: chromium",
    "pnpm run test:framework-conformance",
  ]);
});

test("the Swift canary allows the native iOS consumer build to finish", () => {
  assert.match(
    canaryWorkflow,
    /swift:\n[\s\S]*?name: Swift package consumer[\s\S]*?timeout-minutes: 55[\s\S]*?\n {2}compose:/u,
  );
});

test("pull-request compatibility checks reuse the affected build outputs", () => {
  assertOrderedCommands(ciWorkflow, "pull-request compatibility checks", [
    "pnpm exec turbo run build typecheck lint test --affected",
    "pnpm run build:release-scope",
    "pnpm run check:bundle-size",
    "pnpm run check:publish-dry-run",
    "pnpm run check:consumer-packages",
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
    assertSelectsCanary(input, "web");

    assertSelectsCanary(input, "compose");
  }
});

test("coordinated version preparation selects every release canary", () => {
  for (const input of [
    "scripts/sync-coordinated-v2-versions.mjs",
    "scripts/sync-coordinated-v2-versions.test.mjs",
  ]) {
    assertSelectsCanary(input, "web");

    assertSelectsCanary(input, "swift");

    assertSelectsCanary(input, "compose");
  }
});

test("WidgetKit changes select the Swift canary and validate both Swift API baselines", () => {
  for (const input of swiftWidgetInputs) {
    assertSelectsCanary(input, "swift");
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

test("npm publication validates the contract and current stability ledger", () => {
  assert.ok(
    npmWorkflow.includes("if: github.ref == 'refs/heads/main'"),
    "npm publication must refuse manual dispatches outside main",
  );

  assertOrderedCommands(npmWorkflow, "npm publication", [
    "node scripts/check-approved-release-revision.mjs",
    "node scripts/check-graduated-release-revision.mjs",
    "node scripts/check-lumen-2-contract.mjs",
    "pnpm run check:web-consumer-evidence",
    "pnpm run check:native-consumer-evidence",
    "pnpm run check:native-stability-soak",
  ]);

  assert.ok(
    !npmWorkflow.includes("pnpm run check:native-stable-readiness"),
    "initial npm publication must keep deferred platform qualification advisory",
  );
});

test("initial npm publication verifies the complete family before tagging", () => {
  assertOrderedCommands(npmWorkflow, "npm publication", [
    "name: Verify published npm package family",
    "node scripts/check-published-package-family.mjs",
    'release_audit_directory="$(mktemp -d)"',
    'cd "$release_audit_directory"',
    "npm init --yes",
    "npm install \\",
    "pnpm run check:npm-release-provenance",
    '--revision "$GITHUB_SHA"',
    "name: Create repository version tag",
  ]);

  assertOrderedCommands(npmWorkflow, "existing npm release tag", [
    'git ls-remote --exit-code --tags origin "refs/tags/v${VERSION}"',
    "node scripts/check-coordinated-release-revision.mjs",
    '--release-ref "v${VERSION}"',
    "--release-remote origin",
    "already exists at the publication commit; skipping",
  ]);
});

test("Compose publication validates the contract and current stability ledger", () => {
  assertOrderedCommands(composeWorkflow, "Compose publication", [
    "node scripts/check-graduated-release-revision.mjs",
    "node scripts/check-lumen-2-contract.mjs",
    "node scripts/check-native-stability-soak.mjs",
  ]);

  assert.ok(
    !composeWorkflow.includes("node scripts/check-native-stable-readiness.mjs"),
    "initial Compose publication must keep deferred platform qualification advisory",
  );
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

  assert.ok(
    packageManifest.scripts.validate.includes(
      "pnpm run check:native-stability-soak",
    ),
    "canonical validation must validate the current native stability ledger",
  );

  assert.ok(
    !packageManifest.scripts.validate.includes(
      "pnpm run check:native-stable-readiness",
    ),
    "canonical validation must keep deferred external and device qualification advisory",
  );

  assertOrderedCommands(packageManifest.scripts.validate, "validation", [
    "pnpm run check:graduated-release-revision",
    "pnpm run test:graduated-release-revision",
    "pnpm run test:maven-release-artifacts",
    "pnpm run test:npm-release-provenance",
    "pnpm run test:published-package-family",
    "pnpm run test:v2-release-workflows",
  ]);

  assertOrderedCommands(packageManifest.scripts.release, "direct release", [
    "pnpm run validate",
    "node scripts/check-approved-release-revision.mjs",
    "changeset publish",
  ]);

  assertOrderedCommands(
    versionPackagesSource,
    "npm version preparation",
    [
      "['changeset', 'version']",
      "['run', 'sync:coordinated-v2-versions']",
      "['run', 'sync:compose-version']",
      "['install', '--lockfile-only']",
      "['run', 'generate:release-manifest']",
    ],
  );

  assert.equal(
    packageManifest.scripts["version-packages"],
    "node scripts/version-packages.mjs",
  );

  assertOrderedCommands(
    packageManifest.scripts["publish-packages"],
    "direct npm publication",
    [
      "node scripts/publish-packages.mjs",
    ],
  );
});

test("published React Native consumers bind signed npm provenance to the release revision", () => {
  const workflowPath = ".github/workflows/verify-native-release.yml";

  assertSelectsCanary(workflowPath, "web");

  assertSelectsCanary(workflowPath, "swift");

  assertSelectsCanary(workflowPath, "compose");

  assert.equal(
    [...publishedNativeWorkflow.matchAll(/--revision "\$EXPECTED_REVISION"/gu)]
      .length,
    2,
    "Android and iOS consumers must pass the requested revision",
  );

  assert.ok(
    !publishedNativeWorkflow.includes("ref: ${{ inputs.revision }}"),
    "published-release verification must use current hardened tooling instead of executing scripts from an older release",
  );

  assert.match(
    publishedNativeWorkflow,
    /react-native-ios:[\s\S]*?runs-on: macos-26[\s\S]*?check:react-native-native-release:ios/u,
    "the published iOS consumer must use the Swift 6.2-or-newer runner required by Expo",
  );

  assert.ok(
    nativeSmokeSource.includes("check:npm-release-provenance"),
    "the published npm consumer must validate provenance",
  );

  assert.match(
    nativeSmokeSource,
    /runStreaming\(\s*"xcodebuild"/u,
    "the iOS consumer must stream verbose xcodebuild output without a fixed buffer",
  );

  assert.ok(
    nativeSmokeSource.includes('stdio: "inherit"'),
    "the native smoke test must expose streamed build diagnostics",
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

  assert.match(
    composeBuildSource,
    /tasks\.register<Zip>\("centralPortalBundle"\)[\s\S]*dependsOn\("verifyMavenPublication"\)/u,
    "the Central bundle must run local publication verification before upload",
  );

  assert.ok(
    composeBuildSource.includes("check-maven-pom-metadata.mjs"),
    "the local publication gate must use the structural POM metadata checker",
  );
});
