---
'@santi020k/lumen-astro': patch
---

Fix Toast dispatching duplicate `[data-ui-toast]` elements for a single `ui:toast` event after
an Astro client-side navigation. The document-level Toast API is now bound once per Document
instance instead of a `documentElement` dataset flag that Astro's HTML swap resets on every
navigation, even though the `document` event listeners it installs persist.
