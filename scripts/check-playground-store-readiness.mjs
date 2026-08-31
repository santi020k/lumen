import assert from "node:assert/strict";
import { readdir, readFile, stat } from "node:fs/promises";
import { join, resolve } from "node:path";

// cspell:words appiconset

const repositoryRoot = resolve(import.meta.dirname, "..");

const appleStore = join(
  repositoryRoot,
  "apps",
  "playground-apple",
  "Store",
  "en-US",
);

const macAppleStore = join(
  repositoryRoot,
  "apps",
  "playground-apple",
  "Store",
  "macOS",
  "en-US",
);

const androidStore = join(
  repositoryRoot,
  "apps",
  "playground-android",
  "Store",
);

const readStoreText = async (path, maximumLength, label) => {
  const value = (await readFile(path, "utf8")).trim();

  assert.ok(value.length > 0, `${label} must not be empty`);

  assert.ok(
    value.length <= maximumLength,
    `${label} exceeds ${maximumLength} characters`,
  );

  return value;
};

const assertFile = async (path) => {
  const file = await stat(path);

  assert.ok(file.isFile(), `${path} must be a file`);

  assert.ok(file.size > 0, `${path} must not be empty`);
};

const collectFiles = async (directory, extension) => {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const path = join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await collectFiles(path, extension)));
    } else if (entry.isFile() && entry.name.endsWith(extension)) {
      files.push(path);
    }
  }

  return files;
};

const assertPng = async (path, width, height, colorType = 2) => {
  const png = await readFile(path);
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  assert.deepEqual(png.subarray(0, 8), signature, `${path} must be a PNG`);

  assert.equal(png.readUInt32BE(16), width, `${path} has the wrong width`);

  assert.equal(png.readUInt32BE(20), height, `${path} has the wrong height`);

  assert.equal(png[25], colorType, `${path} has the wrong PNG color type`);
};

const appleName = await readStoreText(
  join(appleStore, "name.txt"),
  30,
  "Apple name",
);

const appleSubtitle = await readStoreText(
  join(appleStore, "subtitle.txt"),
  30,
  "Apple subtitle",
);

const applePromotionalText = await readStoreText(
  join(appleStore, "promotional-text.txt"),
  170,
  "Apple promotional text",
);

const appleDescription = await readStoreText(
  join(appleStore, "description.txt"),
  4_000,
  "Apple description",
);

const appleKeywords = await readStoreText(
  join(appleStore, "keywords.txt"),
  100,
  "Apple keywords",
);

assert.equal(appleName, "Lumen Playground");

assert.ok(appleSubtitle.includes("Lumen"));

assert.ok(applePromotionalText.includes("SwiftUI"));

assert.ok(appleDescription.includes("without an account"));

assert.ok(
  Buffer.byteLength(appleKeywords, "utf8") <= 100,
  "Apple keywords exceed 100 bytes",
);

const macAppleName = await readStoreText(
  join(macAppleStore, "name.txt"),
  30,
  "Mac Apple name",
);

const macAppleSubtitle = await readStoreText(
  join(macAppleStore, "subtitle.txt"),
  30,
  "Mac Apple subtitle",
);

const macApplePromotionalText = await readStoreText(
  join(macAppleStore, "promotional-text.txt"),
  170,
  "Mac Apple promotional text",
);

const macAppleDescription = await readStoreText(
  join(macAppleStore, "description.txt"),
  4_000,
  "Mac Apple description",
);

const macAppleKeywords = await readStoreText(
  join(macAppleStore, "keywords.txt"),
  100,
  "Mac Apple keywords",
);

assert.equal(macAppleName, "Lumen Playground");

assert.ok(macAppleSubtitle.includes("Lumen"));

assert.ok(macApplePromotionalText.includes("macOS"));

assert.ok(macAppleDescription.includes("without an account"));

assert.ok(
  Buffer.byteLength(macAppleKeywords, "utf8") <= 100,
  "Mac Apple keywords exceed 100 bytes",
);

const androidEnglishStore = join(androidStore, "en-US");

const androidTitle = await readStoreText(
  join(androidEnglishStore, "title.txt"),
  30,
  "Google Play title",
);

const androidShortDescription = await readStoreText(
  join(androidEnglishStore, "short-description.txt"),
  80,
  "Google Play short description",
);

const androidDescription = await readStoreText(
  join(androidEnglishStore, "full-description.txt"),
  4_000,
  "Google Play full description",
);

assert.equal(androidTitle, "Lumen Playground");

assert.ok(androidShortDescription.includes("Compose"));

assert.ok(androidDescription.includes("without an account"));

const expectedURLs = new Map([
  [join(appleStore, "support-url.txt"), "https://lumen.santi020k.com/support"],
  [join(appleStore, "privacy-url.txt"), "https://lumen.santi020k.com/privacy"],
  [
    join(appleStore, "marketing-url.txt"),
    "https://lumen.santi020k.com/docs/apple/playground",
  ],
  [
    join(androidEnglishStore, "support-url.txt"),
    "https://lumen.santi020k.com/support",
  ],
  [
    join(androidEnglishStore, "privacy-url.txt"),
    "https://lumen.santi020k.com/privacy",
  ],
  [
    join(macAppleStore, "support-url.txt"),
    "https://lumen.santi020k.com/support",
  ],
  [
    join(macAppleStore, "privacy-url.txt"),
    "https://lumen.santi020k.com/privacy",
  ],
  [
    join(macAppleStore, "marketing-url.txt"),
    "https://lumen.santi020k.com/docs/apple/playground",
  ],
]);

for (const [path, expected] of expectedURLs) {
  assert.equal(
    (await readFile(path, "utf8")).trim(),
    expected,
    `${path} is stale`,
  );
}

const appleIcon = join(
  repositoryRoot,
  "apps",
  "playground-apple",
  "Supporting",
  "Assets.xcassets",
  "AppIcon.appiconset",
  "AppIcon-1024.png",
);

await assertPng(appleIcon, 1024, 1024);

for (const [filename, size] of [
  ["AppIcon-Mac-16.png", 16],
  ["AppIcon-Mac-16@2x.png", 32],
  ["AppIcon-Mac-32.png", 32],
  ["AppIcon-Mac-32@2x.png", 64],
  ["AppIcon-Mac-128.png", 128],
  ["AppIcon-Mac-128@2x.png", 256],
  ["AppIcon-Mac-256.png", 256],
  ["AppIcon-Mac-256@2x.png", 512],
  ["AppIcon-Mac-512.png", 512],
  ["AppIcon-Mac-512@2x.png", 1024],
]) {
  await assertPng(join(repositoryRoot, "apps", "playground-apple", "Supporting", "Assets.xcassets", "AppIcon.appiconset", filename), size, size);
}

await assertPng(join(androidStore, "icon-512.png"), 512, 512);

await assertPng(join(androidStore, "feature-graphic.png"), 1024, 500);

await assertPng(
  join(
    repositoryRoot,
    "apps",
    "playground-apple",
    "Store",
    "Screenshots",
    "iphone-catalog-light.png",
  ),
  1242,
  2688,
  2,
);

await assertPng(
  join(
    repositoryRoot,
    "apps",
    "playground-apple",
    "Store",
    "macOS",
    "Screenshots",
    "mac-catalog-light.png",
  ),
  1280,
  800,
  2,
);

await assertPng(
  join(
    repositoryRoot,
    "apps",
    "playground-apple",
    "Store",
    "macOS",
    "Screenshots",
    "mac-catalog-dark.png",
  ),
  1280,
  800,
  2,
);

await assertPng(
  join(
    repositoryRoot,
    "apps",
    "playground-apple",
    "Store",
    "Screenshots",
    "iphone-catalog-dark.png",
  ),
  1242,
  2688,
  2,
);

await assertPng(
  join(
    repositoryRoot,
    "apps",
    "playground-apple",
    "Store",
    "Screenshots",
    "ipad-catalog-light.png",
  ),
  2048,
  2732,
  2,
);

await assertPng(
  join(
    repositoryRoot,
    "apps",
    "playground-apple",
    "Store",
    "Screenshots",
    "ipad-catalog-dark.png",
  ),
  2048,
  2732,
  2,
);

await assertPng(
  join(androidStore, "Screenshots", "phone-catalog-light.png"),
  1080,
  1920,
  2,
);

await assertPng(
  join(androidStore, "Screenshots", "phone-catalog-dark.png"),
  1080,
  1920,
  2,
);

const appleInfo = await readFile(
  join(repositoryRoot, "apps", "playground-apple", "Supporting", "Info.plist"),
  "utf8",
);

const macAppleInfo = await readFile(
  join(repositoryRoot, "apps", "playground-apple", "Supporting", "MacInfo.plist"),
  "utf8",
);

const macAppleEntitlements = await readFile(
  join(repositoryRoot, "apps", "playground-apple", "Supporting", "LumenMacPlayground.entitlements"),
  "utf8",
);

const applePlaygroundSourceDirectory = join(
  repositoryRoot,
  "apps",
  "playground-apple",
  "Sources",
  "LumenApplePlayground",
);

const applePlaygroundSourceFiles = await collectFiles(
  applePlaygroundSourceDirectory,
  ".swift",
);

assert.ok(
  applePlaygroundSourceFiles.length > 0,
  "Apple playground target must contain Swift sources",
);

for (const path of applePlaygroundSourceFiles) {
  const source = await readFile(path, "utf8");

  assert.doesNotMatch(
    source,
    /"[^"\n]*\b(?:billing|paid|premium|purchases?|subscriptions?)\b[^"\n]*"/iu,
    `${path} must not imply unavailable monetized features`,
  );
}

assert.ok(
  appleInfo.includes("$(MARKETING_VERSION)"),
  "Apple marketing version is not configurable",
);

assert.ok(
  appleInfo.includes("$(CURRENT_PROJECT_VERSION)"),
  "Apple build number is not configurable",
);

assert.match(
  appleInfo,
  /<key>ITSAppUsesNonExemptEncryption<\/key>\s*<false\/>/u,
  "Apple export-compliance declaration must remain false",
);

assert.match(
  macAppleInfo,
  /<key>ITSAppUsesNonExemptEncryption<\/key>\s*<false\/>/u,
  "Mac export-compliance declaration must remain false",
);

assert.ok(
  macAppleInfo.includes("public.app-category.developer-tools"),
  "Mac app must use the Developer Tools category",
);

assert.match(
  macAppleEntitlements,
  /<key>com.apple.security.app-sandbox<\/key>\s*<true\/>/u,
  "Mac App Store target must remain sandboxed",
);

const androidManifest = await readFile(
  join(
    repositoryRoot,
    "apps",
    "playground-android",
    "app",
    "src",
    "main",
    "AndroidManifest.xml",
  ),
  "utf8",
);

assert.ok(
  !androidManifest.includes("<uses-permission"),
  "Android app requests a permission",
);

assert.ok(
  androidManifest.includes('android:allowBackup="false"'),
  "Android backup must stay disabled",
);

const privacyPage = await readFile(
  join(repositoryRoot, "apps", "docs", "src", "pages", "privacy.astro"),
  "utf8",
);

assert.ok(privacyPage.includes("native Lumen Playground applications"));

assert.ok(privacyPage.includes("do not require an"));

assert.ok(privacyPage.includes("or collect, retain, or share personal data"));

await Promise.all([
  assertFile(join(appleStore, "review-notes.txt")),
  assertFile(join(macAppleStore, "review-notes.txt")),
  assertFile(join(androidStore, "data-safety.md")),
  assertFile(join(repositoryRoot, "docs", "playground-publication.md")),
]);

process.stdout.write(
  "lumen-playground: store assets and declarations are internally consistent\n",
);
