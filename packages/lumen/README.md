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
lumen add Button --target react
lumen add Button --target elements
lumen add scheduler
```

Use `lumen add <component>` for a local Astro wrapper, `--target react` for a React wrapper, or
`--target elements` for a custom-elements registration helper. Recipe starters are currently Astro
files while React and Elements recipe equivalents are built out.
