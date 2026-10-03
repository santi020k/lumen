import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { validatePluginContracts, validateReviewer } from './lib/plugin-contract.mjs';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const pluginRoot = join(repositoryRoot, "plugins", "lumen-ui");
const sourceSkillRoot = join(repositoryRoot, "skills");
const pluginSkillRoot = join(pluginRoot, "skills");
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

const openAIManifest = JSON.parse(
  await readFile(join(pluginRoot, ".codex-plugin", "plugin.json"), "utf8"),
);

const claudeManifest = JSON.parse(
  await readFile(join(pluginRoot, ".claude-plugin", "plugin.json"), "utf8"),
);

const claudeMarketplace = JSON.parse(
  await readFile(
    join(repositoryRoot, ".claude-plugin", "marketplace.json"),
    "utf8",
  ),
);

const mcpConfiguration = JSON.parse(
  await readFile(join(pluginRoot, ".mcp.json"), "utf8"),
);

const portableManifest = JSON.parse(await readFile(join(pluginRoot, "plugin.json"), "utf8"));
const portableMcp = JSON.parse(await readFile(join(pluginRoot, "mcp.json"), "utf8"));

validatePluginContracts({ portable: portableManifest, portableMcp, openai: openAIManifest, claude: claudeManifest, legacyMcp: mcpConfiguration, mcpVersion: JSON.parse(await readFile(join(repositoryRoot, 'packages/mcp/package.json'), 'utf8')).version });

assert.equal(portableManifest.$schema, "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json");

assert.equal(portableMcp.$schema, "https://agent-plugins.org/schemas/1.0.0/mcp.schema.json");

assert.match(portableManifest.version, /^[1-9]\d*\.\d+\.\d+$/u);

assert.equal(openAIManifest.version, portableManifest.version);

assert.equal(claudeManifest.version, portableManifest.version);

assert.deepEqual(openAIManifest.interface, portableManifest.extensions["com.openai"].interface);

assert.deepEqual(claudeManifest.agents, ["./agents/lumen-reviewer.md"]);

assert.deepEqual(portableMcp.mcpServers.lumen, { type: "stdio", ...mcpConfiguration.mcpServers.lumen });

assert.equal(openAIManifest.name, "lumen-ui");

assert.equal(openAIManifest.mcpServers, "./.mcp.json");

assert.equal(openAIManifest.skills, "./skills/");

assert.equal(claudeManifest.name, openAIManifest.name);

assert.equal(claudeManifest.displayName, openAIManifest.interface.displayName);

assert.equal(claudeManifest.mcpServers, "./.mcp.json");

assert.equal(claudeManifest.skills, "./skills/");

assert.equal(claudeMarketplace.name, "lumen");

assert.deepEqual(claudeMarketplace.plugins, [
  {
    description:
      "Build accessible web and native interfaces with the Lumen workflow and live component catalog",
    name: "lumen-ui",
    source: "./plugins/lumen-ui",
  },
]);

assert.deepEqual(mcpConfiguration, {
  mcpServers: {
    lumen: {
      args: ["-y", "@santi020k/lumen-mcp@4.0.0"],
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

process.stdout.write(
  `lumen-ui: portable, OpenAI and Claude Code plugin ${portableManifest.version} packages are synchronized and valid\n`,
);

validateReviewer(await readFile(join(pluginRoot, 'agents/lumen-reviewer.md'), 'utf8'));
