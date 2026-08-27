# Consumer regression fixtures

The local applications deliberately cover the four architectures found in sibling consumers:

| Consumer shape | Local fixture | Verification |
| --- | --- | --- |
| Astro documentation with Tailwind and host typography | `apps/docs` | docs typecheck/build plus visual cascade tests |
| Astro static marketing without Tailwind | `apps/templates` marketing-oriented templates | template typecheck/build and static HTML output |
| Astro dashboard with charts, tables, forms, and runtime behavior | `apps/templates` dashboard templates plus the deep-import benchmark fixture | template build, interaction/visual tests, and `pnpm run measure:imports` |
| React wrappers consumed by Next.js | `apps/next-smoke` | Next typecheck/build; wrappers are imported from server and client boundaries |
| Packed React package consumed by Next.js | `scripts/smoke-consumer-packages.mjs` | Installs the package tarball in a clean temporary app and builds direct Server Component imports plus interactive Client Component usage |

The generated benchmark fixtures are created under their owning app, use only workspace packages,
and are deleted after each run. CI never clones sibling repositories.

Run the narrow fixture checks with:

```bash
pnpm --filter @santi020k/lumen-docs run typecheck
pnpm --filter @santi020k/lumen-templates run typecheck
pnpm --filter @santi020k/lumen-next-smoke run typecheck
pnpm --filter @santi020k/lumen-next-smoke run build
pnpm run check:consumer-packages
pnpm run measure:imports
pnpm run measure:react-icons
```

The browser suites remain the source of truth for computed Tailwind cascade, chart/table/form
semantics, runtime interactions, and static rendering.
