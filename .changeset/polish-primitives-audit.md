---
"@santi020k/lumen-astro": minor
---

Polish primitives after a full component audit.

Fixes: Textarea no longer injects whitespace into its value (placeholder now shows), Button
`loading` disables the button, Skeleton is `aria-hidden` by default unless labeled, AlertDialog
sets `role="alertdialog"`, Autocomplete drops the redundant explicit combobox role, AspectRatio
validates the `ratio` string, and Select is now a thin alias of NativeSelect instead of a
duplicated implementation.

New runtime behavior: ContextMenu opens at the pointer via right-click or Shift+F10 when an
element references it with `data-ui-context-menu-trigger="<menu id>"` (static rendering is
unchanged without a trigger), and DateRangePicker keeps its start/end date inputs mutually
consistent.
