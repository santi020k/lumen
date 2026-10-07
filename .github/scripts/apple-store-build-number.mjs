import { sign } from "node:crypto";
import { pathToFileURL } from "node:url";

// cspell:words appstoreconnect

const origin = "https://api.appstoreconnect.apple.com";

const numericBuild = number => {
  if (typeof number !== "string" || !/^[1-9][0-9]*$/u.test(number) || !Number.isSafeInteger(Number(number)))
    throw new Error("Non-integer live Apple build number requires a human decision");

  return Number(number);
};

const matchingBuildNumber = (build, versions, platform) => {
  const buildPlatform = versions.get(build.relationships?.preReleaseVersion?.data?.id);

  if (!buildPlatform)
    throw new Error("Missing build platform");

  return buildPlatform === platform ? numericBuild(build.attributes?.version) : 0;
};

const maximumOnPage = (page, platform) => {
  if (!Array.isArray(page?.data) || !Array.isArray(page.included))
    throw new Error("Invalid App Store build response");

  const versions = new Map(page.included.map(item => [item.id, item.attributes?.platform]));
  let maximum = 0;

  for (const build of page.data)
    maximum = Math.max(maximum, matchingBuildNumber(build, versions, platform));

  return maximum;
};

export const nextBuildNumber = async (platform, request) => {
  if (!["iOS", "macOS"].includes(platform))
    throw new Error("Unsupported Apple platform");

  let url = new URL("/v1/builds", origin);

  url.searchParams.set("filter[app]", "6805250815");

  url.searchParams.set("include", "preReleaseVersion");

  url.searchParams.set("limit", "200");

  let maximum = 0;
  const visited = new Set();

  while (url) {
    if (url.origin !== origin || visited.has(url.href))
      throw new Error("Invalid App Store pagination");

    visited.add(url.href);

    const page = await request(url);

    maximum = Math.max(maximum, maximumOnPage(page, platform === "iOS" ? "IOS" : "MAC_OS"));

    url = page.links?.next ? new URL(page.links.next, origin) : null;
  }

  if (!maximum || !Number.isSafeInteger(maximum + 1))
    throw new Error("Could not resolve a next build from live Apple records");

  return maximum + 1;
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const issuer = process.env.APP_STORE_CONNECT_ISSUER_ID;
  const keyId = process.env.APP_STORE_CONNECT_KEY_ID;
  const key = process.env.APP_STORE_CONNECT_API_KEY_P8;

  if (!issuer || !keyId || !key)
    throw new Error("Missing App Store Connect API credentials");

  const now = Math.floor(Date.now() / 1000);
  const encode = value => Buffer.from(JSON.stringify(value)).toString("base64url");
  const token = `${encode({ alg: "ES256", kid: keyId, typ: "JWT" })}.${encode({ iss: issuer, aud: "appstoreconnect-v1", iat: now, exp: now + 1200 })}`;
  const signature = sign("sha256", Buffer.from(token), { key: key.replace(/\\n/gu, "\n"), dsaEncoding: "ieee-p1363" }).toString("base64url");

  const number = await nextBuildNumber(process.argv[2], async url => {
    const response = await fetch(url, { headers: { Authorization: `Bearer ${token}.${signature}` }, redirect: "error", signal: AbortSignal.timeout(30_000) });

    if (!response.ok)
      throw new Error(`App Store build lookup failed: HTTP ${response.status}`);

    return response.json();
  });

  process.stdout.write(`${number}\n`);
}
