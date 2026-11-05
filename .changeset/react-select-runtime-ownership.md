---
"@santi020k/lumen-react": patch
"@santi020k/lumen-astro": patch
---

Preserve React Select ownership when the Astro runtime initializes or observes the same page.
Expose the existing adapter ownership marker through useSelect root props and exclude those roots
from Astro Select initialization and outside dismissal. Keep native Astro Select enhancement intact.
