// cspell:words xctestrun

import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { validateProducts } from "./apple-capture-products.mjs";

test("shared native products require exact revision, toolchain, app and one test run", async () => {
  const directory = await mkdtemp(join(tmpdir(), "lumen-capture-products-"));
  const expected = { revision: "approved-commit", toolchain: "stable-xcode" };

  try {
    await writeFile(join(directory, "lumen-capture-build.json"), JSON.stringify(expected));

    await assert.rejects(validateProducts(directory, expected), /exactly one/u);

    await writeFile(join(directory, "capture.xctestrun"), "fixture");

    await assert.rejects(validateProducts(directory, expected));

    for (const name of ["LumenApplePlayground.app", "LumenApplePlaygroundUITests-Runner.app"])
      await mkdir(join(directory, "Debug-iphonesimulator", name), { recursive: true });

    await validateProducts(directory, expected);

    await assert.rejects(validateProducts(directory, { ...expected, revision: "different" }), /revision/u);

    await assert.rejects(validateProducts(directory, { ...expected, toolchain: "different" }), /toolchain/u);

    await writeFile(join(directory, "duplicate.xctestrun"), "fixture");

    await assert.rejects(validateProducts(directory, expected), /exactly one/u);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
