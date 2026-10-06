<p align="center">
  <a href="https://lumen.santi020k.com">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/santi020k/lumen/main/docs/assets/readme/package-dark.svg">
      <img src="https://raw.githubusercontent.com/santi020k/lumen/main/docs/assets/readme/package-light.svg" alt="Lumen UI — Web. Native. Thoughtfully connected." width="1200" height="184">
    </picture>
  </a>
</p>

<h1 align="center">Lumen UI · Brand Icons</h1>

<p align="center">Namespaced brand artwork · Shared Icon adapters</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@santi020k/lumen-icons-brand"><img src="https://img.shields.io/npm/v/@santi020k/lumen-icons-brand?style=flat-square&color=0369a0" alt="npm version"></a>
  <a href="https://github.com/santi020k/lumen/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-13967e?style=flat-square" alt="MIT license"></a>
</p>

<p align="center">
  <a href="https://lumen.santi020k.com/docs/brand-icons">Documentation</a>
  ·
  <a href="https://www.npmjs.com/package/@santi020k/lumen-icons-brand">npm</a>
  ·
  <a href="https://github.com/santi020k/lumen/tree/main/packages/icons-brand">Source</a>
  ·
  <a href="https://github.com/santi020k/lumen/issues">Issues</a>
</p>

**Package:** `@santi020k/lumen-icons-brand`

**On this page:** [Install](#install) · [Usage](#usage) · [Resources](#resources)

Optional brand icons for Lumen UI. The pack keeps company marks separate from Lumen's default
Lucide catalog and renders them through the same `Icon` component in Astro, React, and Web
Components.

## Install

```bash
pnpm add @santi020k/lumen-icons-brand
```

## Usage

Register the pack once before rendering brand icons:

```ts
import { registerLumenBrandIcons } from '@santi020k/lumen-icons-brand'

registerLumenBrandIcons()
```

Then use namespaced names with the framework adapter already installed by the application:

```astro
---
import { Icon } from '@santi020k/lumen-astro'
---

<Icon name="brand:github" label="GitHub" />
<Icon name="brand:linkedin" decorative />
```

The package includes the complete Font Awesome Free brand catalog: more than 570 marks such as
`apple`, `discord`, `figma`, `github`, `linkedin`, `medium`, `whatsapp`, `x-twitter`, and
`youtube`. `brand:x` is also available as a convenient alias for `brand:x-twitter`.

Brand icons inherit `currentColor`, Lumen sizing, alignment, and the existing accessibility
contract. Their recognizable filled paths are preserved rather than redrawn in Lucide's outline
style. This means brand and interface icons share the same visual system without altering protected
brand geometry.

Use the exported `lumenBrandIconNames` array to build a picker or inspect every available
namespaced name programmatically.

Brand paths come from
[Font Awesome Free](https://github.com/FortAwesome/Font-Awesome), whose icons are licensed under
CC BY 4.0. Read each brand's usage guidelines before publishing brand marks.

## Resources

| Guide | What you will find |
| --- | --- |
| [Icon licenses and trademark guidance](https://github.com/santi020k/lumen/blob/main/icons/THIRD_PARTY_NOTICES.md) | Artwork attribution, licenses, and brand usage boundaries. |
| [Import and icon performance](https://github.com/santi020k/lumen/blob/main/docs/import-and-icon-performance.md) | Selective imports and reproducible bundle measurements. |
| [Contributing](https://github.com/santi020k/lumen/blob/main/CONTRIBUTING.md) | Setup, checks, and contribution workflow. |
| [Release history](https://github.com/santi020k/lumen/releases) | Published releases and version notes. |

Part of [Lumen UI](https://lumen.santi020k.com), created by [Santiago Molina](https://santi020k.com).
Licensed under [MIT](https://github.com/santi020k/lumen/blob/main/LICENSE); third-party artwork retains its own notices.
