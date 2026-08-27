---
"@santi020k/lumen": patch
---

Attach Compose date and phone validation errors directly to their actionable controls so TalkBack
announces invalid context when users focus the date button or editable phone field. Dismiss open
date, picker, and phone-country overlays when their controls become disabled, and keep empty pickers
unavailable so disabled state cannot leak later selection callbacks.
