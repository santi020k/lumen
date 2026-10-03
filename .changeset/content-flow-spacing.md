---
"@santi020k/lumen": major
"@santi020k/lumen-astro": major
"@santi020k/lumen-react": major
"@santi020k/lumen-elements": major
"@santi020k/lumen-mcp": minor
"@santi020k/lumen-tokens": minor
---

Prepare the v4 content-flow contract: canonical gap sizes, semantic related/group/section gaps,
Card density and parent-owned part spacing, wrapping footer actions, and generated spacing tokens
available through CSS and MCP. Explicit md/lg/xl layout gaps now mean 12/16/24px; migrate old
16/24/32px layouts to group/xl/2xl. Default Stack/Grid spacing remains 16px. Comfortable Card
insets become 24px, and direct child margins no longer stack with layout gaps.
