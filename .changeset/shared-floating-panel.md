---
'@santi020k/lumen-core': minor
'@santi020k/lumen-react': patch
'@santi020k/lumen-elements': patch
'@santi020k/lumen-astro': patch
---

Add `connectLumenFloatingPanel` to `@santi020k/lumen-core`: one shared placement helper for anchored panels.
React menus and date pickers now use it, and Astro and Elements date pickers do too, so their calendars
leave short or scrolling dialogs through the top layer instead of being clipped. Panels close when their
containing dialog closes, including in browsers that move focus to the page body without a focus event,
and settle back against their trigger after enclosing transform transitions or animations.
