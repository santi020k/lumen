# @santi020k/lumen

Shared foundation and umbrella package for Lumen UI.

Install it alongside the adapter for your framework:

- `@santi020k/lumen-astro`
- `@santi020k/lumen-react`
- `@santi020k/lumen-elements`

```bash
pnpm add @santi020k/lumen @santi020k/lumen-react
```

Load the framework-neutral stylesheet once from your global CSS or application entry:

```css
@import "@santi020k/lumen/styles.css";
```

The umbrella package also exposes typed registry metadata and the `lumen` CLI:

```bash
lumen list
lumen show Button
lumen add Button
lumen add Button --target react
lumen add Button --target elements
lumen add scheduler
lumen add scheduler --target react
lumen add scheduler --target elements
```

Use `lumen add <component>` for a local Astro wrapper, `--target react` for a React wrapper, or
`--target elements` for a custom-elements starter. Bundled recipes support the same Astro, React,
and Elements targets.
