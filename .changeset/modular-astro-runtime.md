---
"@santi020k/lumen-astro": major
---

Load Astro controllers by the features present on each page instead of shipping the interactive
catalog with every runtime mount. Preserve delayed first clicks, keyboard navigation, native
fallbacks, synchronized code tabs, and Astro navigation cleanup.

Enhancement now returns a promise. Await `window.LumenInitUiPrimitives(scope)` or listen for
`ui:ready` before inspecting enhanced DOM. The first programmatic toast operation may render
asynchronously while returning its stable ID immediately. Failed automatic loads dispatch
`ui:runtime-error`; available controllers still initialize.
