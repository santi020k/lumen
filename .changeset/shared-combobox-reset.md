---
'@santi020k/lumen-core': patch
'@santi020k/lumen-astro': patch
'@santi020k/lumen-elements': patch
---

Close shared Combobox options and clear stale active-option state after an accepted native form reset. Refilter against the restored input value, preserve canceled resets, and cancel deferred work when the controller is destroyed.
