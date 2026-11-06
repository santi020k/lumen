---
"@santi020k/lumen-core": patch
"@santi020k/lumen-astro": patch
"@santi020k/lumen-react": patch
"@santi020k/lumen-elements": patch
"@santi020k/lumen": patch
---

Preserve public Image radius props inside default and editorial Prose. Generic article image
rounding no longer overrides `radius="none"` or other explicit Image radii, so a figure can own
its outer border and corner clipping without rounded gaps between the image and its caption.
