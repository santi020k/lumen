import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const packagePath = new URL(
  "../packages/react-native/package.json",
  import.meta.url,
);

const documentationPaths = {
  compatibility: new URL("../docs/native-compatibility.md", import.meta.url),
  deviceValidation: new URL(
    "../docs/native-device-validation.md",
    import.meta.url,
  ),
  packageReadme: new URL("../packages/react-native/README.md", import.meta.url),
  platformData: new URL("../apps/docs/src/data/platforms.ts", import.meta.url),
};

const minimumVersion = (range, dependency) => {
  assert.equal(
    typeof range,
    "string",
    `${dependency} must declare a peer dependency range`,
  );

  const match = /^>=(?<minimum>\d+(?:\.\d+){0,2})(?:\s|$)/u.exec(range);

  assert.ok(
    match?.groups?.minimum,
    `${dependency} peer range must expose an explicit inclusive minimum: ${range}`,
  );

  return match.groups.minimum;
};

const inclusiveMajorRange = (range, dependency) => {
  assert.equal(
    typeof range,
    "string",
    `${dependency} must declare a peer dependency range`,
  );

  const match = /^>=(?<minimum>\d+)\s+<(?<exclusiveMaximum>\d+)$/u.exec(range);

  assert.ok(
    match?.groups?.minimum && match.groups.exclusiveMaximum,
    `${dependency} peer range must use an inclusive and exclusive major bound: ${range}`,
  );

  const minimum = Number(match.groups.minimum);
  const maximum = Number(match.groups.exclusiveMaximum) - 1;

  assert.ok(
    maximum >= minimum,
    `${dependency} peer range has no supported major version: ${range}`,
  );

  return `${minimum}–${maximum}`;
};

export const assertReactNativePeerDocumentation = ({
  documents,
  peerDependencies,
}) => {
  const reactMinimum = minimumVersion(peerDependencies.react, "react");

  const reactNativeMinimum = minimumVersion(
    peerDependencies["react-native"],
    "react-native",
  );

  const reactNativeSvgMajors = inclusiveMajorRange(
    peerDependencies["react-native-svg"],
    "react-native-svg",
  );

  const requiredClaims = [
    {
      claim:
        `React ${reactMinimum} and React Native ${reactNativeMinimum} or newer are ` +
        "application-provided peer dependencies.",
      document: "packageReadme",
    },
    {
      claim:
        `React ${reactMinimum}+, React Native ${reactNativeMinimum}+, ` +
        `React Native SVG ${reactNativeSvgMajors},`,
      document: "compatibility",
    },
    {
      claim: `React Native ${reactNativeMinimum} is the package's minimum peer`,
      document: "compatibility",
    },
    {
      claim: `React Native ${reactNativeMinimum} uses iOS`,
      document: "deviceValidation",
    },
    {
      claim: `React ${reactMinimum} and React Native ${reactNativeMinimum} or newer`,
      document: "platformData",
    },
  ];

  for (const { claim, document } of requiredClaims) {
    const source = documents[document];

    assert.equal(
      typeof source,
      "string",
      `Missing React Native peer document: ${document}`,
    );

    assert.ok(
      source.includes(claim),
      `${document} must include the current peer claim: ${claim}`,
    );
  }

  return {
    reactMinimum,
    reactNativeMinimum,
    reactNativeSvgMajors,
  };
};

const run = async () => {
  const packageManifest = JSON.parse(await readFile(packagePath, "utf8"));

  const documents = Object.fromEntries(
    await Promise.all(
      Object.entries(documentationPaths).map(async ([name, path]) => [
        name,
        await readFile(path, "utf8"),
      ]),
    ),
  );

  const versions = assertReactNativePeerDocumentation({
    documents,
    peerDependencies: packageManifest.peerDependencies ?? {},
  });

  process.stdout.write(
    `React Native documentation matches React ${versions.reactMinimum}, ` +
      `React Native ${versions.reactNativeMinimum}, and React Native SVG ` +
      `${versions.reactNativeSvgMajors}.\n`,
  );
};

if (process.argv[1] === new URL(import.meta.url).pathname) await run();
