# Lumen 4 improvement work

This implementation tracks the five improvements approved after the October 4 source review.
The task branch starts from `release/v4.0.0`; unrelated work remains in its original checkouts.

## Scope and completion evidence

| Improvement | Required result | Evidence before completion |
| --- | --- | --- |
| Native coverage | Reuse already-integrated Rating, Stepper and Timeline APIs; expose controlled recipes for all three adapters and verify current contracts | Verify public examples and current native contracts; run affected parity tests; keep existing compiler/rendered evidence separate from fresh checks |
| AI workflow | Focused discovery and contract retrieval; expanded efficiency evaluation for larger screens and another adapter | Search/contract regressions; benchmark harness and independent verifier tests; preserve old reports; report only newly measured results |
| Migration | Concrete before/after spacing, Card overflow, controlled-form, chart and native initializer examples | Verify snippets against current public contracts and rendered migration page |
| Runtime | Selector-gated extraction of independent Astro behavior with unchanged UIPrimitives setup | Behavioral and browser regressions; build output/request and size evidence |
| Release documentation | Current instructions agree with current policy; historical evidence remains intact | Inspect roadmap, readiness and linked release guidance; lint and documentation build |

## Verification record

The release baseline already contains the native Rating, Stepper and Timeline implementations and
nine controlled playground examples. This task links those public recipes rather than adding a
second API. The focused React Native parity suites passed 11 tests; canonical validation covers
native source contracts. No new physical-device evidence is claimed.

The expanded independent efficiency verifier passed the original React case, combined search/role
filtering and actual Elements-in-React controls, including negative substitution cases. The schema
2 matrix contains 36 runs across four cases; authenticated agent measurements were not run. Existing
published reports are preserved and no new token-savings claim is made.

Nine rendered media interaction checks passed. Built-page request inspection confirmed Button loads
neither media controller, ImageComparison loads only its controller, and FileUpload loads only its
controller. Their emitted chunks were 910/525 and 1096/536 bytes raw/gzip respectively on this build.
The migration guide passed rendered checks at 390 and 1280 pixels and its mobile and desktop screenshots were
inspected. Elements keyboard and React property regressions are included in the full unit suite.

Package notes were generated with Changesets and folded into the existing unpublished 4.0.0 entries.
Public versions and published changelog history were preserved.

Canonical `pnpm run validate` passed: 2077 unit tests in 206 files, builds, strict type checks,
zero-warning lint, spelling, Knip, security, publish-content checks and packed consumer smoke tests.

## Integration

Run focused checks followed by canonical `pnpm run validate`. Commit task-owned files, then merge
into a clean, idle `release/v4.0.0` checkout and verify ancestry and the merged result. The release
checkout is owned by another active release task; do not alter it while that work is active.
Remote pushes, PRs, publication and deployment are separate from this local implementation.
