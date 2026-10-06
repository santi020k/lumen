---
"@santi020k/lumen-react": patch
---

Fix four React form correctness issues: `DatePicker` calendar selection now sets the native input
value through React's value setter so `onChange` fires exactly once; `PhoneInput` defers its form
reset past the default action and honors a cancelled reset, a disconnected or unmounted control,
and a controlled value; `DateRangeInput` attaches its reset listener even without `name`, using an
always-present wrapper ref that respects an explicit `form` id as well as the nearest ancestor
form; and `Combobox` now supports native form reset, restoring an uncontrolled `defaultValue`,
preserving a controlled value, and closing options without emitting `onChange`.
