import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { captureShard } from "./apple-capture-shard.mjs";

test("capture groups cover the canonical catalog exactly once, including Tour", async () => {
  const catalog = await readFile(new URL("../../apps/playground-apple/scripts/component-capture-catalog.generated.txt", import.meta.url), "utf8");
  const components = catalog.trim().split("\n");
  const groups = Array.from({ length: 4 }, (_, index) => captureShard(catalog, index, 4));
  const combined = groups.flat();

  assert.equal(combined.length, components.length);

  assert.equal(new Set(combined).size, components.length);

  assert.deepEqual(combined.toSorted(), components.toSorted());

  assert.equal(combined.filter(component => component === "Tour").length, 1);

  assert.ok(Math.max(...groups.map(group => group.length)) - Math.min(...groups.map(group => group.length)) <= 1);
});

test("invalid groups and incomplete or duplicate catalogs fail closed", () => {
  for (const [index, count] of [[-1, 4], [4, 4], [0.5, 4], [0, 0], [0, NaN], [0, 5]])
    assert.throws(() => captureShard("Theme\nText\nTour\nIcon", index, count));

  for (const catalog of ["", "Theme\nTheme", "Theme\n\nTour", "Theme\n Tour"])
    assert.throws(() => captureShard(catalog, 0, 1));

  assert.deepEqual(captureShard("Theme\r\nTour\r\n", 0, 1), ["Theme", "Tour"]);
});
