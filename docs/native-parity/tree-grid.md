# Native TreeGrid

Astro supplies hierarchical rows and labeled cells through a semantic wrapper.
Its reference example includes row levels and expansion, without sorting or selection.
Native adapters reuse the existing iterative `LumenTreeModel` for graph validation,
visible row order, inherited disabled state and expansion proposals. Table cell
values remain host-formatted; the library adds no domain logic or persistence.

`LumenTreeGridRecord` joins a `LumenTreeNode` to cells keyed by stable column key.
`LumenTreeGridColumn` contains `key` and `label`. Duplicate or blank identities,
unnamed rows/columns, missing parents and cyclic graphs suppress row controls.
Missing cells use the localized `missingCellLabel`; React Native validates runtime
cell text and reads own properties, including literal `constructor` column keys.
Inherited prototype members never become displayed cell values.

The host controls expansion through `expandedIds` and `onExpandedChange` in RN and
Compose, or a binding in SwiftUI. Collapsing a branch retains hidden descendant and
unknown host IDs. Disabled ancestors block descendants' disclosures. Read-only
permits browsing while host cell editing is guarded. RN `renderCell` receives a
fourth `{disabled, readOnly}` context; Compose `cellContent` receives enabled and
read-only flags. Host custom interactive cells must honor those flags. SwiftUI's
custom `cellContent` subtree inherits disabled state automatically.

The native phone layout presents records with each column label beside its value,
without forcing clipped desktop columns into narrow screens. All adapters use lazy
bounded lists. Visual indentation caps at four levels while localized semantic level
names retain the full depth. Disclosures use existing Lumen buttons and touch targets.
Loading/error/invalid/empty states replace stale row controls; status and disclosure
labels and full levels are host-localizable.

The three `TreeGridParityExample` fragments demonstrate host-owned synthetic cells,
expansion with an unknown ID, read-only state and disabled branches. Focused tests
cover visible hierarchy/cells, validation, deep levels, retained expansion IDs,
inherited disabled state, own-property cells, status guards and host cell context.
Rendered screenshots and physical assistive-technology checks remain release evidence.
