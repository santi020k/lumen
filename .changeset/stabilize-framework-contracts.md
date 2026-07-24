---
"@santi020k/lumen": patch
"@santi020k/lumen-astro": patch
"@santi020k/lumen-core": patch
"@santi020k/lumen-elements": patch
"@santi020k/lumen-mcp": patch
"@santi020k/lumen-react": patch
---

Stabilize the existing catalog without adding components: complete the typed API reference, add
cross-framework class and behavior contract checks, enforce coverage and bundle-size budgets, load
motion controllers only when matching Astro primitives are present, and adopt
`ui:data-table-selection-change` while keeping the previous DataTable event as a compatibility
alias until Lumen 1.0.
