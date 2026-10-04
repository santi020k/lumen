<p align="center">
  <a href="https://lumen.santi020k.com">
    <img src="https://raw.githubusercontent.com/santi020k/lumen/main/apps/docs/public/logo.svg" alt="Lumen UI" width="233" height="60">
  </a>
</p>

<h1 align="center">Lumen UI · Product Templates</h1>

<p align="center">Live previews · Five product families · Three framework targets</p>

<p align="center">
  <a href="https://github.com/santi020k/lumen/tree/main/packages/templates"><img src="https://img.shields.io/badge/workspace-private-0369a0?style=flat-square" alt="Private workspace package"></a>
  <a href="https://github.com/santi020k/lumen/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-13967e?style=flat-square" alt="MIT license"></a>
</p>

<p align="center">
  <a href="https://lumen.santi020k.com/templates">Template gallery</a>
  ·
  <a href="https://github.com/santi020k/lumen/tree/main/packages/templates">Source</a>
  ·
  <a href="https://github.com/santi020k/lumen/issues">Issues</a>
</p>

**Package:** `@santi020k/lumen-templates`

**On this page:** [Use templates in an application](#use-templates-in-an-application) · [Workspace API](#workspace-api) · [Development](#development) · [Resources](#resources)

---

Private workspace package for Lumen's product template metadata, Astro gallery, and preview
renderer. It powers the documentation and template showcase; it is not published to npm.

## Use templates in an application

Install the public Lumen adapter for your framework, then copy a recipe through its bundled CLI:

```bash
pnpm add @santi020k/lumen-astro
pnpm exec lumen add analytics-dashboard --target astro
```

React and Web Components consumers use `@santi020k/lumen-react` with `--target react` or
`@santi020k/lumen-elements` with `--target elements`. Follow the adapter's README for stylesheet
and runtime setup, then adapt the generated files to the application's data and workflows.

Available families are analytics dashboard, SaaS admin, commerce dashboard, project workspace,
and authentication/onboarding. Preview them in the gallery before choosing a recipe.

Dashboard metric cards own their frame and spacing. Their public `Stat` uses the bare
variant, and change badges wrap below the value when a narrow card needs more room.

## Workspace API

Within this repository, declare the dependency with `workspace:*`. The root entry exports the
catalog, slug and framework types, lookup helpers, and install-command generation:

```ts
import {
  getLumenTemplate,
  getTemplateInstallCommand
} from '@santi020k/lumen-templates'

const template = getLumenTemplate('analytics-dashboard')
const command = getTemplateInstallCommand('analytics-dashboard', 'react')
```

`getLumenTemplate` returns `undefined` for an unknown slug. Use `isTemplateSlug` to validate
untrusted route input before passing it to APIs that require `TemplateSlug`.

Astro surfaces can import the gallery or render one known template:

```astro
---
import TemplateRenderer from '@santi020k/lumen-templates/TemplateRenderer.astro'
import '@santi020k/lumen-templates/styles.css'
import '@santi020k/lumen-astro/styles.css'
import UIPrimitives from '@santi020k/lumen-astro/runtime'
---

<TemplateRenderer slug="analytics-dashboard" />
<UIPrimitives />
```

Mount the Astro runtime once in the root layout when composing multiple previews. The gallery
entry is `@santi020k/lumen-templates/TemplateGallery.astro`. Preview data demonstrates presentation;
applications own authentication, authorization, persistence, and real service integrations.

## Development

Run from the repository root with the declared pnpm version:

```bash
pnpm --filter @santi020k/lumen-templates run typecheck
pnpm --filter @santi020k/lumen-templates run test
pnpm --filter @santi020k/lumen-templates run lint
```

Reuse public Lumen components and semantic tokens in every template. Keep catalog metadata,
preview routes, and CLI recipes aligned when changing a family.

## Resources

| Guide | What you will find |
| --- | --- |
| [Astro setup](https://github.com/santi020k/lumen/blob/main/packages/astro/README.md) | Reference for astro setup. |
| [CLI and recipe installation](https://github.com/santi020k/lumen/blob/main/packages/lumen/README.md) | Reference for cLI and recipe installation. |
| [Contributing](https://github.com/santi020k/lumen/blob/main/CONTRIBUTING.md) | Setup, checks, and contribution workflow. |

Part of [Lumen UI](https://lumen.santi020k.com), created by [Santiago Molina](https://santi020k.com).
Licensed under [MIT](https://github.com/santi020k/lumen/blob/main/LICENSE).
