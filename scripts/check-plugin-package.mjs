import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const pluginRoot = join(repositoryRoot, "plugins", "lumen-ui");
const sourceSkillRoot = join(repositoryRoot, "skills", "lumen-ui");
const pluginSkillRoot = join(pluginRoot, "skills", "lumen-ui");
const publicBrandRoot = join(repositoryRoot, "apps", "docs", "public");

const listFiles = async (directory) => {
  const entries = await readdir(directory, { withFileTypes: true });

  const nested = await Promise.all(
    entries.map(async (entry) => {
      const path = join(directory, entry.name);

      return entry.isDirectory() ? listFiles(path) : [path];
    }),
  );

  return nested.flat().sort();
};

const sourceFiles = await listFiles(sourceSkillRoot);
const pluginFiles = await listFiles(pluginSkillRoot);
const sourcePaths = sourceFiles.map((path) => relative(sourceSkillRoot, path));
const pluginPaths = pluginFiles.map((path) => relative(pluginSkillRoot, path));

assert.deepEqual(
  pluginPaths,
  sourcePaths,
  "The packaged Lumen skill file tree is stale.",
);

await Promise.all(
  sourcePaths.map(async (path) => {
    const [source, packaged] = await Promise.all([
      readFile(join(sourceSkillRoot, path)),
      readFile(join(pluginSkillRoot, path)),
    ]);

    assert.deepEqual(
      packaged,
      source,
      `The packaged Lumen skill is stale: ${path}`,
    );
  }),
);

const manifest = JSON.parse(
  await readFile(join(pluginRoot, ".codex-plugin", "plugin.json"), "utf8"),
);

const mcpConfiguration = JSON.parse(
  await readFile(join(pluginRoot, ".mcp.json"), "utf8"),
);

assert.equal(manifest.name, "lumen-ui");

assert.equal(manifest.mcpServers, "./.mcp.json");

assert.equal(manifest.skills, "./skills/");

assert.deepEqual(mcpConfiguration, {
  mcpServers: {
    lumen: {
      args: ["-y", "@santi020k/lumen-mcp@latest"],
      command: "npx",
    },
  },
});

const [pluginIcon, canonicalIcon, pluginLogo, canonicalLogo] = await Promise.all([
  readFile(join(pluginRoot, "assets", "icon.png")),
  readFile(join(publicBrandRoot, "favicon-32x32.png")),
  readFile(join(pluginRoot, "assets", "logo.svg")),
  readFile(join(publicBrandRoot, "logo.svg")),
]);

assert.deepEqual(pluginIcon, canonicalIcon, "The packaged plugin icon is stale.");

assert.deepEqual(pluginLogo, canonicalLogo, "The packaged plugin logo is stale.");

process.stdout.write("lumen-ui: plugin package is synchronized and valid\n");
