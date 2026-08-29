import { readFile } from "node:fs/promises";

const releasePath = new URL("../apps/playground-apple/release.json", import.meta.url);
const projectPath = new URL("../apps/playground-apple/project.yml", import.meta.url);
const versionPattern = /^\d+\.\d+(?:\.\d+)?$/;
const release = JSON.parse(await readFile(releasePath, "utf8"));

if (
  !release
  || typeof release !== "object"
  || Array.isArray(release)
  || Object.keys(release).length !== 1
  || typeof release.version !== "string"
  || !versionPattern.test(release.version)
) {
  throw new Error("apps/playground-apple/release.json must contain only a stable version such as 1.0.0.");
}

const project = await readFile(projectPath, "utf8");

const marketingVersions = [...project.matchAll(/^\s*MARKETING_VERSION:\s*([^\s#]+)\s*$/gmu)]
  .map((match) => match[1]);

if (marketingVersions.length === 0) {
  throw new Error("apps/playground-apple/project.yml does not declare MARKETING_VERSION.");
}

if (marketingVersions.some((version) => version !== release.version)) {
  throw new Error(
    `Every Apple playground MARKETING_VERSION must match release.json (${release.version}).`,
  );
}

console.log(`Apple playground release metadata is synchronized at ${release.version}.`);
