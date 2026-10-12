---
'@santi020k/lumen-react': patch
---

React `ListBox` now exposes one accessible control. The hidden native select leaves the tab order and the
accessibility tree, and the visible list receives the `label`, `aria-label`, `aria-labelledby`, description,
error, and required semantics. Label clicks focus the list. Options get stable ids, and
`aria-activedescendant` follows the active option, starting at the selected one and skipping disabled or
missing options. An unselected required single ListBox now fails native validation instead of submitting
the first option, marks the list invalid, and focuses it when it is the first invalid control. A canceled
form reset keeps the current selection.
