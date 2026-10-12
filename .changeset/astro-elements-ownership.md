---
'@santi020k/lumen-astro': patch
'@santi020k/lumen-elements': patch
---

Astro `ListBox` names its visible list from external labels that mount, change, or leave after enhancement, stops
following labels when its root leaves the document, and resynchronizes when the same root is reinserted and
`LumenInitUiPrimitives` runs again. Elements `lumen-skeleton` and `lumen-spinner` copies made by cloning or
parsing their HTML again keep Lumen-generated `aria-hidden` and `role` values generated, so naming a copy announces it,
while consumer overrides stay explicit.
