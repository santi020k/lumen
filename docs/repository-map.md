# Repository Map

Use this map to find the source of truth before changing code or docs.

## Packages

| Path | Purpose |
| --- | --- |
| `packages/core` | Shared tokens, package metadata, component names, and helpers. |
| `packages/astro` | Primary component implementation, styles, and Astro runtime. |
| `packages/react` | React primitives. |
| `packages/elements` | Web Components primitives. |
| `packages/lumen` | Umbrella package and package map. |
| `apps/docs` | Documentation site, examples, themes, and demos. |

## Common Change Paths

| Task | Start Here | Also Check |
| --- | --- | --- |
| Add or rename a component | `packages/core/src/components.ts` | `packages/astro/components`, `apps/docs/src/examples` |
| Change shared tokens | `packages/core/src/tokens.ts` | `packages/astro/styles/lumen.css`, `apps/docs/src/styles/global.css` |
| Update Astro behavior | `packages/astro` | `packages/astro/index.test.ts`, docs examples |
| Improve AI consumption guidance | `docs/ai-usage.md` | package READMEs, `AGENTS.md` |
| Update docs navigation | `apps/docs/src/lib/routes.ts` | `apps/docs/src/data/docs.ts` |
| Change CI or release selection | `scripts/classify-workflow-paths.mjs`, `.github/workflows` | `scripts/workflow-scope.test.mjs` |
| Change npm publication behavior | `scripts/release-scope.mjs`, `.changeset` | `scripts/publish-packages.mjs`, `scripts/check-publish-dry-run.mjs` |

## Docs Sources

- Public overview: [README.md](../README.md)
- Contributor loop: [CONTRIBUTING.md](../CONTRIBUTING.md)
- AI agent guide: [AGENTS.md](../AGENTS.md)
- AI usage examples: [docs/ai-usage.md](ai-usage.md)
- Brand guidance: [docs/brand-guidelines.md](brand-guidelines.md)
