---
'@santi020k/lumen-astro': patch
'@santi020k/lumen-elements': patch
---

Enhanced Astro and Elements list boxes now expose one accessible control. The native select leaves the tab
order and the accessibility tree, label clicks and select focus move to the visible list, and the list
receives the native label, `aria-label`, description, error, and required semantics. Native validation
marks and focuses the first invalid list until a valid choice clears it, while consumer `aria-invalid`
wins. Elements reports `aria-busy` and `aria-multiselectable` as real values, and unnamed lists in either
adapter get distinct ids.
