---
'@santi020k/lumen-react': patch
'@santi020k/lumen': patch
---

React `DatePicker` places its calendar with the shared floating panel, so short or scrolling dialogs no
longer clip it. The calendar follows its trigger through scroll and resize, respects RTL, closes on outside
focus, and restores its styles when it closes. The popover inherits its text color instead of the browser's
popover default.
