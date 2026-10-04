# Native KanbanBoard

`LumenKanbanBoard` renders a horizontally scrolling controlled board on narrow screens.
Cards and columns have stable string identities. `LumenKanbanCard` contains identity,
accessible label and disabled state; `LumenKanbanColumnData` adds ordered cards,
optional nonnegative capacity and disabled state. Application content belongs in
`renderCard` (React Native), `cardContent` (SwiftUI/Compose). Applications own
persistence, validation beyond capacity, and accepting proposed changes.

React Native and Compose accept `columns` and `onColumnsChange`; SwiftUI takes a
binding. No request or persistence runs within Lumen. `LumenKanbanModel.moving`
proposes immutable ordered columns or returns null/nil for rejected operations.
Insertion indices refer to destination order after removal. Empty or duplicate IDs,
invalid capacities, unknown cards/destinations, out-of-range positions, disabled
cards/columns, full destination columns and no-op moves are rejected. A full column
still supports internal reordering.

Every card has named button alternatives for moving between columns and reordering.
`formatMove(cardLabel, columnLabel, oneBasedPosition)` localizes their names. All
status labels are host-localizable; loading/error/invalid states hide stale controls.
Read-only and disabled boards retain content and block changes. Buttons use native
Lumen touch targets. SwiftUI additionally supports system drag and drop of known
card IDs, using the same validated model and binding updates.

Examples are `KanbanBoardParityExample` in each of the three phone playgrounds.
Model tests cover immutable moves, reorders, capacity, identity and disabled state.
React Native and Compose use long-press drag hit testing against measured column
and card bounds; drag release proposes a validated move. React Native refreshes
bounds after scrolling and before drag. SwiftUI uses system drag and drop.
Physical-device accessibility, nested-scroll responder takeover and rendered drag
behavior remain release evidence requirements. Drag auto-scrolling is not provided;
button alternatives can reach columns outside the currently visible viewport.
