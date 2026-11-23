# Lumen 2 consumer import audit

This audit records the evidence used to decide whether Lumen 2 should remove the framework-neutral
`@santi020k/lumen-core` re-exports from the `@santi020k/lumen` umbrella package.

## Decision

Retain the existing umbrella re-exports in Lumen 2.

The removal has no observed consumer, accessibility, performance, or maintenance problem to solve.
Changing the root entry would therefore create a migration burden only to make the coordinated
major release appear more disruptive. Consumers should still prefer `@santi020k/lumen-core` when
they need framework-neutral utilities directly, but the umbrella compatibility surface remains
supported.

## Evidence

- `registry/web-api-baseline.json` classifies and protects 202 public umbrella symbols, including
  the re-exported Core contracts.
- `scripts/smoke-consumer-packages.mjs` proves the packed umbrella and Core packages can be installed
  together. Its production-shaped fixture imports umbrella metadata from `@santi020k/lumen` and
  framework-neutral catalog and icon utilities from `@santi020k/lumen-core`.
- A source scan of `/Users/santi020k/Projects/santi020k` on 2026-08-26 found no application import of
  a Core symbol through `@santi020k/lumen`. The only root imports were the Lumen package's own clean
  consumer fixture and its preserved release checkout copy, both importing the umbrella-owned
  `lumen` metadata object.
- `pnpm run check:web-api-baseline`, `pnpm run test:web-api-baseline`, and
  `pnpm run check:consumer-packages` pass with the retained contract.

This is source-usage evidence, not proof that no external npm consumer exists. That uncertainty is
another reason to preserve the compatible API when there is no measured benefit from removal.

## Future changes

A later major may reconsider the boundary only after recording a concrete problem, measuring the
replacement, publishing a deprecation path, and validating affected consumers. The Lumen 2
migrator intentionally does not rewrite these imports.
