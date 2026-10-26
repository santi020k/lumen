---
"@santi020k/lumen-astro": minor
"@santi020k/lumen-core": minor
"@santi020k/lumen-mcp": patch
---

Add opt-in, localizable `scrollCue` guidance to Astro Code blocks and scrolling Tables.
One shared runtime shows the message and describes the native scroll region only when
content overflows. It follows resize, font loading, hidden panels, and Astro navigation,
preserving existing descriptions, keyboard scrolling, copy controls, and no-JavaScript content.

Expose the `scroll-cue` styling slot and document the Table runtime requirement when opted in.
