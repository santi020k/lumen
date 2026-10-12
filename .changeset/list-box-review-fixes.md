---
'@santi020k/lumen-react': patch
'@santi020k/lumen-react-hook-form': patch
'@santi020k/lumen-astro': patch
'@santi020k/lumen-elements': patch
---

React `ListBox` lists are now named by labels that target or wrap the hidden select, after an explicit
`aria-labelledby`, `aria-label`, or `label`. Astro and Elements list boxes clear Lumen-generated invalid state
when the select is valid again, disabled, or no longer required, while consumer `aria-invalid` stays. Leaving a
react-hook-form `LumenListBoxController` now validates once instead of twice.
