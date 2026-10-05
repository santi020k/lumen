import { useState } from 'react'

import { Button, DataTable, type DataTableCell, type DataTableColumn, type DataTableRow, type DataTableSort, Dialog, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, Stack } from '@santi020k/lumen-react'

export interface OperationalRecordsRecipeProps {
  columns: DataTableColumn[]
  rows: DataTableRow[]
  sort: DataTableSort | null
  onSortChange: (sort: DataTableSort | null) => void
  label: string
  actionsLabel: string
  editLabel: string
  closeLabel: string
  detailsLabel: string
  expandLabel: string
  collapseLabel: string
}

const recordText = (cell: DataTableCell): string => typeof cell === 'object' && cell !== null ?
  String(cell.label ?? cell.value ?? '') :
  String(cell ?? '')

/** Manual sorting delegates requests and row order to the host. Stable IDs are required. */
export const OperationalRecordsRecipe = ({
  columns, rows, sort, onSortChange, label, actionsLabel, editLabel, closeLabel,
  detailsLabel, expandLabel, collapseLabel
}: OperationalRecordsRecipeProps) => {
  const [active, setActive] = useState<DataTableRow | undefined>(undefined)

  return (
    <>
      <Stack direction="horizontal" wrap gap="related">
        {columns.filter(column => column.sortable).map(column => (
          <Button
            key={column.key}
            variant="outline"
            aria-pressed={sort?.key === column.key}
            onClick={() => {
              onSortChange({ key: column.key, direction: sort?.key === column.key && sort.direction === 'ascending' ? 'descending' : 'ascending' })
            }}
          >
            {column.header}
          </Button>
        ))}
      </Stack>
      <DataTable
        role="region"
        tabIndex={0}
        aria-label={label}
        layout="records"
        rows={rows}
        columns={[...columns.map(column => ({ ...column, sortable: false })), { key: 'actions',
          header: actionsLabel,
          render: (_cell, row) => (
            <DropdownMenu>
              <DropdownMenuTrigger aria-label={`${actionsLabel}: ${recordText(row.name ?? row.id)}`}>{actionsLabel}</DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => {
                  setActive(row)
                }}
                >
                  {editLabel}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) }]}
        sortMode="manual"
        sort={sort}
        onSortChange={onSortChange}
        expandLabel={expandLabel}
        collapseLabel={collapseLabel}
        detailsLabel={detailsLabel}
        renderDetails={row => <p>{recordText(row.detail)}</p>}
      />
      <Dialog
        open={active !== undefined}
        onOpenChange={open => {
          if (!open) setActive(undefined)
        }}
        aria-label={editLabel}
      >
        <p>{recordText(active?.name)}</p>
        <Button onClick={() => {
          setActive(undefined)
        }}
        >
          {closeLabel}
        </Button>
      </Dialog>
    </>
  )
}
