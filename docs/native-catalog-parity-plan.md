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
| `Agenda` | Pending in all three adapters | Pending |
| `Breadcrumb` | Initial implementation in all three adapters | Focused native regression checks; playground/rendered and full API baseline checks pending |
| `Calendar` | Pending in all three adapters | Pending |
| `Carousel` | Pending in all three adapters | Pending |
| `Command` | Pending in all three adapters | Pending |
| `ColorPicker` | Pending in all three adapters | Pending |
| `DataTable` | Initial implementation in all three adapters | Sorting, selection, identity and state regressions; playground/rendered and full API baseline checks pending |
| `KanbanBoard` | Pending in all three adapters | Pending |
| `KanbanColumn` | Pending in all three adapters | Pending |
| `RichTextEditor` | Pending in all three adapters | Pending |
| `Schedule` | Pending in all three adapters | Pending |
| `Table` | Initial implementation in all three adapters | Sorting, selection, identity and state regressions; playground/rendered and full API baseline checks pending |
| `Tooltip` | Compose exists; SwiftUI and React Native pending | Pending |
| `Tree` | Pending in all three adapters | Pending |
| `TreeGrid` | Pending in all three adapters | Pending |
| `Rating` | Initial implementation in all three adapters | Swift model/API tests and Compose model test passed; React Native behavior tests and type checking passed; zero-warning React Native lint and API classification passed; rendered checks pending |
| `Timeline` | Initial implementation in all three adapters | Focused native regression checks; playground/rendered and full API baseline checks pending |
| `Stepper` | Initial implementation in all three adapters | Focused native regression checks; playground/rendered and full API baseline checks pending |
| `Tour` | Pending in all three adapters | Pending |
| `Transfer` | Pending in all three adapters | Pending |
| `Cascader` | Pending in all three adapters | Pending |
| `TreeSelect` | Pending in all three adapters | Pending |
| `Mentions` | Pending in all three adapters | Pending |
| `QRCode` | Pending in all three adapters | Pending |

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
