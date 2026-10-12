---
'@santi020k/lumen-react-native': patch
---

`LumenPicker` inside a `LumenFieldGroup` now announces the group's error or description as its accessibility
hint, reports `aria-invalid` while the group shows an error, and uses the danger border like other invalid
fields. Pickers outside a field group are unchanged.
