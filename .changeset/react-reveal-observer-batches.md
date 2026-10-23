---
'@santi020k/lumen-react': patch
---

Use the latest visibility change in each observer batch for ScrollReveal and RevealGroup,
matching the Astro runtime. A stale entry no longer hides newly visible content or disconnects
a one-time reveal before its latest visibility state is applied. Existing thresholds, reduced
motion, and repeatable entrances retain their behavior.
