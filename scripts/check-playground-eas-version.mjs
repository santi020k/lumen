import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const playgroundPackagePath = new URL(
  "../apps/playground-react-native/package.json",
  import.meta.url,
);

const playgroundDocumentationPath = new URL(
  "../docs/playgrounds.md",
  import.meta.url,
);

const easCliInvocationPattern = /(?:^|\s)eas(?:-cli)?(?=@|\s)/u;
const pinnedEasCliPattern = /\bpnpm dlx eas-cli@(?<version>\d+\.\d+\.\d+)\b/gu;

const pinnedVersions = (source) =>
  [...source.matchAll(pinnedEasCliPattern)].map(
    (match) => match.groups.version,
  );

export const assertPlaygroundEasVersion = ({ documentation, scripts }) => {
  assert.equal(
    typeof documentation,
    "string",
    "Playground documentation must be text",
  );

  assert.equal(
    typeof scripts,
    "object",
    "Playground package scripts must be an object",
  );

  assert.notEqual(
    scripts,
    null,
    "Playground package scripts must be an object",
  );

  const easScripts = Object.entries(scripts).filter(
    ([, command]) =>
      typeof command === "string" && easCliInvocationPattern.test(command),
  );

  assert.ok(
    easScripts.length > 0,
    "Playground package must include at least one EAS script",
  );

  const scriptVersions = easScripts.map(([scriptName, command]) => {
    const versions = pinnedVersions(command);

    assert.equal(
      versions.length,
      1,
      `${scriptName} must invoke exactly one explicitly pinned EAS CLI version`,
    );

    return versions[0];
  });

  const uniqueScriptVersions = new Set(scriptVersions);

  assert.equal(
    uniqueScriptVersions.size,
    1,
    `EAS package scripts disagree: ${[...uniqueScriptVersions].join(", ")}`,
  );

  const [verifiedVersion] = uniqueScriptVersions;
  const documentationVersions = pinnedVersions(documentation);

  assert.ok(
    documentationVersions.length > 0,
    "Playground documentation must pin the EAS CLI",
  );

  assert.ok(
    documentationVersions.every((version) => version === verifiedVersion),
    `Playground documentation must use eas-cli@${verifiedVersion}`,
  );

  return {
    documentationPins: documentationVersions.length,
    scriptPins: scriptVersions.length,
    version: verifiedVersion,
  };
};

const run = async () => {
  const playgroundPackage = JSON.parse(
    await readFile(playgroundPackagePath, "utf8"),
  );

  const documentation = await readFile(playgroundDocumentationPath, "utf8");

  const result = assertPlaygroundEasVersion({
    documentation,
    scripts: playgroundPackage.scripts,
  });

  process.stdout.write(
    `React Native playground uses eas-cli@${result.version} across ` +
      `${result.scriptPins} scripts and ${result.documentationPins} documentation commands.\n`,
  );
};

if (process.argv[1] === new URL(import.meta.url).pathname) await run();
