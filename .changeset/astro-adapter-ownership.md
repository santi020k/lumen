---
"@santi020k/lumen-astro": patch
---

The Astro runtime skips DatePicker, Calendar, and InputOTP markup marked `data-ui-owner`, so React
islands on Astro pages keep their ids, labels, and state before and after hydration, and opening an
Astro DatePicker no longer closes a React-owned popover behind React's state.
