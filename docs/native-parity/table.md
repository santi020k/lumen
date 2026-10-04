# Table native parity

`LumenTable` is the existing read-only native table in React Native, SwiftUI and Compose. This
qualification adds actual `TableParityExample` consumers and focused tests; it reuses the public
component and shared table models. DataTable owns sorting, selection, loading, error and retry behavior.
No new public exports, dependency or shared model convention is introduced.

## Reference and native behavior

Astro `Table.astro` wraps a host-supplied HTML table and defaults to horizontal scrolling. Native tables
accept stable column keys and row IDs with host-formatted string cells. Their default is record cards,
which repeat the column label with each value on a narrow screen. Explicit `scroll`/`Scroll` layout
uses 180-point/dp columns inside one native horizontal scroll viewport. The viewport owns overflow;
long cell content wraps vertically instead of truncating. Headers retain the host's column order.

React Native uses `LumenTable` with `label`, `columns`, `rows`, `layout`, `emptyLabel`, `invalidLabel`
and `missingLabel`. Swift exposes `LumenTable(_:columns:rows:layout:emptyLabel:invalidLabel:missingLabel:)`
with `LumenTableLayout.records`/`.scroll`. Compose uses the corresponding arguments and
`LumenTableLayout.Records`/`.Scroll`. Swift's existing table view/models support iOS, macOS and visionOS;
this work does not claim tvOS or watchOS support.

Column keys and row IDs must be nonempty and unique. Invalid identities replace all cells with the
host's invalid label. Empty rows or columns show the empty label. Missing cells use `missingLabel`;
explicit empty strings remain empty. Host data and ordering are preserved. React Native reads only
own properties through the public `getLumenTableCell` helper, so inherited values such as `toString`
or inherited cell records do not become cells. Native dictionary/map keys are literal; a key named
`__proto__` remains ordinary data.

Each cell exposes its column label and full value as a native accessible name; rows retain host row
labels. Plain Table has no action controls, mutation callbacks, selection state or sorting state.
Loading, error, retry, disabled actions and business state belong to the host or `LumenDataTable`.
The example's state controls use public Lumen buttons with native 44-point/dp targets. All visible and
accessible fixture labels have English/Spanish variants. Existing table primitives use semantic
theme colors and preserve multiline/Unicode content.

## Actual consumers and focused verification

All three `TableParityExample` fragments require no arguments. They demonstrate record cards and
horizontal scrolling with long translated column labels, synthetic multiline Unicode descriptions,
a missing owner cell, empty data, duplicate IDs, and restore. They do not add sorting or selection
business logic to Table.

RN tests exercise the public read-only component's own-property cell boundary, accessible missing/full
cell names, invalid/empty replacement, source preservation and a single horizontal viewport. Existing
table engine tests cover stable sorting and identity behavior separately. Swift and Compose focused
model tests cover duplicate/empty IDs and keys, empty data, literal keys, Unicode/multiline values and
missing cells without rewriting records. Actual playground fragments are typechecked/compiled against
the public APIs; shared index/dispatch/catalog wiring belongs to the parent integration.

RN eight focused tests, package/playground types and owned zero-warning lint pass. Swift two focused
tests pass; actual iOS and macOS fragments typecheck with warnings as errors. Compose two model tests,
lint and unchanged actual fragment/instrumentation compilation pass. Two actual Android emulator tests
pass in 3.307 seconds: named full/missing cells and empty/invalid/restore states, plus contained horizontal
scrolling through the native accessible `ScrollBy` action.

RN Web passes at 390 and 1280 pixels in light/dark with record/scroll layouts, full multiline content,
English/Spanish, empty/invalid/restore and zero page overflow. At 390 pixels the 350-pixel viewport
contains 558 pixels of content and scrolls with the ArrowRight key; desktop stays within its 720-pixel
container. Twelve screenshots and `results.json` are retained in `/private/tmp/lumen-table-rendered`.
Narrow light record/dark scroll captures were visually inspected. Native simulator/emulator checks do not qualify physical devices; full release integration,
canonical screenshots and broader platform/consumer qualification remain the parent gate.
