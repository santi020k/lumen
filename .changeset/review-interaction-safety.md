---
"@santi020k/lumen": patch
"@santi020k/lumen-astro": patch
"@santi020k/lumen-elements": patch
"@santi020k/lumen-mcp": patch
"@santi020k/lumen-react-native": patch
---

Fix Elements submit-button behavior and dialog backdrop detection, preserve disabled option groups
in Astro Select, and keep Android date-picker cleanup scoped to the field that opened it.
Refresh the MCP server's bundled native source to include the date-picker fix.

Check that Corepack can run the consumer's pinned pnpm before rollout changes dependency declarations.
