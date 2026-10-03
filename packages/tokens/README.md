<p align="center">
  <a href="https://lumen.santi020k.com">
    <img src="https://raw.githubusercontent.com/santi020k/lumen/main/apps/docs/public/logo.svg" alt="Lumen UI" width="233" height="60">
  </a>
</p>

<h1 align="center">Lumen UI · Design Tokens</h1>

<p align="center">Semantic colors · Shared foundations · Platform-neutral JSON</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@santi020k/lumen-tokens"><img src="https://img.shields.io/npm/v/@santi020k/lumen-tokens?style=flat-square&color=0369a0" alt="npm version"></a>
  <a href="https://github.com/santi020k/lumen/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-13967e?style=flat-square" alt="MIT license"></a>
</p>

<p align="center">
  <a href="https://lumen.santi020k.com/docs/foundations">Documentation</a>
  ·
  <a href="https://www.npmjs.com/package/@santi020k/lumen-tokens">npm</a>
  ·
  <a href="https://github.com/santi020k/lumen/tree/main/packages/tokens">Source</a>
  ·
  <a href="https://github.com/santi020k/lumen/issues">Issues</a>
</p>

**Package:** `@santi020k/lumen-tokens`

**On this page:** [Install](#install) · [Read the token document](#read-the-token-document) · [Resources](#resources)

---

The canonical, platform-neutral foundations for Lumen UI. `lumen.tokens.json` uses Design Tokens
Community Group token types and carries the semantic light and dark colors, spacing, radii,
typography, motion, and elevation shared by every adapter.

## Install

```bash
pnpm add @santi020k/lumen-tokens
```

## Read the token document

Use a runtime or bundler that supports JSON import attributes:

```js
import tokens from '@santi020k/lumen-tokens' with { type: 'json' }

tokens.color.light.brand.$value
```

The root export and `@santi020k/lumen-tokens/lumen.tokens.json` both resolve to the same JSON
document. Read each token through `$value`; semantic names with hyphens require bracket notation:

```js
tokens.color.dark['on-brand'].$value
```

The package contains data only. It does not load CSS, apply a theme, or register components.

Platform packages expose native generated values, so most application code should consume
`@santi020k/lumen-react-native`, `LumenUI`, or the Compose module instead of parsing this file.

## Resources

| Guide | What you will find |
| --- | --- |
| [Cross-platform architecture](https://github.com/santi020k/lumen/blob/main/docs/cross-platform.md) | Reference for cross-platform architecture. |
| [Figma token export](https://github.com/santi020k/lumen/blob/main/docs/figma.md) | Reference for figma token export. |
| [Contributing](https://github.com/santi020k/lumen/blob/main/CONTRIBUTING.md) | Setup, checks, and contribution workflow. |
| [Release history](https://github.com/santi020k/lumen/releases) | Published releases and version notes. |

Part of [Lumen UI](https://lumen.santi020k.com), created by [Santiago Molina](https://santi020k.com).
Licensed under [MIT](https://github.com/santi020k/lumen/blob/main/LICENSE); third-party artwork retains its own notices.
