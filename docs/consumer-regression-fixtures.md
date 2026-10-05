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

## Consumer workflow fixtures

`/docs/web/consumer-workflows` exercises synthetic financial-shaped forms, Spanish labels, exact
amount drafts, server error retention, responsive records, manual sorting, expanded details,
top-layer menus, menu-to-dialog focus and an activity feed. It uses the same installable React
recipe sources that consumers receive. It contains no financial calculations or real records.

Run `pnpm exec playwright test --config playwright.a11y.config.ts consumer-workflows.spec.ts` for
desktop and narrow layouts, keyboard focus, native FormData, errors and empty states. Unit suites
cover amount precision, locale parsing, controlled drafts, React Hook Form reset and scroll-anchor
behavior. These fixtures supplement the existing reporting route's synthetic Observatory-shaped
chart coverage. Native settings fixtures live beside the Swift adapter tests and are compilation
evidence only; hardware, assistive-technology and store qualification remain separate.
