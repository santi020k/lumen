# Composable React table views

`DataTableView` is an opt-in React companion to `Table` and `DataTable`, powered by TanStack Table
9. It supplies search, exact column filters, visibility controls, density preferences, pagination
and controlled sorting state. Applications retain their table markup, financial calculations,
permission checks, row actions and detail content. Astro and Elements retain their existing table
contracts; this companion does not introduce a TanStack runtime into those adapters.

Import it selectively from `@santi020k/lumen-react/components/data-table-view`, or from the React
package root. Load the normal Lumen stylesheet once, followed by the opt-in table stylesheet.

```tsx
import '@santi020k/lumen-react/styles/data-table-view.css'

import { Button, Table } from '@santi020k/lumen-react'
import { DataTableView } from '@santi020k/lumen-react/components/data-table-view'

const records = [
  { id: 'loan-1', client: 'Example client', status: 'overdue', balance: 120000 },
  { id: 'loan-2', client: 'Another client', status: 'active', balance: 80000 }
]

export function LoansTable() {
  return (
    <DataTableView
      label="Loans"
      rows={records}
      getRowId={row => row.id}
      columns={[
        { key: 'client', label: 'Client', value: row => row.client, canHide: false },
        { key: 'balance', label: 'Balance', value: row => row.balance, sortable: true },
        { key: 'status', label: 'Status', value: row => row.status,
          filterOptions: [{ value: 'overdue', label: 'Overdue' }, { value: 'active', label: 'Active' }] }
      ]}
    >
      {view => (
        <Table layout="records" role="region" aria-label="Loans" tabIndex={0}>
          <table role="table" aria-label="Loans">
            <thead role="rowgroup">
              <tr role="row">
                <th scope="col">Client</th>
                <th scope="col" hidden={!view.isColumnVisible('balance')}>
                  <Button type="button" onClick={event => view.toggleSort('balance', event.shiftKey)}>
                    Balance
                  </Button>
                </th>
                <th scope="col" hidden={!view.isColumnVisible('status')}>Status</th>
              </tr>
            </thead>
            <tbody role="rowgroup">
              {view.rows.map(row => (
                <tr role="row" key={row.id}>
                  <td role="cell"><span className="ui-table__label" aria-hidden="true">Client</span>{row.client}</td>
                  <td role="cell" hidden={!view.isColumnVisible('balance')}>
                    <span className="ui-table__label" aria-hidden="true">Balance</span>{row.balance}
                  </td>
                  <td role="cell" hidden={!view.isColumnVisible('status')}>
                    <span className="ui-table__label" aria-hidden="true">Status</span>{row.status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Table>
      )}
    </DataTableView>
  )
}
```

These native table children are the public `Table` compound-child contract. In a product, use
Lumen `Button` for sorting controls and expose the active ordering with `aria-sort` on the header.
For multiple-column ordering, expose the priority in the button's accessible name and reserve
`aria-sort` for the primary column. Provide an explicit control for adding priorities so keyboard
and touch users do not depend on Shift-click.

## State and query ownership

- Client mode requires the complete authorized dataset. Search and exact column filters run before
  sorting and pagination. Row accessors return raw strings/numbers; currency presentation remains
  in the application's cells. Dates should expose a sortable ISO value.
- `manualSorting` preserves the supplied application's ordering while filtering and paging locally.
- Server mode (`mode="server"`) never filters, reorders or slices the supplied page. Pass the total
  matching `rowCount`, controlled `state` and `onStateChange`; fetch the requested page and apply
  filters and sorting before pagination on the server. The controller does not fetch records.
- `state` is controlled: interactions call `onStateChange` and wait for the application to supply
  the next state. `defaultState` initializes an uncontrolled view only once. Page sizes must be
  positive safe integers and page indices must be nonnegative safe integers.
- Rows require string IDs. `getRowId` must return unique, nonempty IDs, stable across sorting,
  filtering and refreshes. Sparse records and duplicate IDs fail before TanStack processing.
- `state` contains search, filters, visibility, pagination, sorting and density. It can supply an
  application-owned saved view, but Lumen does not automatically persist it. Search/filter values
  can contain sensitive information; applications decide whether and where to save them.
- Search and filter changes return to page one. Refreshes that shorten the dataset clamp the
  rendered client page; page navigation uses that effective page.
- Keep identity and action columns visible with `canHide: false`. Apply `isColumnVisible` to both
  headers and cells, and `visibleColumnCount` to expanded rows' `colSpan`.
- `searchable={false}` keeps an application's existing search toolbar without adding a duplicate.
- Localize every control through `labels`, including the `page(page, pages, matchingRows)` callback.
  `disabled` disables the built-in controls while a query is pending.

The scroll region has sticky headers, and the density control changes the shared cell-padding
variable. Applications with custom cell padding should consume that variable. Mobile record
layouts retain labeled cells and avoid freezing headers inside their card layout.

## Cartera adoption boundary

A future Cartera integration should retain the existing portfolio search, status filter, server
sorting and financial calculations. Payments can add table search and a received/reversed filter.
Column visibility, density and pagination must preserve records, permissions and ledger facts.
Payment details should span only visible columns and keep their application-owned disclosure state.
These library capabilities and recipes do not deliver that application integration.

Lumen 4 publication is a prerequisite for a reproducible Cartera dependency upgrade from 2.1.0.
Local packed-package checks are consumer evidence, not a published package or production release.
Column resizing/reordering/pinning, grouping and virtualization remain follow-up capabilities.
Page-scoped selection and batch-action presentation are now opt-in, as described below.

## Saved operational views

`DataTableSavedViews` provides naming, selection, update, removal and reset controls. Import it
from the React root or `/components/data-table-saved-views`. Supply `views`, the current `state`,
`resetState` and explicit `onApply`, `onSave`, `onUpdate` and `onRemove` callbacks. The component
requests changes; the host owns the view list, active ID, persistence, account scoping and errors.
Use `disabled` while persisting and localize the `labels` object.

Saved and restored preferences start at page one. `parseDataTableViewState(unknown)` validates
external preferences and returns a detached copy containing only supported view fields. It throws
on malformed structures. Selection and row data are excluded. Filter/search text can still contain
private information: choose storage and retention deliberately rather than saving it automatically.

## Inclusive amount and date ranges

Set a column's `rangeFilter` to `number` or `date`. Its accessor returns the raw numeric value or a
valid `YYYY-MM-DD` date-only string. This is mutually exclusive with `filterOptions`. The optional
`state.ranges` array contains `{ id, from, to }` string bounds; empty bounds are open. Criteria reset
pagination and combine with search and other column filters. Both bounds are inclusive. Missing,
nonfinite and invalid date values do not match an active range. Reversed bounds match no records.
In server mode, forward the ranges to the backend: Lumen does not filter the supplied page.
Localize the `rangeFrom(column)` and `rangeTo(column)` label callbacks.

## Selection and batch-action presentation

Pass `selection={{ selectedIds, onChange, unavailableReason, actions }}` to opt in. The IDs are
controlled by the application and remain separate from view preferences. `unavailableReason(row)`
returns a localized reason for excluding a record, or `undefined` when eligible. Render that reason
beside the row control. Use the render callback's `selection.isSelected(row)` and `selection.toggle(row)`
for row checkboxes. All library selection actions and sorting requests honor `disabled`.

The built-in select-all checkbox explicitly selects eligible records **on this page**. It shows a
mixed state for partial selection. Paging and filtering retain other selected IDs; clearing selection
is explicit. `selectedRows` contains only supplied records, which may be incomplete under server
pagination. Never derive a full-portfolio amount, permission decision or batch payload from that
partial list. The application must resolve and authorize every selected ID before executing a
command, recheck eligibility against current data, and review consequential changes first.

`actions(selection)` renders application-owned buttons. The library performs no export, messaging,
payment, record mutation or network request. The live consumer-workflows example previews an export
selection with fictional records. All-matching server selection, resizing, pinning, grouping and
virtualization remain separate follow-up capabilities.
