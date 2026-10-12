---
'@santi020k/lumen-react': patch
---

React `ListBox` `onFocus` and `onBlur` now fire once when focus enters or leaves the visible list, whether
focus arrives by label click, pointer, keyboard, or the select ref, so touched-on-blur form integrations
work. The events keep their `HTMLSelectElement` target and form name.
