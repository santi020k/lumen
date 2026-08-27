import assert from "node:assert/strict";
import test from "node:test";

import { assertPlaygroundEasVersion } from "./check-playground-eas-version.mjs";

const scripts = {
  "build:android:apk":
    "pnpm dlx eas-cli@22.4.0 build --platform android --profile preview",
  "build:android:store":
    "pnpm dlx eas-cli@22.4.0 build --platform android --profile production",
  "build:ios":
    "pnpm dlx eas-cli@22.4.0 build --platform ios --profile production",
  "publish:expo-go":
    "pnpm dlx eas-cli@22.4.0 update --branch expo-go --environment production --platform all",
};

const documentation = `
pnpm dlx eas-cli@22.4.0 login
pnpm dlx eas-cli@22.4.0 init
`;

test("accepts one verified EAS CLI version across scripts and documentation", () => {
  assert.deepEqual(assertPlaygroundEasVersion({ documentation, scripts }), {
    documentationPins: 2,
    scriptPins: 4,
    version: "22.4.0",
  });
});

test("rejects a stale documentation version", () => {
  assert.throws(
    () =>
      assertPlaygroundEasVersion({
        documentation: documentation.replaceAll("22.4.0", "21.0.0"),
        scripts,
      }),
    /documentation must use eas-cli@22\.4\.0/u,
  );
});

test("rejects disagreement between package scripts", () => {
  assert.throws(
    () =>
      assertPlaygroundEasVersion({
        documentation,
        scripts: {
          ...scripts,
          "build:ios": scripts["build:ios"].replace("22.4.0", "23.0.0"),
        },
      }),
    /EAS package scripts disagree/u,
  );
});

test("discovers and rejects a newly added EAS script with a different pin", () => {
  assert.throws(
    () =>
      assertPlaygroundEasVersion({
        documentation,
        scripts: {
          ...scripts,
          "publish:preview": "pnpm dlx eas-cli@23.0.0 update --branch preview",
        },
      }),
    /EAS package scripts disagree/u,
  );
});

test("rejects an unpinned release script", () => {
  assert.throws(
    () =>
      assertPlaygroundEasVersion({
        documentation,
        scripts: {
          ...scripts,
          "build:android:store": "pnpm dlx eas-cli build --platform android",
        },
      }),
    /must invoke exactly one explicitly pinned EAS CLI version/u,
  );
});
