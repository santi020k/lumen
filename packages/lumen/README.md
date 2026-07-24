# @santi020k/lumen

Shared foundation and umbrella package for Lumen UI.

Install the framework package directly:

- `@santi020k/lumen-astro`
- `@santi020k/lumen-react`
- `@santi020k/lumen-elements`

Each adapter includes the shared foundation and exposes its own stylesheet entry. Install this
umbrella package only when you want the framework-neutral CLI or registry APIs:

```bash
pnpm add @santi020k/lumen
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
lumen audit-tokens ./src
```

Use `lumen add <component>` for a local Astro wrapper, `--target react` for a React wrapper, or
`--target elements` for a custom-elements starter. Bundled recipes support the same Astro, React,
and Elements targets.

Run `lumen audit-tokens [path]` before incremental adoption when an existing stylesheet may already
declare names such as `--surface`, `--ink`, or `--line`. The audit reports complete CSS colors that
are incompatible with Lumen's HSL-channel token format and exits non-zero when it finds conflicts.
