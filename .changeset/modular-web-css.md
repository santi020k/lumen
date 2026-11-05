---
'@santi020k/lumen-core': minor
'@santi020k/lumen': minor
'@santi020k/lumen-astro': major
'@santi020k/lumen-react': major
'@santi020k/lumen-elements': major
---

Deliver shared foundation and component CSS through the existing packages. Astro components now
import their own styles automatically; React and Elements can import `styles/foundation.css` once
and `styles/components/<kebab-name>.css` where needed. Full and critical styles remain supported.
Icon defaults use low specificity so component state and sizes survive shared CSS chunk ordering.
Generated style dependencies include manual-copy recovery and dynamically created toasts.

Web adapters no longer install the umbrella CLI or expose its binary. Install `@santi020k/lumen`
as a development dependency to continue using `lumen add`, discovery, and diagnostics. Runtime styles
resolve through Core, so adapters no longer require the umbrella package or its TypeScript tooling.
