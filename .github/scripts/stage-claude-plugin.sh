#!/usr/bin/env bash
set -euo pipefail

tag="$1"
destination="$2"
[[ "$tag" =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]]
mkdir "$destination"

git archive "refs/tags/$tag:plugins/lumen-ui" -- .claude-plugin .mcp.json agents assets skills |
  tar -x -C "$destination"
git show "refs/tags/$tag:LICENSE" > "$destination/LICENSE"

manifest="$destination/.claude-plugin/plugin.json"
jq -e '.name == "lumen-ui" and (.version | test("^[0-9]+\\.[0-9]+\\.[0-9]+$"))' "$manifest" >/dev/null
mcp_version="$(git show "refs/tags/$tag:packages/mcp/package.json" | jq -er .version)"
jq -e --arg pin "@santi020k/lumen-mcp@$mcp_version" \
  '.mcpServers.lumen | .command == "npx" and (.args | index($pin) != null)' \
  "$destination/.mcp.json" >/dev/null
test "$(npm view "@santi020k/lumen-mcp@$mcp_version" version)" = "$mcp_version"

cat > "$destination/README.md" <<'README'
# Lumen UI for Claude Code

Build, review, and migrate accessible Lumen interfaces across Astro, React, Web Components,
React Native, SwiftUI, and Jetpack Compose.

The plugin includes three skills, an optional reviewer agent, and the read-only Lumen MCP catalog.
Claude Code starts the pinned catalog locally with Node.js and npx. No Lumen account or API key is
required.

```text
/plugin install lumen-ui --marketplace santi020k/lumen
```

Lumen publishes this copy from its stable GitHub releases. Report issues and propose changes in
the [Lumen source repository](https://github.com/santi020k/lumen). See the
[Claude Code guide](https://github.com/santi020k/lumen/blob/main/docs/claude-code-plugin.md) and
[MCP documentation](https://lumen.santi020k.com/docs/mcp).

Released under the MIT license.
README
