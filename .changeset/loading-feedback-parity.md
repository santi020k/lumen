---
"@santi020k/lumen": patch
"@santi020k/lumen-core": minor
"@santi020k/lumen-astro": minor
"@santi020k/lumen-react": minor
"@santi020k/lumen-elements": minor
---

Strengthen loading feedback across Astro, React, and Elements.

- Skeleton accepts `shape` (`rectangle`, `text`, `circle`), `width`, `height`, and `animation`
  (`shimmer`, `pulse`, `none`). The default shimmer rectangle and its 1rem height are unchanged,
  but explicit heights and classes can now size placeholders below 1rem. Sizes accept pixels,
  lengths, percentages, and `calc()` or `var()` expressions, and unsafe values are ignored.
- React and Elements Skeleton, and Elements Spinner, match Astro: decorative (`aria-hidden`) unless
  named, `role="status"` when named, and explicit ARIA overrides win. Elements updates these as
  labels change and after reconnecting.
- `lumen-skeleton` and `lumen-progress` now render as blocks instead of collapsing inline.
- Progress clamps NaN and infinite `max` or `value` to finite ARIA values in every adapter. The
  Astro `ui:progress-change` runtime ignores missing, `null`, or non-numeric event detail.
- Core exports the shared `normalizeLumenProgress`, `resolveLumenLoadingSemantics`, and Skeleton
  option resolvers.
