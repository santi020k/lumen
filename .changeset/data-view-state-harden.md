---
"@santi020k/lumen-core": patch
---

Harden data-view state parsing and pagination against non-finite, non-positive, fractional, and
unsafe numeric values by normalizing them to the documented defaults. Preserve structured sort
keys containing colons across URL parsing and serialization instead of truncating the key at its
first separator.
