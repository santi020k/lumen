---
'@santi020k/lumen-core': patch
'@santi020k/lumen-react': patch
'@santi020k/lumen': patch
'@santi020k/lumen-astro': patch
'@santi020k/lumen-elements': patch
---

Loading indicators treat non-string runtime `aria-label` and `aria-labelledby` values as unnamed instead of
throwing. Floating panels skip focus for a malformed `initialFocus` selector and still return their cleanup.
React `ListBox` keeps its list name current when an external label mounts, leaves, changes its `id` or `for`, or
is replaced after the first render, and releases the label ids it generated. Skeleton shimmer and pulse stop
looping under reduced motion in `critical.css`, which omits the full stylesheet's universal reduction.
