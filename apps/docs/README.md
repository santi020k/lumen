<p align="center">
  <a href="https://lumen.santi020k.com">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="../../docs/assets/readme/package-dark.svg">
      <img src="../../docs/assets/readme/package-light.svg" alt="Lumen UI — Web. Native. Thoughtfully connected." width="1200" height="184">
    </picture>
  </a>
</p>

<h1 align="center">Lumen Documentation</h1>

<p align="center">Live examples · Framework guides · Native previews</p>

<p align="center"><a href="https://lumen.santi020k.com">Documentation</a> · <a href="https://lumen.santi020k.com/docs/components">Components</a> · <a href="../../CONTRIBUTING.md">Contributing</a></p>

**On this page:** [Run locally](#run-locally) · [Find the right source](#find-the-right-source) · [Validate and build](#validate-and-build) · [Preview assets and deployment](#preview-assets-and-deployment) · [Resources](#resources)

The public documentation and demonstration site for Lumen UI, built with Astro and the local
workspace packages. This is the reference app for component behavior, theming, and accessibility.

## Run locally

Use Node.js 22.22.2+, 24.15.0+, or 26+ and the pnpm version pinned in the root manifest.
From the repository root:

```bash
pnpm install --frozen-lockfile
pnpm exec turbo run build --filter=@santi020k/lumen-docs^...
pnpm run dev
```

Open the URL printed by Astro. The development script builds the Expo web gallery and prepares
its embedded preview before starting the site. Native screenshot previews are committed, so
ordinary docs development does not require Xcode or Android Studio.

## Find the right source

| Location | Responsibility |
| --- | --- |
| `src/pages/docs` | Platform setup, component reference, and playground routes |
| `src/pages/guides` | Task-oriented tutorials |
| `src/examples` | Live component examples and copyable snippets |
| `src/data` | Navigation, guide, component, and search metadata |
| `src/components` and `src/layouts` | Documentation shell and shared page composition |
| `src/styles/global.css` | Documentation theme layered over Lumen tokens |
| `public/native-components` | Optimized native component captures |
| `native-previews` | Small native hosts used to produce reference images |
| `scripts` | Capture synchronization, social images, and deployment packaging |

Use the public Lumen primitive whenever an equivalent exists. Keep a working preview next to its
copyable example. Update navigation and search metadata with new routes; follow the
[documentation contribution guide](../../CONTRIBUTING.md#documentation-and-guides).

## Validate and build

Run these commands from the repository root:

```bash
pnpm --filter @santi020k/lumen-docs run typecheck
pnpm --filter @santi020k/lumen-docs run test
pnpm --filter @santi020k/lumen-docs run lint
pnpm run docs:build
pnpm --filter @santi020k/lumen-docs run check:og
pnpm --filter @santi020k/lumen-docs run audit:seo
pnpm run docs:preview
```

The root `docs:build` includes workspace dependencies. A direct docs-only build requires those
packages and the Expo web export to have been built first. The post-build step audits metadata
and navigation, then prepares `cloudflare/dist` for Cloudflare Pages.

For visual changes, run `pnpm run test:visual` and the affected interaction/accessibility suites.
Check mobile and desktop, light and dark themes, keyboard navigation, and reduced motion.
Use `pnpm run check:docs-performance` for the documented Lighthouse budgets.

## Preview assets and deployment

- [Platform images](src/assets/platforms/README.md) document each screenshot's source.
- [Native preview hosts](native-previews/README.md) separate real platform rendering from browser demos.
- [Launch media](public/launch/README.md) explains reproducible campaign assets.

Keep `.astro`, `dist`, `cloudflare/dist`, and temporary captures out of commits. Deployment follows
the [repository release workflow](../../CONTRIBUTING.md#publishing); a successful local build is
not a deployment.

## Resources

- [Repository overview](../../README.md) — framework packages, demos, and the project map.
- [Contributing](../../CONTRIBUTING.md) — workspace setup, validation, and release workflow.
- [Feedback and support](https://lumen.santi020k.com/support) — questions, ideas, and bug reports.

Part of [Lumen UI](https://lumen.santi020k.com), created by [Santiago Molina](https://santi020k.com).
Licensed under [MIT](../../LICENSE); third-party artwork retains its own notices.
