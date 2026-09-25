import type { ReactNode } from 'react'

import { Table } from '@santi020k/lumen-react'

interface RecordColumn<Row> {
  key: string
  label: string
  render: (row: Row) => ReactNode
  wide?: boolean
}

/** A consumer-owned recipe: columns own both desktop headings and mobile labels. */
export const RecordTable = <Row,>({ caption, columns, rows, rowKey }: {
  caption: string
  columns: readonly RecordColumn<Row>[]
  rows: readonly Row[]
  rowKey: (row: Row) => string
}) => (
  <Table aria-label={caption} layout="records" role="region" tabIndex={0}>
    <table role="table">
      <caption style={{ padding: '1rem', textAlign: 'start', fontWeight: 600 }}>{caption}</caption>
      <thead role="rowgroup">
        <tr role="row">
          {columns.map(column => <th key={column.key} role="columnheader" scope="col">{column.label}</th>)}
        </tr>
      </thead>
      <tbody role="rowgroup">
        {rows.map(row => (
          <tr key={rowKey(row)} role="row">
            {columns.map(column => (
              <td className={column.wide ? 'ui-table__cell--wide' : undefined} key={column.key} role="cell">
                <span aria-hidden="true" className="ui-table__label">{column.label}</span>
                <div className="ui-table__value">{column.render(row)}</div>
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </Table>
)
