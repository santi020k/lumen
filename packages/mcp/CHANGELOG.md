# @santi020k/lumen-mcp

## 0.3.0

### Minor Changes

- [#7](https://github.com/santi020k/lumen/pull/7) [`325ad43`](https://github.com/santi020k/lumen/commit/325ad438380de27f4cba8eda6878a2aad7a2b33f) Thanks [@santi020k](https://github.com/santi020k)! - Add `CodeTabs` to the shared catalog with accessible, synchronized, copyable code examples across
  Astro, React, custom elements, and MCP discovery.

## 0.2.0

### Minor Changes

- [`6129409`](https://github.com/santi020k/lumen/commit/61294095ee60bbafa0f8815b57ac815d52224c8e) Thanks [@santi020k](https://github.com/santi020k)! - Make MCP discovery framework-aware and release-verifiable. Component usage now includes authored
  React hook/controller examples, Astro runtime setup, custom-element registration, richer Elements
  examples, and corrected runtime event contracts. Natural-language search supports partial
  multi-component product queries, aliases, framework filtering, and normalized recipe names.

  Add `lumen_get_meta` and `lumen://meta` with deterministic catalog and package provenance, support
  Node.js 20.20+, keep the MCP versioned with framework releases, reject stale generated snapshots in
  CI, and smoke-test the packed package through a real external stdio connection.

  Add a catalog manifest and diff workflow, deterministic connection diagnostics, a self-hostable
  Streamable HTTP entrypoint, and release evaluations that benchmark natural-language search, exercise
  every framework contract over MCP, parse Astro and Elements examples, and type-check every generated
  React example against the package.

### Patch Changes

- [`81bf725`](https://github.com/santi020k/lumen/commit/81bf7256a1091b0e05cdbf919b5b42691ab861d8) Thanks [@santi020k](https://github.com/santi020k)! - Add wrapped block-code output across framework adapters, refine native accordion disclosure styling,
  and teach the registry and MCP catalog that Astro motion primitives require styles and
  `UIPrimitives`.

- [`485ef4b`](https://github.com/santi020k/lumen/commit/485ef4bc2d56969ba7292ff009c31877cbc3c627) Thanks [@santi020k](https://github.com/santi020k)! - Add a flush Accordion variant for compact FAQ and content-led disclosure lists.

- [`d7a8a84`](https://github.com/santi020k/lumen/commit/d7a8a8408c03c0c3005e7f0f515e815b59c51c17) Thanks [@santi020k](https://github.com/santi020k)! - Stabilize the existing catalog without adding components: complete the typed API reference, add
  cross-framework class and behavior contract checks, enforce coverage and bundle-size budgets, load
  motion controllers only when matching Astro primitives are present, and adopt
  `ui:data-table-selection-change` while keeping the previous DataTable event as a compatibility
  alias until Lumen 1.0.

## 0.1.0

### Minor Changes

- [`a32b14d`](https://github.com/santi020k/lumen/commit/a32b14ddaac5cd8fcc939ae26008c84479e1ad0f) - Add `@santi020k/lumen-mcp`, a Model Context Protocol server that lets AI agents list components,
  read framework-aware usage and source, inspect recipes, search the catalog with ranked
  natural-language matches, and fetch Lumen tokens and agent rules over stdio. Ship validated
  structured tool outputs, browsable `lumen://` resources, a self-building local launcher, and a
  reproducible metadata snapshot generated from the registry, framework source, and documentation.

- [`4760e13`](https://github.com/santi020k/lumen/commit/4760e13631d7c5f84540eaf5013c22325481a2b7) - Preserve framework-native image optimization, lazy-load native images by default, and add opt-in
  dark-theme inversion for monochrome artwork.

### Patch Changes

- [`0b0c038`](https://github.com/santi020k/lumen/commit/0b0c03827675cbe9763a15e1e885a4648ea273e8) - Improve SpeedDial with rendered action icons, polished directional motion, an initial-open option,
  and complete click, dismissal, and keyboard menu behavior.
