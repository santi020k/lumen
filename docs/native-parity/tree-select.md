# Native TreeSelect

`LumenTreeSelect` preserves Astro's single-value trigger/panel selection over a
hierarchy. The reference shows every hierarchy level and permits selecting parent
nodes as well as leaves; it provides no search or collapse API. Native adapters
use a bounded, lazy scrollable inline disclosure panel, preserving hierarchy indentation
and providing accessible option names through the full path and one-based level.

All three adapters reuse `LumenTreeNode` and the existing iterative `LumenTreeModel`.
`LumenTreeSelectModel` validates the graph and exposes all ordered rows, selection
eligibility and selection-label resolution. Duplicate/blank IDs, missing parents
and cycles hide options and cannot change the host selection. Disabled ancestors
block descendants; groups with `selectable=false` remain visible. Deep traversal is iterative.

React Native and Compose accept nullable `value` with `onValueChange(String)`;
SwiftUI takes a nullable string binding. Unknown values remain unchanged and display
`unknownSelectionLabel`; nil/null displays `placeholder`. The library never resets
values during loading, invalid data or option removal. A valid user selection
proposes its stable ID and closes the panel; choosing the current value simply
closes it. Applications own fetching, persistence and explicit clearing.

Disabled controls block browsing and selection. Read-only permits browsing but
blocks selection. Loading/error/invalid states hide stale controls; empty options
have a localized empty panel. Existing Lumen buttons provide native focus and touch
targets. `formatOption(label, pathLabels, oneBasedLevel)` localizes accessible names;
placeholder, unknown/loading/empty/invalid and expanded/collapsed labels are supplied
by the host. State text and visible labels remain independently localizable.

Each phone playground has `TreeSelectParityExample` with a retained unknown ID,
three hierarchy levels, a disabled branch, explicit clearing and state controls.
Focused model and component tests cover parent/leaf selection, disabled ancestry,
unknown retention, invalid graphs, disclosure/status behavior and deep traversal.
Rendered phone interaction and physical-device assistive technology remain release
verification requirements.
