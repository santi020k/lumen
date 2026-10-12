---
'@santi020k/lumen-react': patch
---

`InputOTP` paste now reaches consumer `onChange` handlers, controlled values, and react-hook-form controllers
once with the sanitized code. Uncontrolled `InputOTP` keeps typed digits without an `onValueChange`, and
`useInputOTP` notifies `onValueChange` once per input instead of twice.
