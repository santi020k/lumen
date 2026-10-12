---
'@santi020k/lumen-core': patch
'@santi020k/lumen-elements': patch
'@santi020k/lumen-astro': patch
---

`connectLumenFloatingPanel` now dismisses a panel whose trigger or panel leaves its original
document, including adoption into another document, so an Astro or Elements date picker removed while open closes, releases its listeners, and reopens normally when
reinserted. The docs now state that callers own hiding the panel.
