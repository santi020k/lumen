---
"@santi020k/lumen": major
---

Generate selective public component imports and required CSS in editable wrappers. Register only the
selected Elements constructor, preserve idempotence, and identify catalog fallbacks explicitly.
Astro wrappers rely on the Lumen 5 automatic component CSS contract.

Change setup output to the Lumen 5 selective foundation guidance instead of full catalog CSS and
Elements registration. Keep full styles.css as an explicit convenience option. Source-only doctor
recognizes selective setup with installed or direct-range major-5 evidence and keeps legacy behavior
when that evidence is absent. Existing consumers should run setup for their selected framework and
review the selective installation guide before replacing their current stylesheet setup.
