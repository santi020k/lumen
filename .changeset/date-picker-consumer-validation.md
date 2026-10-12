---
"@santi020k/lumen-react": patch
"@santi020k/lumen-astro": patch
"@santi020k/lumen-elements": patch
---

Fix DatePicker state when applications load values and provide validation feedback.

- React reopens the calendar on the current selected month without preventing month navigation.
- The visible trigger mirrors consumer `aria-invalid`, `aria-describedby`, and `aria-errormessage`
  attributes. Astro and Elements also respond when these native input attributes change.
- Generated native validation feedback clears after valid values, relevant constraint changes, or
  uncanceled resets. Explicit application errors remain intact.
- Escape still dismisses React DatePicker when pointer month navigation moves focus to the document.
