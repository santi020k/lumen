---
"@santi020k/lumen-astro": patch
---

Forward native Select focus to its visible trigger while preserving the native control ID and
validation focus ownership. Keep the trigger's disabled, required, and invalid state synchronized
with native attribute updates and removals, including controls initialized in a shadow root.
