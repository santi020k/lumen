---
"@santi020k/lumen": patch
"@santi020k/lumen-astro": minor
"@santi020k/lumen-core": patch
"@santi020k/lumen-elements": minor
"@santi020k/lumen-mcp": patch
---

Make `lumen doctor` workspace-aware, ignore generated build trees, parse real adapter imports,
recognize controlled Astro toggles, and deduplicate diagnostics. Preserve native form-control
`size` across adapters while adding explicit Astro `visualSize` and Elements `visual-size` styling
contracts with pre-1.0 alias compatibility.
