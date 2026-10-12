---
'@santi020k/lumen-astro': patch
'@santi020k/lumen-elements': patch
---

Enhanced Astro and Elements list boxes keep their visible list in sync when the native select changes after
enhancement: disabling it removes the list from the tab order and marks it disabled, and later label,
description, error, required, and consumer `aria-invalid` changes reach the list. An accepted form reset
clears Lumen-generated invalid state even when the restored selection is still invalid, while a canceled
reset keeps it.
