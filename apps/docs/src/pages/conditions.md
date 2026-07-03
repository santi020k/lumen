---
title: Package Conditions
---

# Package Conditions

Lumen packages use Node-style package `exports` maps to describe the public entry points that consumers can import. Treat those maps as the package contract: if an entry is listed there, consumers may rely on it; if it is omitted, it is private even when the file exists in the published tarball.

## Supported Conditions

Each compiled TypeScript package exposes the same baseline conditions:

- `types` points TypeScript and editor tooling at the declaration file for the entry point.
- `import` points ESM-aware bundlers and runtimes at the JavaScript module.
- `./package.json` is exposed for tools that inspect package metadata.

The Astro package intentionally differs because Astro consumers import source `.astro` files directly:

- `.` exposes the package barrel through `index.ts` and `index.d.ts`.
- `./components/*` exposes individual Astro component files.
- `./runtime` exposes the `UIPrimitives.astro` runtime component.
- `./styles.css` exposes the shared Lumen stylesheet.
- `./package.json` is available for package metadata tooling.

## Package Entry Points

| Package | Public entry points |
| --- | --- |
| `@santi020k/lumen` | `.`, `./package.json` |
| `@santi020k/lumen-core` | `.`, `./tokens`, `./components`, `./package.json` |
| `@santi020k/lumen-astro` | `.`, `./components/*`, `./runtime`, `./styles.css`, `./package.json` |
| `@santi020k/lumen-react` | `.`, `./package.json` |
| `@santi020k/lumen-elements` | `.`, `./define`, `./package.json` |

## Change Checklist

Before changing a package `exports` map:

1. Add the runtime file and matching declaration output, or confirm that Astro can consume the source file directly.
2. Keep `types` and `import` targets paired for TypeScript packages.
3. Add the new public entry point to the package README when it is meant for users.
4. Run `pnpm run build`, `pnpm run typecheck`, and `pnpm run check:publish-dry-run`.
5. Avoid exposing internal helper files unless they are stable enough to support across releases.

The `files` array and the `exports` map should tell the same story: published files make an entry available in the tarball, while `exports` decides which of those files are public import paths.
