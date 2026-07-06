# @santi020k/lumen

Umbrella package for Lumen UI.

Install framework-specific packages for components:

- `@santi020k/lumen-astro`
- `@santi020k/lumen-react`
- `@santi020k/lumen-elements`

The umbrella package also exposes typed registry metadata and the `lumen` CLI:

```bash
lumen list
lumen show Button
lumen add Button
lumen add scheduler
```

Use `lumen add <component>` for a local Astro wrapper for an individual registry component, or
`lumen add <recipe>` for the existing starter recipe files.
