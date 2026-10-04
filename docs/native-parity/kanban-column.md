# Native KanbanColumn

`LumenKanbanColumn` is a standalone, vertically arranged column. Astro's reference
is a labeled section identified by `value` with host-provided children. Native
adapters preserve column identity through `LumenKanbanColumnData.id` and provide
ordered host cards, a visible label, localized card count/capacity and an optional
host-owned add action. This component does not render or alias a complete board.

React Native and Compose take `column` and `onColumnChange`; SwiftUI takes a binding.
`renderCard` / `cardContent` supplies application content within a Lumen card.
`onCardPress` receives the stable card ID; `onAdd` requests creation without inventing
an ID or saving data. Applications own add validation, requests and persistence.
Read-only columns allow opening details while blocking reorder and add. Disabled
columns/cards block the corresponding actions. Capacity disables add, while a full
column can still reorder its existing cards. Invalid IDs, duplicate card IDs and
invalid capacities hide all controls. Column and card IDs may share the same value.

`formatCount(count, capacity)`, `formatMove(cardLabel, oneBasedPosition)` and
`formatOpen(cardLabel)` localize visible and accessible text. React Native also
exposes `formatDrag` for its hold-to-drag handle. Add/loading/error/empty/invalid
labels are host-provided. Loading and error hide stale controls; empty columns
retain add when permitted. Existing Lumen buttons provide touch targets and focus.
Content wraps at the host's available width.

SwiftUI uses system drag and drop; React Native and Compose use long-press drag
with measured card/column bounds. Unknown, out-of-range and disabled-card drops
are rejected by the existing Kanban model. Named reorder buttons provide
accessible alternatives only for neighboring positions within the current column. The first
card has no previous target, the last has no next target, and a single card has no
reorder alternatives. Valid targets remain visible but disabled in read-only/disabled
states. Drag auto-scrolling is not implemented. Physical-device
scroll-responder takeover, assistive technology and rendered drag remain required
release evidence.

Each phone playground contains `KanbanColumnParityExample` with host-owned rich
content, controlled order, details/add callbacks and state controls. Focused React
Native tests exercise callbacks, localization, capacity, read-only/disabled guards,
empty and status states. Swift/Compose tests cover the shared standalone-column
projection; Swift also compiles the default and rich-content component APIs.
