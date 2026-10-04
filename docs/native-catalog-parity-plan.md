# Native catalog parity completion

## Objective

Close 23 gaps in the v4 web-to-native audit across React Native, SwiftUI (iOS),
and Compose (Android), retaining RichTextEditor as explicitly deferred by the user.
Keep platform conventions and controlled application state.
A name or registry entry alone does not close a gap: the implementation must provide
its reference behavior, documented public API, regression tests and rendered interaction evidence.

## Completion requirements

- Inspect each Astro reference and native primitives before implementation.
- Cover controlled updates, disabled/read-only states where relevant, localization,
  accessibility, touch targets, narrow layouts, loading/error/empty states and stable IDs.
- Preserve application ownership of requests, routing, persistence and permissions.
- Expose all new APIs; update native registry, package documentation, API classifications,
  generated playground catalogs, MCP snapshot and changesets through repository tools.
- Add usable examples in the three phone playgrounds and verify rendered interactions.
- Run affected TypeScript, React Native, Swift and Compose checks, then canonical validate.
- Commit focused changes and integrate into local release/v4.0.0 after validating the result.
- Publication, pushes and store updates require separate authorization.

## Inventory

| Gap | Implementation status | Verification status |
| --- | --- | --- |
| `Agenda` | Implemented in all three adapters | Dedicated tests and rendered checks pass; combined gate/capture completion tracked below |
| `Breadcrumb` | Implemented in all three adapters | Dedicated tests and rendered checks pass; combined gate/capture completion tracked below |
| `Calendar` | Implemented in all three adapters | Finite Android grid sizing passes actual 268/350/390dp geometry and date-selection checks in both themes |
| `Carousel` | Implemented in all three adapters | Dedicated tests and rendered checks pass; combined gate/capture completion tracked below |
| `Command` | Implemented in all three adapters | Dedicated tests and rendered checks pass; combined gate/capture completion tracked below |
| `ColorPicker` | Implemented in all three adapters | Dedicated tests and rendered checks pass; combined gate/capture completion tracked below |
| `DataTable` | Implemented in all three adapters | Dedicated tests and rendered checks pass; combined gate/capture completion tracked below |
| `KanbanBoard` | Implemented in all three adapters | Dedicated tests and rendered checks pass; combined gate/capture completion tracked below |
| `KanbanColumn` | Implemented in all three adapters | Valid move boundaries pass three native UI tests and all four browser viewport/theme cases |
| `RichTextEditor` | Limited SwiftUI and Compose subset; React Native editor deferred by user | User declined a new native dependency; React Native rich editing remains an explicit gap |
| `Schedule` | Implemented in all three adapters | Dedicated tests and rendered checks pass; combined gate/capture completion tracked below |
| `Table` | Implemented in all three adapters | Dedicated tests and rendered checks pass; combined gate/capture completion tracked below |
| `Tooltip` | Implemented in all three adapters | Dedicated tests and rendered checks pass; combined gate/capture completion tracked below |
| `Tree` | Implemented in all three adapters | Dedicated tests and rendered checks pass; combined gate/capture completion tracked below |
| `TreeGrid` | Implemented in all three adapters | Dedicated tests and rendered checks pass; combined gate/capture completion tracked below |
| `Rating` | Implemented in all three adapters | Dedicated tests and rendered checks pass; combined gate/capture completion tracked below |
| `Timeline` | Implemented in all three adapters | Dedicated tests and rendered checks pass; combined gate/capture completion tracked below |
| `Stepper` | Implemented in all three adapters | Dedicated tests and rendered checks pass; combined gate/capture completion tracked below |
| `Tour` | Implemented in all three adapters | Dedicated tests and rendered checks pass; combined gate/capture completion tracked below |
| `Transfer` | Implemented in all three adapters | Dedicated tests and rendered checks pass; combined gate/capture completion tracked below |
| `Cascader` | Implemented in all three adapters | Dedicated tests and rendered checks pass; combined gate/capture completion tracked below |
| `TreeSelect` | Implemented in all three adapters | Dedicated tests and rendered checks pass; combined gate/capture completion tracked below |
| `Mentions` | Implemented in all three adapters | Dedicated tests and rendered checks pass; combined gate/capture completion tracked below |
| `QRCode` | Implemented in all three adapters | Dedicated tests and rendered checks pass; combined gate/capture completion tracked below |

## Working state

Implementation branch: `feature/native-catalog-parity`.
Worktree: `/private/tmp/lumen-native-catalog-parity`.
Base: local `release/v4.0.0` at `2e860020` after fetching origin.
Rating uses whole integers, zero for unrated, and a bounded maximum of 1 through 100.
Hosts localize each option through a formatter; no host value is silently rewritten.
Rating now passes disabled/read-only, controlled value, keyboard and rendered checks with localized examples.

Table/DataTable use stable identities and host-formatted cells. Manual sorting
retains server order; explicit client sorting is stable with missing values last.
Selection retains hidden IDs and skips disabled rows. Status states hide stale
controls. The preceding full Compose unit/lint run passed before table changes.

## Dedicated gap assignments

Each subagent assignment owns one gap. Completed agent slots are reused because the tool refuses additional threads at its limit. The session permits
three active subagents alongside the integration owner; remaining assignments are
queued as each slot becomes available. Component agents own their adapter code,
focused tests and individual playground examples. The integration owner manages
shared exports, registries, generators, combined verification and release integration.

Dedicated assignments cover Tree, QRCode, RichTextEditor, Cascader, Calendar,
Agenda, KanbanBoard, KanbanColumn, Schedule, ColorPicker, TreeSelect, Transfer,
Carousel, Tooltip, Command, TreeGrid, Tour, Mentions, DataTable, Table, Rating,
Breadcrumb, Timeline and Stepper. Every gap has received its dedicated assignment.
The integration owner verifies shared gates and full consumer captures.

The user explicitly deferred React Native RichTextEditor on 2026-10-04 and declined
an additional native editor dependency. The limited SwiftUI/Compose formatting
subset remains documented; rich editing is pending.


## Combined verification progress

All 23 remaining counterparts have completed dedicated source and focused behavior checks.
The combined React Native suite passed 353 tests after the final palette and boundary follow-ups; canonical
strict type checking passed. Compose full unit/lint and consumer build passed, including the
five palette and two malformed-span regression tests. iPhone simulator interaction/capture
checks passed for the combined catalog, including center tapping quiet Command buttons.
Rendered capture coverage passes with 305 captures, and native API baselines are regenerated and
classified. Canonical `pnpm run validate` passes: 1,921 tests, strict types, zero-warning lint,
spelling, unused-export checks, builds, security checks and packed consumer smoke tests.
Local release integration remains pending while the release checkout belongs to another active chat.
Android consumer captures revealed a narrow calendar grid defect; the correction now
passes actual geometry and date-selection checks at 268/350/390dp in both themes.
