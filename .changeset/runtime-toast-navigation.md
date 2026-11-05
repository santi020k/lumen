---
'@santi020k/lumen-astro': patch
'@santi020k/lumen-elements': patch
---

Retain lazily requested toast CSS across Astro client navigation and keep its loader outside the
initial runtime bundle. Deduplicate WorldMap element creation to keep new styling parts within the
existing bundle budget.
