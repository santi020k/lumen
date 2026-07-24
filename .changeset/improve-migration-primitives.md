---
"@santi020k/lumen": minor
"@santi020k/lumen-astro": minor
"@santi020k/lumen-react": minor
---

Add migration-friendly link, pill, toggle, navigation menu, and sidebar contracts. Links now support
safe new-tab handling and inherited presentation, pills can render as links, Astro toggles expose a
cancelable controlled-state intent, navigation surfaces can opt out of Lumen presentation, and
Astro tabs can generate relationships, persist selection, synchronize groups, and emit changes.
The Astro theme toggle now switches and persists configured themes with the same circular reveal
used by the other framework adapters while respecting reduced-motion and touch preferences.
Astro component class props now preserve the nullable native attribute type for strict passthrough.
Cards and button links can also opt out of presentation while preserving their public semantic
contract and stable class hook.
The umbrella CLI can audit existing stylesheets for semantic-token name collisions with incompatible
complete CSS color values before migration.
Astro also warns about unsupported named Lucide icons during development and documents the custom
SVG slot for brand marks.
Framework packages also expose a Tailwind layer-order prelude so utilities reliably override Lumen
component display, spacing, radius, width, and responsive visibility defaults.
