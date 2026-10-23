---
"@santi020k/lumen-react-native": patch
---

Use the supported Android date selection callback. Dismissing a DateField or DateRangeField
picker no longer commits its original value; selected dates still respect the configured bounds.
The existing datetimepicker peer range already supports this callback.
