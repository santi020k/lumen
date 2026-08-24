# Active Lumen improvements

This file contains only improvements that remain actionable after the August 2026 web and native
adoption work. Completed items are intentionally removed instead of accumulating progress logs;
their implementation, tests, Changesets, and Git history are the durable record.

The following work is already covered by the repository and must not be recreated as a parallel
API: coordinated pnpm rollout and lockfile checks, package-manager pinning, web integration
diagnostics, locale-toggle behavior, compound dropdown exports, cross-platform release metadata,
Maven publication configuration, product-theme bridges, native install guidance, developed native
patterns, navigation badges and re-selection, adaptive or scroll-responsive navigation, SwiftUI
link and rich disclosure contracts, watchOS and Wear OS foundations, and release-candidate fixtures.

## Maintained consumer canaries

The in-repository release-candidate workflow verifies packed npm consumers, the Swift package and
playground, Compose publications, and the Android playground. The remaining gap is coordination
with maintained repositories that are not part of this workspace.

- Configure each maintained consumer to accept a repository dispatch or reusable workflow call.
- Pass a release-manifest URL or packed artifact reference rather than assuming a stable registry
  version already exists.
- Keep credentials and store publishing out of the canary.
- Classify package-policy, resolution, type/API, lint-tool, build, and device failures separately.
- Make external canaries required for a stable release only after each consumer owns a reliable,
  repository-specific workflow.

Acceptance criteria:

- At least one maintained Astro, React, SwiftUI, and Compose consumer runs against a candidate.
- The resolved adapter, umbrella, core, Swift, and Compose versions match the candidate manifest.
- A tool crash is reported with its exact command and diagnostic without being mislabeled as a
  Lumen product regression.

This item needs changes and authorization in the external consumer repositories; it cannot be
completed solely from this repository.

## Physical-device accessibility evidence

Automated semantics, unit tests, simulator builds, and accessibility-test compilation are present.
The remaining evidence requires representative hardware and human judgment. Continue recording
results in [`docs/native-device-validation.md`](docs/native-device-validation.md), including:

- VoiceOver, Dynamic Type, Reduce Motion, and Increase Contrast on iOS, macOS, and watchOS;
- TalkBack, font/display scaling, reduced animation, and high contrast on Android;
- TalkBack, rotary input, font scaling, Always On behavior, and round-screen clipping on Wear OS;
- keyboard, switch, touch-target, focus-order, announcement, and live-region behavior where the
  platform supports them.

Every result must identify the device, OS, revision, tester, exercised surface, outcome, and an
issue or recording when appropriate. Simulator or accessibility-tree output must not be recorded
as a completed physical-device pass.

## Runtime localization ergonomics in SwiftUI

Rich content slots allow application-resolved copy today, but the difference between localization
keys and verbatim runtime strings is not yet consistent across the complete SwiftUI catalog.

- Define one small, reusable text-content contract for `LocalizedStringKey`,
  `LocalizedStringResource`, and verbatim `String` without erasing native localization behavior.
- Adopt it only where it reduces repeated consumer bridges; do not churn every initializer merely
  for signature uniformity.
- Add a bilingual example that changes application-owned locale state while the view remains alive.
- Verify visible labels, descriptions, accessibility names, validation copy, and actions.
- Keep translation dictionaries, persistence, and locale selection application-owned.

## WidgetKit-compatible foundations

Widget timelines, App Intents, deep links, container backgrounds, and bounded interaction remain
platform- and product-owned. Research a small WidgetKit-safe presentation layer only if it can avoid
linking unsupported application components.

- Start with semantic text, spacing, icon, badge, and compact-stat treatments.
- Test full-color, accented, vibrant, high-contrast, and large-text rendering modes.
- Prefer generated tokens and focused views over importing the complete SwiftUI catalog.
- Do not introduce a public package until at least two maintained widgets share the contract.

## Adoption audit and Android preflight

`registry/native-components.json`, the documentation, and the MCP snapshot provide machine-readable
platform contracts. `lumen doctor-native` covers versions, resolver pins, release mismatches, and
theme placement. Two read-only diagnostic gaps remain:

1. A non-authoritative adoption inventory that groups likely component families and identifies
   direct primitives with public Lumen equivalents without classifying product-owned interfaces or
   rewriting source.
2. An Android preflight that detects missing or incomplete SDK, NDK, JDK, and platform packages
   before Gradle reaches native compilation, and reports the repository's documented compatible
   toolchain.

Both commands must emit human-readable and JSON output, distinguish suggestions from failures, and
derive component and version data from the existing registries rather than adding another source of
truth.

## Completion rule

An item can be removed from this file when its public contract and documentation exist, relevant
automated checks pass, and required external or device evidence is recorded. Product-specific
navigation, windowing, domain controls, safety policy, haptics, charts, widgets, and application
state are not backlog items merely because Lumen does not own them.
