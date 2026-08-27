import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";

const repositoryRoot = resolve(import.meta.dirname, "..");

const readArgument = (name) => {
  const index = process.argv.indexOf(name);

  if (index === -1) return undefined;

  const value = process.argv[index + 1];

  assert.ok(value && !value.startsWith("--"), `${name} requires a value`);

  return value;
};

const reactNativeManifest = JSON.parse(
  await readFile(
    resolve(repositoryRoot, "packages", "react-native", "package.json"),
    "utf8",
  ),
);

const umbrellaManifest = JSON.parse(
  await readFile(
    resolve(repositoryRoot, "packages", "lumen", "package.json"),
    "utf8",
  ),
);

const gradleProperties = await readFile(
  resolve(repositoryRoot, "packages", "compose", "gradle.properties"),
  "utf8",
);

const reactNativeVersion =
  readArgument("--react-native-version") ?? reactNativeManifest.version;

const swiftVersion =
  readArgument("--swift-version") ?? umbrellaManifest.version;

const soakLedger = readArgument("--soak-ledger");
const deviceLedger = readArgument("--device-ledger");
const consumerLedger = readArgument("--consumer-ledger");
const contractArgument = readArgument("--contract");
const releaseManifestPath = readArgument("--release-manifest");
const webApiBaseline = readArgument("--web-api-baseline");

const composeVersion =
  readArgument("--compose-version") ??
  /^lumenComposeVersion=(.+)$/m.exec(gradleProperties)?.[1];

const parseVersion = (adapter, version) => {
  assert.equal(typeof version, "string", `${adapter} version is missing`);

  const match =
    /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z.-]+))?$/.exec(
      version,
    );

  assert.ok(match, `${adapter} version is not semantic: ${version}`);

  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
    prerelease: match[4],
  };
};

const isAtLeast = (version, minimum) => {
  const current = [version.major, version.minor, version.patch];

  for (const [index, value] of current.entries()) {
    if (value > minimum[index]) return true;

    if (value < minimum[index]) return false;
  }

  return true;
};

const versions = {
  Compose: {
    minimumStable: [2, 0, 0],
    raw: composeVersion,
    ...parseVersion("Compose", composeVersion),
  },
  "React Native": {
    minimumStable: [2, 0, 0],
    raw: reactNativeVersion,
    ...parseVersion("React Native", reactNativeVersion),
  },
  SwiftUI: {
    minimumStable: [2, 0, 0],
    raw: swiftVersion,
    ...parseVersion("SwiftUI", swiftVersion),
  },
};

const stableAdapters = Object.entries(versions)
  .filter(
    ([, version]) =>
      isAtLeast(version, version.minimumStable) && !version.prerelease,
  )
  .map(([adapter, version]) => `${adapter} ${version.raw}`);

if (stableAdapters.length === 0) {
  process.stdout.write(
    `Native stable readiness is not required for React Native ${reactNativeVersion} and Compose ` +
      `${composeVersion}, or SwiftUI ${swiftVersion}.\n`,
  );

  process.exit(0);
}

assert.equal(
  stableAdapters.length,
  Object.keys(versions).length,
  `Lumen 2 must launch every native adapter together; ready: ${stableAdapters.join(", ")}`,
);

for (const [adapter, version] of Object.entries(versions)) {
  assert.equal(
    version.major,
    2,
    `${adapter} ${version.raw} requires a separate major-release contract; this gate covers stable Lumen 2.x`,
  );
}

process.stdout.write(
  `Native stable readiness is required for ${stableAdapters.join(" and ")}.\n`,
);

const runCheck = (check) => {
  const arguments_ = [
    resolve(repositoryRoot, "scripts", check.script),
    ...(check.arguments ?? ["--require-complete"]),
    ...(check.ledger ? ["--ledger", check.ledger] : []),
    ...(check.extraArguments ?? []),
  ];

  const result = spawnSync(process.execPath, arguments_, {
    cwd: repositoryRoot,
    encoding: "utf8",
    stdio: "inherit",
  });

  if (result.error) throw result.error;

  if (result.status !== 0) process.exit(result.status ?? 1);
};

runCheck({
  arguments: webApiBaseline ? ["--baseline", webApiBaseline] : [],
  script: "check-web-api-baseline.mjs",
});

runCheck({
  arguments: [
    "--require-approved",
    ...(contractArgument ? ["--contract", contractArgument] : []),
  ],
  script: "check-lumen-2-contract.mjs",
});

const resolvedContractPath = contractArgument
  ? resolve(repositoryRoot, contractArgument)
  : resolve(repositoryRoot, "registry", "lumen-2-contract.json");

const contract = JSON.parse(await readFile(resolvedContractPath, "utf8"));
const graduationVerified = contract.graduation !== undefined;

if (!graduationVerified) {
  for (const [adapter, version] of Object.entries(versions)) {
    assert.equal(
      version.raw,
      contract.targetVersion,
      `${adapter} must first graduate at ${contract.targetVersion}`,
    );
  }

  const manifestPath = releaseManifestPath
    ? resolve(repositoryRoot, releaseManifestPath)
    : resolve(repositoryRoot, "registry", "release-manifest.json");

  const releaseManifest = JSON.parse(await readFile(manifestPath, "utf8"));

  const npmPackages = Object.entries(
    releaseManifest.release?.npm?.packages ?? {},
  );

  const packageDirectories = await readdir(
    resolve(repositoryRoot, "packages"),
    { withFileTypes: true },
  );

  const publicPackageNames = [];

  for (const directory of packageDirectories) {
    if (!directory.isDirectory()) continue;

    const packageManifestPath = resolve(
      repositoryRoot,
      "packages",
      directory.name,
      "package.json",
    );

    const packageManifest = JSON.parse(
      await readFile(packageManifestPath, "utf8").catch(() => "null"),
    );

    if (packageManifest && !packageManifest.private)
      publicPackageNames.push(packageManifest.name);
  }

  assert.equal(
    releaseManifest.schemaVersion,
    1,
    "Unsupported release manifest schema",
  );

  assert.deepEqual(
    {
      codemod: releaseManifest.migration?.codemod,
      deprecatedExports: releaseManifest.migration?.deprecatedExports,
      removedExports: releaseManifest.migration?.removedExports,
      runtime: releaseManifest.migration?.runtime,
    },
    contract.releaseMigration,
    "The initial Lumen 2 release manifest migration metadata must match the approved contract",
  );

  assert.equal(
    releaseManifest.release?.version,
    "2.0.0",
    "Lumen 2 umbrella release must be 2.0.0",
  );

  assert.equal(
    releaseManifest.release?.compose?.version,
    "2.0.0",
    "Lumen 2 Compose release must be 2.0.0",
  );

  assert.equal(
    releaseManifest.release?.swift?.tag,
    "v2.0.0",
    "Lumen 2 Swift tag must be v2.0.0",
  );

  assert.ok(
    npmPackages.length > 0,
    "Lumen 2 release manifest must contain public npm packages",
  );

  assert.deepEqual(
    npmPackages.map(([packageName]) => packageName).sort(),
    publicPackageNames.sort(),
    "Lumen 2 release manifest must list every public npm package",
  );

  for (const [packageName, packageRelease] of npmPackages) {
    assert.equal(
      packageRelease.version,
      "2.0.0",
      `${packageName} must launch at 2.0.0`,
    );
  }

  assert.equal(
    releaseManifest.release.npm.packages["@santi020k/lumen"]?.version,
    swiftVersion,
    "The umbrella npm package and Swift tag must use the same Lumen 2 version",
  );

  assert.equal(
    releaseManifest.release.npm.packages["@santi020k/lumen-react-native"]
      ?.version,
    reactNativeVersion,
    "The React Native package must match the coordinated Lumen 2 version",
  );

  process.stdout.write(
    `All ${npmPackages.length} public npm packages are coordinated at 2.0.0.\n`,
  );
}

for (const check of [
  { ledger: soakLedger, script: "check-native-stability-soak.mjs" },
  {
    extraArguments: soakLedger ? ["--soak-ledger", soakLedger] : [],
    ledger: consumerLedger,
    script: "check-native-consumer-evidence.mjs",
  },
  { ledger: deviceLedger, script: "check-native-device-evidence.mjs" },
]) {
  runCheck(check);
}

process.stdout.write("Native stable release gates are complete.\n");
