---
'@santi020k/lumen-react': patch
---

`InputOTP` and `useInputOTP` leave a paste alone when the consumer `onPaste` handler calls
`preventDefault()`, matching the cancellation contract of other Lumen handlers.
