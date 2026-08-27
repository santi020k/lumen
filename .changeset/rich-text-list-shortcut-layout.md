---
'@santi020k/lumen-core': patch
---

Fix `getLumenRichTextShortcut` so the `Ctrl/Cmd+Shift+7` (ordered list) and `Ctrl/Cmd+Shift+8`
(unordered list) shortcuts work in real browsers. The lookup matched the layout-dependent shifted
character reported in `KeyboardEvent.key` (for example `&`/`*` on a US layout), which never equals
the digit the code checked for, so the shortcuts silently did nothing. Matching now uses the
layout-independent physical key (`KeyboardEvent.code`) for these two shortcuts.
