import type { ReactNode } from 'react'

import { Button, Checkbox, Label } from './components.js'
import type { DataTableViewSelectionResult } from './data-table-selection-model.js'

export const DataTableSelectionControls = <T,>({
  selection, disabled, selectPageLabel, clearLabel, countLabel, actions
}: {
  selection: DataTableViewSelectionResult<T> | undefined
  disabled: boolean
  selectPageLabel: string
  clearLabel: string
  countLabel: (count: number) => string
  actions: ((selection: DataTableViewSelectionResult<T>) => ReactNode) | undefined
}) => {
  if (!selection) return null

  return (
    <div className="ui-data-table-view__selection" role="group" aria-label={countLabel(selection.selectedIds.length)}>
      <Label>
        <Checkbox
          checked={selection.pageSelected}
          ref={input => {
            if (input) input.indeterminate = selection.pagePartiallySelected
          }}
          disabled={disabled || selection.eligiblePageCount === 0}
          onChange={selection.togglePage}
        />
        {selectPageLabel}
      </Label>
      <span role="status">{countLabel(selection.selectedIds.length)}</span>
      <Button type="button" variant="outline" disabled={disabled || selection.selectedIds.length === 0} onClick={selection.clear}>{clearLabel}</Button>
      {actions?.(selection)}
    </div>
  )
}
