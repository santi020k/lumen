<p align="center">
  <a href="https://lumen.santi020k.com">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="../../docs/assets/readme/package-dark.svg">
      <img src="../../docs/assets/readme/package-light.svg" alt="Lumen UI — Web. Native. Thoughtfully connected." width="1200" height="184">
    </picture>
  </a>
</p>

<h1 align="center">Lumen Next.js Smoke App</h1>

<p align="center">React Server Components · Client boundaries · Consumer fixtures</p>

<p align="center"><a href="../../packages/react/README.md">React package</a> · <a href="../../playwright.conformance.config.ts">Conformance suite</a> · <a href="../../playwright.frameworks.config.ts">Visual suite</a></p>

**On this page:** [Build and run](#build-and-run) · [Fixture map](#fixture-map) · [Validate](#validate) · [Resources](#resources)

A private Next.js consumer used to verify Lumen's React integration and rendered regression
fixtures. It exercises server-safe exports, interactive client components, Web Components, and
application wrappers. It is a test host, not a deployable product template.

## Build and run

From the repository root, after installing the pinned workspace dependencies:

```bash
pnpm exec turbo run build --filter=@santi020k/lumen-next-smoke
pnpm --filter @santi020k/lumen-next-smoke exec next start --hostname 127.0.0.1 --port 4330
```

Open `http://127.0.0.1:4330/`. For development after building workspace dependencies, use
`pnpm --filter @santi020k/lumen-next-smoke exec next dev --hostname 127.0.0.1 --port 4330`.
Use a free port when another task owns that port.

## Fixture map

| Route or source | What it verifies |
| --- | --- |
| `/` | A server page composing server-safe primitives and a client panel |
| `/consumer-recipes` | Editable record tables and whole-unit amount fields |
| `/dashboard-recipes` | Dashboard composition in a consumer application |
| `/visual/react` and `/visual/elements` | Cross-adapter rendered component fixtures |
| `/visual/forms`, `/visual/control-sizes`, `/visual/mentions` | Focused form and interaction regressions |
| `app/lumen-wrappers.tsx` | Product wrappers crossing the server/client boundary |

Import server-safe components from `@santi020k/lumen-react/server` and interactive primitives from
the public client entries. The fixture layout intentionally imports both adapter stylesheets
because it hosts both React and Elements comparisons; ordinary apps follow their chosen adapter's
[installation guide](../../packages/react/README.md).

## Validate

```bash
pnpm --filter @santi020k/lumen-next-smoke run typecheck
pnpm --filter @santi020k/lumen-next-smoke run test
pnpm --filter @santi020k/lumen-next-smoke run lint
pnpm run test:framework-conformance
pnpm run test:framework-visual
```

Run type checking after the build so Next.js tasks do not overwrite the same generated route
types concurrently. Browser suites manage their configured test servers. Follow their root
Playwright configuration when choosing ports and prerequisites. Keep `.next` and test output out
of commits; do not turn fixture-only routes into public application contracts.

## Resources

- [Repository overview](../../README.md) — framework packages, demos, and the project map.
- [Contributing](../../CONTRIBUTING.md) — workspace setup, validation, and release workflow.
- [Feedback and support](https://lumen.santi020k.com/support) — questions, ideas, and bug reports.

Part of [Lumen UI](https://lumen.santi020k.com), created by [Santiago Molina](https://santi020k.com).
Licensed under [MIT](../../LICENSE); third-party artwork retains its own notices.
