---
"@santi020k/lumen-core": patch
---

Harden chart tick generation, CSS theme token parsing, and code tokenization against malformed and adversarial inputs:

- Clamp `getLumenChartTicks` requested `count` parameter to `[2, 4096]` (falling back to `5` when non-finite) so tick generation stays bounded without restricting ordinary tick counts. Ticks remain finite, strictly monotonic, and distinct for finite, increasing domains across extreme ranges and millisecond timestamps.
- Replace regex scanning in `parseThemeCss` with a forward-only linear scanner that consumes complete ASCII, Unicode, and backslash-escaped CSS identifiers without suffix collisions or repeated suffix scanning while preserving first-declaration and whitespace-only value semantics.
- Replace backtracking regular expressions, repeated escaped-quote scanning, and backward tag scans in `tokenizeLumenCode` with forward-only linear scanners and monotonic closer tracking for YAML, Markdown, and Markup while preserving JavaScript whitespace semantics, contiguous token offsets, and attribute classification after `>` inside quoted attribute strings.
