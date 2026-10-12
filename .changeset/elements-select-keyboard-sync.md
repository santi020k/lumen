---
"@santi020k/lumen-elements": patch
---

Align `lumen-select` keyboard and dismissal behavior with the Astro reference. Space opens the
listbox and selects the focused option instead of being consumed as a typeahead character, moving
focus outside the field closes the listbox, and the listbox shares the trigger's accessible name.
The listbox now re-renders when native options are added, removed, relabeled, or disabled, and the
trigger follows the native select's `disabled` state. A focused option keeps focus, and the
listbox stays open, when that re-render replaces it.
