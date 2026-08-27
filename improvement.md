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
playground, Compose publications, and the Android playground. Repository-specific dispatch workflows
and successful local candidate runs now exist for the maintained Astro, React, SwiftUI, and Compose
consumers recorded in [`docs/native-consumer-validation.md`](docs/native-consumer-validation.md).
The remaining work is external adoption and immutable remote evidence:

- review, commit, and push each prepared workflow to its owning repository's default branch;
- dispatch an immutable release-manifest URL and record the successful remote run for each adapter;
  and
- make the canaries required for a stable release only after each consumer owner confirms the
  workflow is reliable.

Acceptance criteria:

- At least one maintained Astro, React, SwiftUI, and Compose consumer runs against a candidate.
- The resolved adapter, umbrella, core, Swift, and Compose versions match the candidate manifest.
- A tool crash is reported with its exact command and diagnostic without being mislabeled as a
  Lumen product regression.

The local workflow files are intentionally uncommitted because committing and pushing external
repository changes requires explicit authorization. This item cannot be removed until those remote
runs exist.

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

## Completion rule

An item can be removed from this file when its public contract and documentation exist, relevant
automated checks pass, and required external or device evidence is recorded. Product-specific
navigation, windowing, domain controls, safety policy, haptics, charts, widgets, and application
state are not backlog items merely because Lumen does not own them.
