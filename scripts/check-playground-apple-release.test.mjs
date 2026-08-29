import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const sourceScript = fileURLToPath(new URL("./check-playground-apple-release.mjs", import.meta.url));

const runCheck = async ({ release, project }) => {
  const directory = await mkdtemp(join(tmpdir(), "lumen-apple-release-"));
  const scriptsDirectory = join(directory, "scripts");
  const appDirectory = join(directory, "apps", "playground-apple");
  const script = join(scriptsDirectory, "check-playground-apple-release.mjs");

  await mkdir(scriptsDirectory, { recursive: true });

  await mkdir(appDirectory, { recursive: true });

  await writeFile(script, await readFile(sourceScript));

  await writeFile(join(appDirectory, "release.json"), JSON.stringify(release));

  await writeFile(join(appDirectory, "project.yml"), project);

  return new Promise((resolve) => {
    const child = spawn(process.execPath, [script], { stdio: ["ignore", "pipe", "pipe"] });
    let output = "";

    child.stdout.on("data", (chunk) => { output += chunk; });

    child.stderr.on("data", (chunk) => { output += chunk; });

    child.on("close", (code) => resolve({ code, output }));
  });
};

test("accepts synchronized Apple playground versions", async () => {
  const result = await runCheck({
    release: { version: "1.2.3" },
    project: "settings:\n  MARKETING_VERSION: 1.2.3\n  MARKETING_VERSION: 1.2.3\n",
  });

  assert.equal(result.code, 0, result.output);

  assert.match(result.output, /synchronized at 1\.2\.3/);
});

test("rejects prerelease versions", async () => {
  const result = await runCheck({
    release: { version: "1.2.3-beta.1" },
    project: "settings:\n  MARKETING_VERSION: 1.2.3-beta.1\n",
  });

  assert.notEqual(result.code, 0);

  assert.match(result.output, /stable version/);
});

test("rejects a project version that differs from release metadata", async () => {
  const result = await runCheck({
    release: { version: "1.2.3" },
    project: "settings:\n  MARKETING_VERSION: 1.2.2\n",
  });

  assert.notEqual(result.code, 0);

  assert.match(result.output, /must match release\.json/);
});
