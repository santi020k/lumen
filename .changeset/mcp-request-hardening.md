---
"@santi020k/lumen-mcp": patch
---

Return HTTP `405` with `Allow: POST` for non-`POST` requests to stateless `/mcp` endpoints, decode resource template variables safely once with canonical native alias resolution, use own-property lookups for catalog diffs and manifest diagnostics, support cross-platform `kind: "native-component"` search without altering default web rankings, and keep `platform`-scoped searches limited to native contracts.
