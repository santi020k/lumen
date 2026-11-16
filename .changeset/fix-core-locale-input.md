---
"@santi020k/lumen-core": patch
---

Fix RTL/directional-mark parsing for localized negative numbers in `amount-field` and `native-input`, keep the `AmountField` caret after a leading decimal point, preserve previous `AmountField` controller state when `setValue` rejects an invalid draft, and fall back safely in `getLumenPhoneCountries` when `locale` is malformed.
