#!/usr/bin/env bash
set -euo pipefail

tag="$1"
destination="$2"
[[ "$tag" =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]]
mkdir "$destination"

git archive "refs/tags/$tag:plugins/lumen-ui" -- .claude-plugin agents assets/icon.png skills |
  tar -x -C "$destination"
git show "refs/tags/$tag:LICENSE" > "$destination/LICENSE"

manifest="$destination/.claude-plugin/plugin.json"
jq -e '.name == "lumen-ui" and (.version | test("^[0-9]+\\.[0-9]+\\.[0-9]+$"))' "$manifest" >/dev/null
# The public directory requires hosted MCP for publishers without organization verification.
jq -n '{mcpServers: {lumen: {type: "http", url: "https://mcp.lumen.santi020k.com/mcp"}}}' \
  > "$destination/.mcp.json"

# Keep the directory's supported front matter while preserving the source marketplace agent.
agent="$destination/agents/lumen-reviewer.md"
awk '
  NR == 1 && $0 == "---" { header = 1; print; next }
  header && $0 == "---" { header = 0; print; next }
  header && /^skills:/ { skip = 1; next }
  header && skip && /^[[:space:]]/ { next }
  { skip = 0 }
  header && /^tools:/ { sub(/mcp__lumen__\*/, "mcp__plugin_lumen-ui_lumen__*") }
  !header && /^Use the preloaded Lumen Review workflow / {
    print "Read ${CLAUDE_PLUGIN_ROOT}/skills/lumen-review/SKILL.md before reviewing the requested surface."
    print "Return evidence-backed findings with file locations and observable consequences."
    next
  }
  !header && /^with file locations and observable consequences\. If the skill is unavailable,/ { next }
  !header { sub(/^skills\/lumen-review\/SKILL\.md before reviewing\. /, "") }
  { print }
' "$agent" > "$agent.tmp"
mv "$agent.tmp" "$agent"
cat > "$destination/README.md" <<'README'
# Lumen UI for Claude Code

Build, review, and migrate accessible Lumen interfaces across Astro, React, Web Components,
React Native, SwiftUI, and Jetpack Compose.

The plugin includes three skills, an optional reviewer agent, and the read-only Lumen MCP catalog.
Claude connects to the public Lumen MCP over HTTPS and sends catalog queries and tool arguments
to `https://mcp.lumen.santi020k.com/mcp`. The service returns public documentation and does not
persist tool arguments or responses. Do not include credentials, personal data, or private source
in catalog queries. No Lumen account or API key is required. See the
[Lumen privacy policy](https://lumen.santi020k.com/privacy).

For a local catalog, install from the original Lumen marketplace in Claude Code:

```text
/plugin install lumen-ui --marketplace santi020k/lumen
```

Lumen publishes this copy from its stable GitHub releases. Report issues and propose changes in
the [Lumen source repository](https://github.com/santi020k/lumen). See the
[Claude Code guide](https://github.com/santi020k/lumen/blob/main/docs/claude-code-plugin.md) and
[MCP documentation](https://lumen.santi020k.com/docs/mcp).

Released under the MIT license.
README
