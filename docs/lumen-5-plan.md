# Lumen 5: modular delivery

Status: implementation in progress on `release/v5.0.0`, based on published v4.4.0
(`fc264ae2`). The maintainer selected modular packages with editable recipes on November 5, 2026.
P0, P1, and P2 are in scope. Publication requires a separately approved, validated revision.

## Product goal

A page pays for its Lumen components and their shared dependencies. A static page does not need
the interactive catalog. A dialog does not require a scheduler, editor, map, or phone engine.
Consumers customize documented parts and editable recipes while package-owned accessibility and
behavior fixes continue to arrive through upgrades.

Keep the existing adapter packages. Extend `lumen add` and selective exports rather than creating
a second lite catalog. Component wrappers and recipe sources remain editable; they import maintained
primitives instead of copying the entire primitive implementation into each consumer.

Distinguish four costs in every performance claim: installed dependencies, build graph, emitted
assets, and assets actually requested by a route. A smaller npm tarball does not prove a faster page;
a smaller module graph does not necessarily change the final browser bundle.

## Current evidence

Measurements below were rerun against `fc264ae2` with Node 22.23.4 and pnpm 12.8.1 after rebuilding
Core, umbrella, Astro, React, and Elements. Byte counts are synthetic fixture evidence, not production
traffic or universal savings. Source sizes exclude transitive imports and bundler optimization.

| Measurement | Current result | Implication |
| --- | --- | --- |
| Astro Card/Button/Icon, root versus component imports | Both emit 684 bytes; without Icon both emit 287 bytes, across three builds each | The historical barrel-emission issue is no longer reproduced. Preserve this behavior. |
| React ImageComparison root versus selective export | Both 4,831 minified bytes; 2,165 versus 5 traversed modules | Selective imports improve the graph; this fixture does not show a browser-byte reduction. |
| Elements VirtualList catalog versus selective registration | 509,377 versus 2,973 gzip bytes; 2,034 versus 7 modules | Expand true granular implementations and make installer output select them. |
| Umbrella full CSS source | 247,296 raw / 41,047 gzip bytes | Shared global catalog CSS remains a distinct delivery cost. |
| Generated critical CSS source | 72,295 raw / 12,253 gzip bytes | An essential-component preset already exists; it is not page-specific CSS. |
| Astro runtime source | 165,796 raw / 33,285 gzip bytes | Several optional controllers are split, but many unrelated behaviors remain together. |
| Adapter dependency graph | Web adapters depend on the umbrella, whose dependencies include TypeScript | Browser optimization and installation footprint need separate work. |
| Current component installer | Astro/React wrappers import roots; Elements wrappers register the whole catalog | Installing one wrapper currently does not guarantee selective delivery. |

Reproduce with `pnpm run measure:imports`, `pnpm run measure:selective-imports`, and the commands in
[import performance](import-and-icon-performance.md). The existing import fixture does not mount
the runtime or import CSS. Add route-level delivery fixtures before setting browser budgets.

## Delivery contract

- Publish a small shared foundation and explicit component CSS entries from the existing packages.
  Generate them from canonical sources and documented dependencies; retain a full stylesheet for
  existing consumers. Preserve layer ordering, nested themes, RTL, print, forced colors, and reduced
  motion. Do not rely on deleting selectors discovered through text searches of application source.
- Split Astro behavior into feature modules with a small loader. Keep the public root runtime
  mounting API, explicit readiness, idempotent initialization, and navigation cleanup. Components
  absent from the route must not cause their controllers to be fetched.
- Provide granular React implementations with correct client/server boundaries and granular Elements
  registrations with the same constructor identities as full registration. A facade over the catalog
  does not count as selective delivery.
- Make `lumen add` generate selective imports and required setup. Keep conflict protection, dry-run
  behavior, types, translated labels, and editable recipe ownership.
- Keep heavy datasets and optional behaviors outside simple component dependency graphs. Investigate
  separating tooling from adapter installation without inventing a second primitive package family.
- Document shared chunks honestly: frameworks can combine dependencies used across routes. Verify
  cold navigation, client navigation, conditional rendering, and runtime-inserted markup. Provide an
  explicit setup path for markup produced outside a framework component tree, including Markdown.
- Public examples must use implemented exports. Proposed APIs become documentation only when their
  package exports, types, installer output, metadata, and consumer checks agree.

Astro already supports [route/shared CSS chunks](https://docs.astro.build/en/guides/styling/#bundle-control)
and [deduplicated component scripts](https://docs.astro.build/en/guides/client-side-scripts/#script-processing).
Use those capabilities where they match the installed supported Astro versions. The
[shadcn distribution model](https://ui.shadcn.com/docs) informs editable composition; source ownership
and automatic package updates are different contracts.

## P0: delivery foundations and existing consumer regressions

1. Add route fixtures for static controls, dialog, code/tabs, forms, and a heavy feature. Report
   initial and interaction requests, raw/gzip assets, module graph, and unexpected feature imports.
   Record the v4 baseline before setting enforced candidate budgets.
2. Split Astro controllers and CSS delivery. Extend selective React/Elements coverage used by the
   installer and the fixtures. Preserve all existing interaction contracts and the convenient full
   entries. Test the first interaction while resources are delayed or fail.
3. Upstream the website's remaining synchronized-tab and scroll-cue fixes. Validate against its
   exact published-package regression fixture; remove the consumer patch only after equivalent
   unpatched-package checks pass. Keep website deployment in its own release workflow.
4. Expose matching TimelineItem, ThemeToggle icon, and WorldMap frame/control styling hooks across
   web adapters. Update the authoritative styling metadata, doctor guidance, and actual rendered
   markup together.
5. Define the v5 migration contract for changed exports, setup, and defaults. Review tall reveal
   groups separately: preserve explicit threshold semantics, prevent inaccessible hidden content,
   and test real observers with enlarged text. Do not silently replace every threshold with zero.
6. Extend existing migration and diagnostics with the final v5 contract and target-version evidence.
   Keep dependency changes opt-in, preserve package-manager/security policies, and retain idempotence.

P0 acceptance: no unrelated heavy controller on simple routes, selective CSS with visual equivalence,
stable first interaction and navigation, accurate setup diagnostics, and no website compatibility
patch needed for the fixed behavior. Installed-dependency savings require their own clean-install
measurement and cannot be inferred from browser measurements.

## P1: editable product workflows

1. Product video recipe using public Dialog primitives and native media controls: deferred source
   loading, captions, transcript, user-initiated playback, pause on close/navigation, and direct-file
   recovery. The recent website playback test issue was a host audio-clock issue, not evidence that
   Lumen needs a replacement video engine.
2. Long code examples and Markdown integration: folding, full-source copy, stable IDs, scroll cues,
   and manual-copy recovery. Reuse Code/CodeTabs/Collapsible contracts; preserve highlighted content
   and no-JavaScript readability. Keep prose styling and content policy application-owned.
3. Share recipe using existing overlays and CopyButton with application-supplied destinations and
   localized labels. Cover native-share cancellation, unsupported sharing, copy failure, and focus
   restoration. Do not add analytics or transmit content automatically.
4. Make every new recipe consume selective assets. Include dependency/setup metadata, install tests,
   documentation, and an executable example with loading/error/empty states where relevant.

## P2: portability, diagnostics, and measured follow-up

1. Extend the existing article-reading, site-search-dialog, and image-viewer recipes to React and
   Elements with framework-native lifecycle handling. Keep requests, routing, content, and persistence
   in the consumer. Test cancellation, stale asynchronous results, and remount/navigation behavior.
2. Add an explicit rendered migration/delivery audit accepting a caller-provided local URL. Report
   route, viewport, overflow, console problems, and unexpected Lumen assets without starting an app
   or browser during an ordinary source-only doctor command.
3. Add target-version contract and adoption reporting to existing CLI/MCP tooling. Separate
   compatibility failures from optional adoption opportunities; never rewrite domain controls based
   only on component names.
4. Ratchet measured delivery budgets and publish final baseline comparisons. Review native import
   costs and current parity records; apply only demonstrated fixes. Native rich-text editing remains
   deferred under the existing maintainer decision. Do not add a native map engine without a concrete
   consumer and its own dependency/contract decision.

## Execution and release checks

Work in focused commits on `release/v5.0.0`. Delivery foundations precede recipes so new examples
exercise the new boundaries. Changesets and the versioned contract must describe actual breaking
changes; candidate package versions follow the repository's coordinated release process.

Run affected unit, type, lint, package-export, generator, and installer checks while implementing.
Then run canonical `pnpm run validate`, web interaction/accessibility checks in the configured
browsers, mobile/desktop rendering, enlarged text, RTL, reduced motion, and no-JavaScript cases.
Test both package tarballs and real consumer-shaped fixtures, including Astro navigation and React
server boundaries. Check changed native surfaces with their platform commands.

The current [release policy](native-release-runbook.md#current-release-policy) governs qualification;
historical physical-device and stability matrices must not be reinstated as release gates.
Require independent pre-push review, resolve findings, and publish through the normal GitHub release
workflow only after authorization. Verify exact package/tag provenance and documented smoke checks.

Recovery: revert consumer versions, lockfile, and migrated setup together. Keep generated migration
reports reviewable; never replace published tags. Corrections to a published release use a new version.

## Progress

- Completed: source audit, current import measurements, and approved distribution direction.
- Completed P0 milestones: synchronized tab/scroll-cue fixes; feature-loaded Astro runtime with
  cold interaction, navigation, failure recovery, and measured route budgets. See
  [route evidence](import-and-icon-performance.md#november-5-2026-astro-route-delivery).
- In progress: remaining P0 CSS/package boundaries, styling hooks, migration contract, and consumer validation.
- Pending: P1, P2, full candidate validation, independent review, and release approval.
