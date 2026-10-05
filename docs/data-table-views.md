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

## Cartera adoption

Cartera's loans retain the existing portfolio search, status filter, server sorting and financial
calculations. Payments add table search and a received/reversed filter. Both receive column
visibility, density and local pagination without changing records, permissions or ledger facts.
Payment details span only visible columns and keep their application-owned disclosure state.

Lumen 4 publication is a prerequisite for a reproducible Cartera dependency upgrade from 2.1.0.
Local packed-package checks are consumer evidence, not a published package or production release.
Column resizing/reordering/pinning, selection/bulk actions, grouping and virtualization remain
follow-up capabilities. They are not enabled by this first composition.
