# Native Tree

All adapters consume a flat, ordered array/list of `LumenTreeNode` records with stable
`id`, `label`, optional `parentId`, `disabled` and `selectable`. Missing parents,
empty/duplicate identities and cycles reject the complete graph. Roots and siblings
retain input order. Disabled ancestors disable their descendants.

Expansion and optional multi-selection are controlled sets. Unknown IDs survive
edits; no callback cleans host state. React Native and Compose preserve selection
insertion order. Swift uses native `Set` and has no selection ordering contract.
Read-only blocks selection while allowing expansion. Disabled trees block both.
Loading, error, invalid and empty states hide stale controls. Hosts localize every
status label and supply `formatDisclosure(label, expanded)` and `formatLevel(depth)`;
depth is zero-based. Indentation stops growing after eight levels to retain usable
phone width, while the visible/accessibility level label reports the actual depth.

`LumenTreeModel` exposes `valid`, `node`, `childrenOf`, `path`, `isDisabled`,
`visibleRows`, `togglingExpansion` and `togglingSelection`. Graph validation and
traversal are iterative, supporting adversarially wide/deep data. These pure APIs
are shared building blocks for Cascader, TreeSelect and TreeGrid.

React Native: import `LumenTree`, `LumenTreeModel`, `LumenTreeNode` and `LumenTreeRow`
from `@santi020k/lumen-react-native`. Supply `expandedIds`, `onExpandedChange`, and
optionally `selectedIds`/`onSelectionChange`.

SwiftUI: `LumenTree("Files", nodes: nodes, expandedIds: $expanded,
selectedIds: $selected)`; use `.disabled(true)` for the whole tree.

Compose: `LumenTree("Files", nodes, expanded, { expanded = it },
selectedIds = selected, onSelectionChange = { selected = it })`.

Each phone playground has a `TreeParityExample` fragment with synthetic workspace
files, controlled feedback and disabled/read-only/loading/error toggles. Rendered
integration and assistive-technology verification are separate completion gates.
