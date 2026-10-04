# Native DataTable

DataTable adapts Astro's structured columns, display/sort values, sorting cycle and
stable selection contract. The existing native checkpoint API remains unchanged:
`LumenDataTable` uses `LumenTableColumn`, `LumenTableRow` and `LumenTableCell`.
Rows require stable unique IDs; columns require unique nonempty keys. The existing
Table model supplies identity validation, stable sorting and selection proposals.
No additional graph, sorting engine, dependency or persistence is introduced.

Native defaults are record layout and manual sorting. A controlled sort cycles
ascending, descending and unsorted. Manual mode preserves host/server order;
explicit client mode sorts a copy using typed values, preserves equal-value order,
and leaves missing/nonfinite values last in either direction. Display text remains
host-formatted. Unknown sort keys and nonsortable columns do not reorder rows.

Controlled selection retains filtered-out and disabled IDs. Selecting visible
records changes only visible enabled rows. Disabled/read-only states block sort and
selection; loading/error/empty/invalid states hide stale editing controls. RN now
also treats an empty non-null error string as an error state, matching SwiftUI and
Compose. Its sort button's accessible name now includes the localized direction,
matching the visible name and the other adapters. Retry remains a localized host
callback, without introducing requests.

Record layout repeats column labels with each value for narrow phones. Scroll
layout keeps aligned columns within a horizontal scroller. Selection, sort and
retry actions use existing Lumen controls and touch targets. Host labels, missing
values, sort descriptions and recovery/status text are localized. RN and SwiftUI
provide locale-aware string comparison; Compose uses the device locale.

All three `DataTableParityExample` fragments use synthetic package records with
formatted numerical sort values, wrapped target text, missing cells and a locked
selected record. Hosts demonstrate client/manual sort modes, retained hidden IDs,
filtering, horizontal/record layouts, read-only/disabled states, loading/error/empty
states and English/Spanish copy. Persistence, pagination, filtering and remote
sorting remain application responsibilities.

Existing model tests cover stable ties, mixed sort types, invalid locale fallback,
identity validation and hidden/disabled selection. Focused RN component tests cover
actual controls, sorting/selection proposals and all status guards. Rendered RN
and Android interaction checks complement native compilation; physical-device
VoiceOver/TalkBack and release qualification remain separate evidence.

Focused verification passed: 12 RN component/model tests, strict package and
playground type checks, zero-warning lint, four Swift table checks and the actual
Apple playground build. The rendered RN fixture passed at 390px and 1280px in
light and dark themes, including Enter/Space activation, sorting, retained
selection, localized status/retry controls and horizontal-column reachability.
Android passed three existing Table model tests and three actual emulator UI
regressions, instrumentation compilation, the actual playground fragment compile
and library lint analysis. These are local browser/emulator/build checks.
