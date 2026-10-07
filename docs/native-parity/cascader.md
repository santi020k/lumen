# Cascader native parity

`LumenCascader` uses the shared flat `LumenTreeNode` graph and stable node IDs.
Branch actions disclose children. Only enabled, selectable leaves commit a full
root-to-leaf `selectedPath`, matching Astro's leaf-only completion. Branches marked
`selectable: false` remain browsable; leaves marked false cannot commit.

React Native accepts `selectedPath` and `onSelectionChange`; SwiftUI accepts a
`Binding<[String]>`; Compose accepts `selectedPath` and `onSelectionChange`.
`LumenCascaderModel` exposes `tree`, `canSelect`, `isPathValid` and `selecting` for
host validation. Selection remains application-owned. Missing, partial or invalid
host paths display `unknownSelectionLabel` and remain untouched until an explicit
valid leaf selection. Graph errors fail closed. A canonical branch path can be
shown as host state but never emitted as a completed selection.

The phone view drills into one level at a time instead of squeezing multiple
columns. `backLabel` returns to the parent, and a visible ancestry trail identifies
the browsing location. Browsing state is local and independent of selected state.
Disabled adapters block navigation and selection; read-only adapters permit
browsing but block selection. Disabled ancestors block their entire subtree.

Hosts localize labels through node text, `loadingLabel`, `emptyLabel`,
`invalidLabel`, `unknownSelectionLabel`, `placeholder`, `backLabel`,
`formatDisclosure`, and the supplied `error`. Loading and errors hide stale actions.
Rows use Lumen buttons and their native touch targets, focus and accessibility.
Leaves expose selected state; branch accessible names describe disclosure.

Each playground has an independent `CascaderParityExample` showing nested
selection, a missing initial selection, disabled/read-only controls and status
states. Dispatch and exports are wired by the integration owner. Focused model
regressions cover branch-versus-leaf rules, ancestor disabling, canonical ancestry,
invalid graphs and retention of unavailable host paths. Rendered interaction and
physical-device accessibility qualification remain separate verification gates.
