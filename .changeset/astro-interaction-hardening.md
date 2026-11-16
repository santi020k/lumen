---
"@santi020k/lumen-astro": patch
---

Harden Astro runtime interaction handling across roving groups, forms, speed dial, and document navigation:

- Skip native disabled, hidden, and inert items dynamically in roving groups while keeping `aria-disabled` menuitems focusable, blocking disabled radio activation, isolating nested groups, and honoring canceled, composing, and modifier keys.
- Defer form reset status and validation cleanup until after dispatch, honor canceled resets, clear only runtime-owned validation (including disabled and external form-associated controls), and preserve authored errors.
- Resolve SpeedDial active items via `getScopeActiveElement` for Shadow DOM, exclude native disabled/hidden/inert items dynamically while keeping `aria-disabled` menuitems discoverable without activation, and guard disabled triggers.
- Disconnect the document-navigation `ResizeObserver` idempotently during `astro:before-swap` cleanup and reinitialize cleanly on subsequent navigation.
