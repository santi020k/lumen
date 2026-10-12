---
'@santi020k/lumen': patch
---

The enhanced `InputOTP` native input now spans the field width while staying visually hidden. Its 1px width made
Chromium apply `maxlength` to the old value when select-all typing or Playwright `fill()` replaced
the code, which emptied or truncated it.
