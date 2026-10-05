// cspell:words xctestrun

import { spawnSync } from "node:child_process";
import { readdir, readFile, stat, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

export const validateProducts = async (directory, expected) => {
  const metadata = JSON.parse(await readFile(join(directory, "lumen-capture-build.json"), "utf8"));

  if (metadata.revision !== expected.revision || metadata.toolchain !== expected.toolchain)
    throw new Error("Native capture products do not match this revision/toolchain");

  const runs = (await readdir(directory)).filter(name => name.endsWith(".xctestrun"));

  if (runs.length !== 1)
    throw new Error("Expected exactly one native test run");

  for (const name of ["LumenApplePlayground.app", "LumenApplePlaygroundUITests-Runner.app"]) {
    if (!(await stat(join(directory, "Debug-iphonesimulator", name))).isDirectory())
      throw new Error("Missing native capture app/test runner");
  }
};

const output = (command, args) => {
  const result = spawnSync(command, args, { encoding: "utf8" });

  if (result.status !== 0)
    throw new Error(`Could not verify ${command}`);

  return result.stdout.trim();
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [mode, directory] = process.argv.slice(2);

  if (!["record", "verify"].includes(mode) || !directory)
    throw new Error("Usage: apple-capture-products.mjs record|verify directory");

  const expected = { revision: output("git", ["rev-parse", "HEAD"]), toolchain: output("xcodebuild", ["-version"]) };

  if (mode === "record")
    await writeFile(join(directory, "lumen-capture-build.json"), JSON.stringify(expected));

  await validateProducts(directory, expected);
}
