import assert from "node:assert/strict";
import test from "node:test";

import { assertReactNativePeerDocumentation } from "./check-react-native-peer-docs.mjs";

const peerDependencies = {
  react: ">=19.2",
  "react-native": ">=0.86.2",
  "react-native-svg": ">=12 <16",
};

const documents = {
  compatibility:
    "React 19.2+, React Native 0.86.2+, React Native SVG 12–15, " +
    "React Native 0.86.2 is the package's minimum peer.",
  deviceValidation: "React Native 0.86.2 uses iOS 15.1 and Android API 24.",
  packageReadme:
    "React 19.2 and React Native 0.86.2 or newer are application-provided peer dependencies.",
  platformData: "React 19.2 and React Native 0.86.2 or newer",
};

test("accepts living documentation derived from the package peer ranges", () => {
  assert.deepEqual(
    assertReactNativePeerDocumentation({ documents, peerDependencies }),
    {
      reactMinimum: "19.2",
      reactNativeMinimum: "0.86.2",
      reactNativeSvgMajors: "12–15",
    },
  );
});

test("rejects a stale React Native minimum in public documentation", () => {
  assert.throws(
    () =>
      assertReactNativePeerDocumentation({
        documents: {
          ...documents,
          packageReadme:
            "React 19.2 and React Native 0.85.0 or newer are application-provided peer dependencies.",
        },
        peerDependencies,
      }),
    /packageReadme must include the current peer claim/u,
  );
});

test("rejects a stale React Native SVG major range in the compatibility matrix", () => {
  assert.throws(
    () =>
      assertReactNativePeerDocumentation({
        documents: {
          ...documents,
          compatibility: documents.compatibility.replace(
            "React Native SVG 12–15",
            "React Native SVG 12–150",
          ),
        },
        peerDependencies,
      }),
    /compatibility must include the current peer claim/u,
  );
});

test("rejects peer ranges without explicit minimums", () => {
  assert.throws(
    () =>
      assertReactNativePeerDocumentation({
        documents,
        peerDependencies: {
          ...peerDependencies,
          "react-native": "^0.86.2",
        },
      }),
    /must expose an explicit inclusive minimum/u,
  );
});

test("rejects unsupported SVG ranges instead of guessing the documented majors", () => {
  assert.throws(
    () =>
      assertReactNativePeerDocumentation({
        documents,
        peerDependencies: {
          ...peerDependencies,
          "react-native-svg": "^15.0.0",
        },
      }),
    /must use an inclusive and exclusive major bound/u,
  );
});
