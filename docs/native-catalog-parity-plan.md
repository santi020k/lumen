# Native catalog parity completion

## Objective

Close all 24 gaps in the v4 web-to-native audit across React Native, SwiftUI (iOS),
and Compose (Android). Keep platform conventions and controlled application state.
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
| `Agenda` | Implemented in all three adapters | Focused native checks pass; combined API and rendered qualification pending |
| `Breadcrumb` | Initial implementation in all three adapters | Focused native regression checks; playground/rendered and full API baseline checks pending |
| `Calendar` | Implemented in all three adapters | Focused native checks pass; combined API and rendered qualification pending |
| `Carousel` | Pending in all three adapters | Pending |
| `Command` | Pending in all three adapters | Pending |
| `ColorPicker` | Implemented in all three adapters | Focused model and controlled interaction checks pass, including Android emulator; combined/rendered qualification pending |
| `DataTable` | Initial implementation in all three adapters | Sorting, selection, identity and state regressions; playground/rendered and full API baseline checks pending |
| `KanbanBoard` | Implemented in all three adapters | Focused native checks pass; combined API and rendered qualification pending |
| `KanbanColumn` | Implemented in all three adapters | Focused native checks pass; combined API and rendered qualification pending |
| `RichTextEditor` | SwiftUI and Compose in progress; React Native editor deferred by user | User declined a new native dependency; React Native rich editing remains an explicit gap |
| `Schedule` | Implemented in all three adapters | Focused adapter tests and two Android UI tests pass; rendered qualification and combined gates pending |
| `Table` | Initial implementation in all three adapters | Sorting, selection, identity and state regressions; playground/rendered and full API baseline checks pending |
| `Tooltip` | Compose exists; SwiftUI and React Native pending | Pending |
| `Tree` | Implemented in all three adapters | Focused native tests and React Native strict type/lint checks pass; playground dispatch, rendered checks and combined API gates pending |
| `TreeGrid` | Pending in all three adapters | Pending |
| `Rating` | Initial implementation in all three adapters | Swift model/API tests and Compose model test passed; React Native behavior tests and type checking passed; zero-warning React Native lint and API classification passed; rendered checks pending |
| `Timeline` | Initial implementation in all three adapters | Focused native regression checks; playground/rendered and full API baseline checks pending |
| `Stepper` | Initial implementation in all three adapters | Focused native regression checks; playground/rendered and full API baseline checks pending |
| `Tour` | Pending in all three adapters | Pending |
| `Transfer` | Implemented in all three adapters | Focused adapter tests and two Android UI tests pass; combined/rendered qualification pending |
| `Cascader` | Implemented in all three adapters | Focused model and interaction tests, native compilation and zero-warning lint pass; rendered and combined API gates pending |
| `TreeSelect` | Implemented in all three adapters | Focused adapter tests and two Android UI tests pass; combined/rendered qualification pending |
| `Mentions` | Pending in all three adapters | Pending |
| `QRCode` | Implemented in all three adapters | Focused encoding/independent decoding and lint pass; React Native narrow/desktop light/dark rendered states pass; iOS simulator and Android emulator rendered states independently decoded; combined gates pending |

## Working state

Implementation branch: `feature/native-catalog-parity`.
Worktree: `/private/tmp/lumen-native-catalog-parity`.
Base: local `release/v4.0.0` at `2e860020` after fetching origin.
Rating uses whole integers, zero for unrated, and a bounded maximum of 1 through 100.
Hosts localize each option through a formatter; no host value is silently rewritten.
Remaining Rating work includes disabled behavior coverage, playground examples,
visual verification, documentation, registry and API baseline updates.

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

Dedicated assignments so far: Tree, QRCode, RichTextEditor, Cascader, Calendar
and KanbanBoard. Calendar and KanbanBoard implementation and QRCode rendered
verification remain active. The six checkpoint
implementations also receive dedicated verification assignments before closure.
No gap is closed by an assignment or a registry entry alone.

The user explicitly deferred the React Native RichTextEditor on 2026-10-04 and
declined an additional native editor dependency. SwiftUI and Compose work continues;
a plain text field must not be described as rich text parity.
