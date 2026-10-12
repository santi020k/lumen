---
"@santi020k/lumen-react-hook-form": patch
---

`LumenDatePickerController`, `LumenSelectController`, and `LumenListBoxController` now focus the
visible trigger or list on `setFocus` and invalid submit instead of the hidden native control, and
mark the field touched when focus leaves the whole component. Native validity messages stay on the
submitted native field, and moving focus into the calendar or options does not mark the field
touched.
