import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

export const captureShard = (catalog, index, count) => {
  if (!Number.isSafeInteger(count) || count < 1 ||
      !Number.isSafeInteger(index) || index < 0 || index >= count)
    throw new Error("Invalid native capture group");

  const components = catalog.trim().split(/\r?\n/u);

  if (components.some(component => !component.trim() || component !== component.trim()) ||
      new Set(components).size !== components.length || components.length < count)
    throw new Error("Invalid native capture catalog");

  return components.filter((_, position) => position % count === index);
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const catalog = await readFile(new URL("../../apps/playground-apple/scripts/component-capture-catalog.generated.txt", import.meta.url), "utf8");

  process.stdout.write(`${captureShard(catalog, Number(process.argv[2]), Number(process.argv[3])).join("\n")}\n`);
}
