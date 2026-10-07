import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";

// cspell:words IPHONEOS

const repositoryRoot = fileURLToPath(new URL("..", import.meta.url));
const checker = `${repositoryRoot}/apps/playground-apple/scripts/check-app-store-toolchain.sh`;

const runChecker = (overrides = {}) =>
  spawnSync(checker, {
    cwd: repositoryRoot,
    encoding: "utf8",
    env: {
      ...process.env,
      LUMEN_XCODE_VERSION_OUTPUT: "Xcode 26.6\nBuild version 17F113",
      LUMEN_IPHONEOS_SDK_VERSION: "26.5",
      LUMEN_MACOS_PRODUCT_VERSION: "26.5",
      LUMEN_MACOS_BUILD_VERSION: "25F90",
      ...overrides,
    },
  });

test("accepts the stable Xcode 26 App Store toolchain", () => {
  const result = runChecker();

  assert.equal(result.status, 0, result.stderr);

  assert.match(result.stdout, /App Store toolchain accepted/u);
});

test("rejects a future Xcode and SDK before upload", () => {
  const result = runChecker({
    LUMEN_XCODE_VERSION_OUTPUT: "Xcode 27.0 beta\nBuild version 18A5000a",
    LUMEN_IPHONEOS_SDK_VERSION: "27.0",
  });

  assert.equal(result.status, 1);

  assert.match(result.stderr, /require a stable Xcode release/u);
});

test("rejects a prerelease macOS build before upload", () => {
  const result = runChecker({
    LUMEN_MACOS_PRODUCT_VERSION: "27.0",
    LUMEN_MACOS_BUILD_VERSION: "26A5421a",
  });

  assert.equal(result.status, 1);

  assert.match(result.stderr, /must run on a stable macOS image/u);
});


test("accepts the verified stable Xcode 27 release on stable macOS 27", () => {
  const result = runChecker({
    LUMEN_XCODE_VERSION_OUTPUT: "Xcode 27.0\nBuild version 27A266a",
    LUMEN_IPHONEOS_SDK_VERSION: "27.0",
    LUMEN_MACOS_PRODUCT_VERSION: "27.0",
    LUMEN_MACOS_BUILD_VERSION: "26A428",
  });

  assert.equal(result.status, 0, result.stderr);
});

test("rejects unverified Xcode 27 builds and mismatched SDKs", () => {
  for (const override of [
    { LUMEN_XCODE_VERSION_OUTPUT: "Xcode 27.0\nBuild version 27A5000a" },
    { LUMEN_XCODE_VERSION_OUTPUT: "Xcode 27.0\nBuild version 27A266a", LUMEN_IPHONEOS_SDK_VERSION: "27.2" },
  ]) {
    const result = runChecker(override);

    assert.equal(result.status, 1);

    assert.match(result.stderr, /verified stable/u);
  }
});
