# Findings from Lumen 4.2 consumer upgrades

Reviewed on October 13, 2026. This document records findings for the next Lumen release,
based on upgrading sibling projects under `/Users/santi020k/Projects/santi020k`.
It supplements the existing [native backlog](improvement.md) and
[4.2 scope audit](docs/lumen-4.2-improvement-audit.md).

## Release contract

Lumen 4.2 is independently versioned. The published umbrella, Elements, and MCP are 4.2.0;
Astro, React, and Core are 4.1.0; React Native and React Hook Form are 4.0.1;
tokens, brand icons, and Compose remain 4.0.0. Swift uses tag `v4.2.0`, resolving to
`eb00a5e5b29283fe2ce155ae58a28911166fab27`.
Use the [release manifest](registry/release-manifest.json), rather than assigning 4.2.0
to every package. The registry has no Astro, React, or React Native 4.2.0 package.

## Priorities for the next release

### P1: Make consumer adoption aware of independently versioned releases

`lumen migrate v4 --dry-run --cwd <consumer>` reports a dependency target of 4.0.0.
During the KinJar upgrade it flagged Astro 4.1.0 and React Native 4.0.1 as excluding that
target, even though those are the correct adapters for the 4.2 release family.
The historical migration target is documented, but this is confusing during current adoption.

The dependency target is fixed in
[version-migration.ts](packages/lumen/src/version-migration.ts), and dependency mutation delegates
to [consumer rollout](packages/lumen/src/version-migration-dependencies.ts). The existing
[rollout updater](packages/lumen/src/consumer-rollout.ts) also applies one target version across
package declarations; it needs the release map before it can safely select the 4.2 family.
A real `lumen rollout 4.2.0 <KinJar checkout> --dry-run` reproduced the problem: it marked
correct Astro/Core 4.1.0 and React Native 4.0.1 resolutions as needing 4.2.0.

Recommended change: keep historical source migrations explicit and extend the existing
`lumen rollout` path to read the release manifest. Show each package's required version and distinguish
manifest compatibility, actual lockfile resolution, and runtime compatibility.

Acceptance criteria:

- A correct 4.2 family produces no obsolete 4.0.0 mismatch findings.
- Applying an adoption command cannot silently downgrade newer compatible packages.
- Catalog references and direct dependency ranges use the same release map.
- Native artifact versions stay independent; Swift and Compose pins are reported separately.
- Regression fixtures include the observed Astro/React/Core 4.1.0 and React Native 4.0.1 graph.

### P2: Verify the transitive umbrella, not only the framework adapter

Several successful installs selected Astro 4.1.0 while retaining umbrella 4.1.0.
This occurred in Dep Beacon, Auth, Cult, and Fenix. The published adapter permits umbrella
`^4.1.0`; upgrading its direct version alone does not prove adoption of umbrella 4.2.0.
Compatible, explicit pnpm resolution pins were used for those consumers.

Recommended change: extend `lumen audit-consumer` to compare the resolved package graph against
the chosen release manifest and offer the smallest package-manager-specific update. Explain when
an unchanged adapter still needs its umbrella refreshed. Preserve release-age and peer policies.
Do not recommend unused direct dependencies solely to influence transitive resolution.

Acceptance criteria: fixtures cover an unchanged direct adapter, an older compatible umbrella,
pnpm catalogs, frozen installs, and multiple adapters sharing one umbrella. A reported success
must prove the requested resolved versions, not merely that installation exited successfully.

### P2: Recognize supported critical CSS imports in consumer audits

The same KinJar dry run reported `framework-style-missing`, although its global stylesheet
imports the public `@santi020k/lumen-astro/styles/critical.css` entry and the page imports that
stylesheet. The audit should distinguish missing styles from a supported smaller entry whose
component coverage needs review.

Recommended change: recognize public stylesheet entries through consumer CSS import chains.
For critical CSS, compare the used component catalog with its supported coverage and report
specific additional styles only when required. Add fixtures for full CSS, critical CSS,
indirect imports, and components outside the critical catalog.

### P2: Reduce the cost of fresh SwiftPM adoption

On this host, SwiftPM's fresh mirror fetch remained in progress for more than 14 minutes.
The local repository's Git object directory occupied 4.6 GiB. These observations do not establish
a universal download time or the exact remote pack size, but they expose a costly adoption path.
Seeding a temporary cache from the local repository resolved the independently verified published
tag without changing the dependency URL or application version requirement.

Recommended investigation: measure cold-cache resolution, checkout size, and resource processing
for a small Swift consumer. Evaluate supported ways to distribute only required source/resources
while preserving the public package URL, products, immutable tags, icon contracts, and provenance.
Do not rewrite published Git history as part of this work.

Acceptance criteria: publish a reproducible cold/warm measurement and compare proposed approaches
on macOS CI. Consumer builds must continue to resolve the exact published revision. Keep local-cache
verification distinct from fresh network resolution and Apple delivery evidence.

### P2: Make migration review findings easier to act on

The v4 dry run produced no automatic source changes for KinJar or RoadScore, but emitted manual
Card, Button, Dialog, and DataTable review findings. A zero-change result must not be presented as
proof of rendered compatibility. MeMudo's v1 consumer likewise needed its real wrappers checked;
the v2 source preview alone did not require a rewrite.

Recommended change: group findings by concrete behavior and provide focused examples for card
spacing/media, loading-button selectors, dialog dismissal/focus, and controlled table sorting.
Retain consumer-owned domain behavior. Where source syntax is ambiguous, report the precise
location and explain what interaction or rendered state proves compatibility.

Acceptance criteria: each finding points to a documented contract and a meaningful verification
step. Avoid repeated generic warnings that obscure actionable source changes.

## Consumer execution record

The upgrade covers 21 npm-consuming repositories and the existing Swift consumers. Compose 4.0.0
is already the correct artifact for this release and must not be replaced with an invented 4.2.0.
The Homebrew tap, Zed extension registry, and profile repository have no Lumen dependency.
Backup, archive, and checkout directories are outside the consumer set.
Existing dirty checkouts are preserved; isolated checkouts hold upgrades when a release is occupied.
Local validation and integration outcomes are recorded below. Publication is a separate operation.

| Consumer | Release target | Validation and integration |
| --- | --- | --- |
| aaronmgz | `release/v2.2.0` | pnpm run verify:full, including browser suites passed; local commit `68a4d229`. |
| astro-doctor | `release/v1.5.0` | pnpm run pre-push passed; local commit `eb786885`. |
| auth | `release/v0.5.1` | pnpm run check; production audit clean passed; local commit `3ddaea4b`. |
| commitprompt | `release/v1.2.0` | pnpm run validate; repeated after integration passed; local commit `c4269bbc`. |
| ContracTrack | `release/v1.1.1` | Repository lint; website check/tests/build; iOS, macOS, watchOS builds passed; local commit `152c4ff7`. |
| coolstead | `release/v1.2.0` | pnpm run check passed; local commit `0bbef7b8`. |
| cult | `release/v0.3.0` | pnpm run verify; repeated after integration passed; local commit `8254569d`. |
| dep-beacon | `release/v1.3.0` | pnpm run validate passed; local commit `5fe2cce0`. |
| eslint-config-basic | `release/v3.6.2` | pnpm run pre-push; pnpm run docs:build passed; local commit `911c3940`. |
| fenix | `release/v1.2.0` | pnpm run verify after integration passed: 827 application unit and 503 browser tests; upgrade `59281ef8`, validated release `5317369a`. |
| kinjar | `release/v0.1.1` | pnpm run check passed; local commit `c53b6a8b`. |
| memudo.ai | `release/v0.0.1` | pnpm run check passed; local commit `6dd1d848`. |
| observatory | `release/v0.6.0` | pnpm run verify; repeated after integration passed; local commit `125f2410`. |
| postlens | `release/v2.0.0` | pnpm run check; 6 Planner browser tests; desktop/phone regression captures passed; local commit `7c96fee5`. |
| quality | `release/v1.4.0` | pnpm run validate passed; local commit `e6e1923f`. |
| roadscore | `release/v1.4.0` | pnpm run check; pnpm run test passed; local commit `fd60ec21`. |
| santi020k-og | `release/v1.2.2` | pnpm run validate passed; local commit `c9e5d920`. |
| santi020k-theme | `release/v3.0.0` | pnpm run validate passed; local commit `c1c99335`. |
| santi020k-way | `release/v1.0.0` | pnpm run verify; repeated after integration passed; local commit `d45e9e7c`. |
| website | `release/v4.1.0` | pnpm run verify:fast on Node 24.21.0; 453 unit tests passed; local commit `2f979c76`. |
| workspace-organizer | `release/v0.3.0` | pnpm run check passed; local commit `1bb63398`. |

Additional consumer improvements:

- PostLens Calendar now loads publishing accounts before deciding whether to show consent and
  approval controls. Its existing regression failed before the fix and passes afterward; all six
  Planner browser checks pass. Matching desktop and phone captures use synthetic test data.
- Auth's unchanged baseline already contained the production audit findings. Compatible fixes to
  undici, http-cache-semantics, source-map-js, and Sharp clear the audit. Its complete check passes.
- The website's dependent social metadata and generated resume PDFs were refreshed with its
  existing generators, and the final Node 24 gate passes.
- Fenix's initial mobile layout failure also reproduces at pre-upgrade commit `1b98c1a`. Its parallel
  release work supplied the fixture-provisioning and label-wrapping fixes before this upgrade was
  refreshed. Repeated export warnings now receive distinct, stable identities while retaining their
  order and count; three focused regression tests pass. Workbook browser assertions now verify
  exact records for their unique reference instead of racing unrelated portfolio totals. The owning
  release checkout passed the merged completion gate: 827 application unit tests, 503 browser tests,
  and all eight Turbo tasks; the existing unit/browser skips remain. Independent final review
  reported no actionable findings.

Native verification used the published Swift revision, with a temporary cache seeded from the
local repository. PostLens used an isolated iOS 26.5 simulator after the existing selected device
proved to have missing data. Existing simulator data was not erased.

No upgrade in this record implies a push, remote merge, deployment, npm publication, store delivery,
or fresh physical-device accessibility verification. Rollback restores the consumer's previous
manifests, lock files, and Swift requirement/resolution, followed by its normal rebuild and tests.
These dependency upgrades require no persisted-data migration.
