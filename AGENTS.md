# AI Working Guide

This file is the canonical guide for AI agents working in this repository. Keep it short, update it
when workflow changes, and link here from tool-specific instruction files instead of repeating the
same rules elsewhere.

## Project Shape

Lumen is a multi-framework primitive UI system. The Astro package is the primary implementation, and
the other packages adapt or expose shared pieces.

- `packages/core` holds shared tokens, component metadata, class helpers, and common behavior types.
- `packages/astro` holds the most complete component catalog, standalone CSS, and progressive
  enhancement runtime.
- `packages/react` holds React primitives.
- `packages/elements` holds standards-based Web Components.
- `packages/lumen` is the umbrella package and public package map.
- `apps/docs` is the Astro documentation and demo site.

Use [README.md](README.md) for the public overview, [docs/ai-usage.md](docs/ai-usage.md) for
AI-facing consumption examples, and [docs/brand-guidelines.md](docs/brand-guidelines.md) for voice
and visual guidance.

## Working Rules

- Prefer the existing package boundaries. Shared contracts belong in `packages/core`; framework
  details belong in the matching framework package.
- Treat Astro as the reference surface unless the task explicitly targets another framework.
- Keep public APIs small and stable. Add exports intentionally and update the package README when
  the usage story changes.
- Preserve user work. Check `git status --short` before editing and do not overwrite unrelated
  local changes.
- Add a changeset for user-visible package changes. Documentation-only and internal maintenance
  work usually does not need one.
- Keep generated or built output out of commits unless the repo already tracks it.

## Commands

Use `pnpm` from the repo root.

```bash
pnpm install
pnpm run dev
pnpm run build
pnpm run typecheck
pnpm run test
pnpm run lint
pnpm run validate
```

For narrow checks, prefer the smallest command that covers the edited surface. Run `pnpm run validate`
before release-oriented work or broad cross-package changes.

## Implementation Notes

- Components should use the existing token names: `canvas`, `surface`, `surface-muted`,
  `surface-strong`, `line`, `ink`, `ink-soft`, `ink-muted`, `brand`, `brand-solid`, `brand-soft`,
  `accent`, `success`, `warning`, and `danger`.
- Standalone component CSS lives in `packages/astro/styles/lumen.css`. The docs app can layer its
  own theme tokens in `apps/docs/src/styles/global.css`.
- Interactive Astro primitives should keep working without requiring Tailwind configuration from
  consumers.
- Use accessible names, keyboard paths, focus states, and semantic markup for every primitive.
- Tests live beside package code as `*.test.ts`. Add or update tests when behavior, exported
  metadata, or component contracts change.

## Documentation Rules

- The root README explains what Lumen is and how to start.
- Package READMEs explain package-specific install and usage details.
- AI usage examples for downstream app generation live in [docs/ai-usage.md](docs/ai-usage.md).
- Brand guidance lives only in [docs/brand-guidelines.md](docs/brand-guidelines.md).
- Contributor workflow lives in [CONTRIBUTING.md](CONTRIBUTING.md).
- Tool-specific AI files should be tiny pointers back to this file.
