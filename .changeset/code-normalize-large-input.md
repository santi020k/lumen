---
'@santi020k/lumen-core': patch
---

Fix `normalizeLumenCode` (used by `tokenizeLumenCode`, `renderLumenCodeHtml`, and the `Code`
component's highlighting fallback) so it no longer throws `RangeError: Maximum call stack size
exceeded` on very large code blocks. It computed the shared indentation with
`Math.min(...indentation)`, which spreads one argument per line and overflows the call stack past
roughly 100,000 lines; it now finds the minimum with a linear scan and also trims leading/trailing
blank lines by index instead of repeated `Array#shift`/`pop`, avoiding quadratic behavior on inputs
with many blank lines.
