<p align="center">
  <a href="https://lumen.santi020k.com">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="../../docs/assets/readme/package-dark.svg">
      <img src="../../docs/assets/readme/package-light.svg" alt="Lumen UI — Web. Native. Thoughtfully connected." width="1200" height="184">
    </picture>
  </a>
</p>

<h1 align="center">Lumen Template Showcase</h1>

<p align="center">Responsive product examples · Astro preview app</p>

<p align="center"><a href="https://lumen.santi020k.com/templates">Live gallery</a> · <a href="../../packages/templates/README.md">Template package</a> · <a href="../../packages/lumen/README.md">CLI guide</a></p>

**On this page:** [Run locally](#run-locally) · [Source and ownership](#source-and-ownership) · [Validate](#validate) · [Use a template in your app](#use-a-template-in-your-app) · [Resources](#resources)

A private workspace app for browsing the shared Lumen template gallery in isolation. The same
catalog powers the public documentation site. Preview data is illustrative; authentication and
other service actions require application-owned integrations.

## Run locally

From the repository root, after installing the pinned workspace dependencies:

```bash
pnpm exec turbo run build --filter=@santi020k/lumen-template-showcase^...
pnpm --filter @santi020k/lumen-template-showcase run dev
```

The app starts on port **4322**. Open `/` for the gallery or `/<slug>` for one family, such as
`/analytics-dashboard`, `/saas-admin`, `/commerce-dashboard`, `/project-workspace`, or `/auth-onboarding`.
Use the port printed by Astro if the preferred port is occupied.

## Source and ownership

| Source | What to change |
| --- | --- |
| `src/pages/index.astro` | Gallery route |
| `src/pages/[slug].astro` | Generated template detail routes |
| `src/layouts/ShowcaseLayout.astro` | Shared styles, theme, and one Astro runtime mount |
| [`packages/templates`](../../packages/templates/README.md) | Catalog, gallery, and preview renderer |
| [`packages/lumen/templates`](../../packages/lumen/templates) | Installable consumer recipes |

Keep shared template changes in the package rather than duplicating them in this app. Update
previews and CLI recipes together. The auth preview keeps controls disabled until a consumer
connects a real authentication service; it never creates a session.

## Validate

```bash
pnpm --filter @santi020k/lumen-template-showcase run typecheck
pnpm --filter @santi020k/lumen-template-showcase run test
pnpm --filter @santi020k/lumen-template-showcase run lint
pnpm exec turbo run build --filter=@santi020k/lumen-template-showcase
```

Inspect changed families at phone and desktop widths in both themes. Build output lives in
`apps/templates/dist` and is not committed.

## Use a template in your app

Install your public Lumen adapter and use its CLI, rather than depending on this private app:

```bash
pnpm add @santi020k/lumen-react
pnpm exec lumen add analytics-dashboard --target react
```

Follow the [template package guide](../../packages/templates/README.md) for available targets,
stylesheet/runtime setup, and application-owned behavior.

## Resources

- [Repository overview](../../README.md) — framework packages, demos, and the project map.
- [Contributing](../../CONTRIBUTING.md) — workspace setup, validation, and release workflow.
- [Feedback and support](https://lumen.santi020k.com/support) — questions, ideas, and bug reports.

Part of [Lumen UI](https://lumen.santi020k.com), created by [Santiago Molina](https://santi020k.com).
Licensed under [MIT](../../LICENSE); third-party artwork retains its own notices.
