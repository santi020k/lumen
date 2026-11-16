---
"@santi020k/lumen-core": patch
---

Observe panel and trigger shadow-root ancestor chains in `connectLumenFloatingPanel` so focus inside open, closed, or nested shadow roots stays owned while same-root sibling and external document focus transitions dismiss once, shadow-root removals clean up properly, and external dialog focus is preserved on cleanup.
