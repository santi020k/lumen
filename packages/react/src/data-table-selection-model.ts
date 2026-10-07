import type { ReactNode } from 'react'

export interface DataTableViewSelection<T> {
  selectedIds: readonly string[]
  onChange: (ids: string[]) => void
  /** Return a localized reason to prevent selection. Permissions remain server-owned. */
  unavailableReason?: (row: T) => string | undefined
  actions?: (selection: DataTableViewSelectionResult<T>) => ReactNode
}

export interface DataTableViewSelectionResult<T> {
  selectedIds: readonly string[]
  /** Only records supplied by the host; not a complete server-side selection. */
  selectedRows: readonly T[]
  pageSelected: boolean
  pagePartiallySelected: boolean
  eligiblePageCount: number
  isSelected: (row: T) => boolean
  unavailableReason: (row: T) => string | undefined
  toggle: (row: T) => void
  togglePage: () => void
  clear: () => void
}

export const createDataTableSelection = <T>(
  rows: readonly T[], page: readonly T[], getId: (row: T) => string,
  selection: DataTableViewSelection<T> | undefined, disabled: boolean
): DataTableViewSelectionResult<T> | undefined => {
  if (!selection) return undefined

  const ids = Array.from(selection.selectedIds)

  if (ids.some(id => typeof id !== 'string' || !id.trim()) || new Set(ids).size !== ids.length)
    throw new TypeError('DataTableView selection requires unique, nonempty IDs.')

  const selected = new Set(ids)
  const reason = (row: T) => selection.unavailableReason?.(row)
  const eligible = page.filter(row => reason(row) === undefined).map(getId)
  const selectedOnPage = eligible.filter(id => selected.has(id)).length
  const pageSelected = eligible.length > 0 && selectedOnPage === eligible.length

  return {
    selectedIds: ids,
    selectedRows: rows.filter(row => selected.has(getId(row))),
    eligiblePageCount: eligible.length,
    pageSelected,
    pagePartiallySelected: selectedOnPage > 0 && !pageSelected,
    isSelected: row => selected.has(getId(row)),
    unavailableReason: reason,
    toggle: row => {
      if (disabled || reason(row) !== undefined || !page.some(item => getId(item) === getId(row))) return

      selection.onChange(selected.has(getId(row)) ? ids.filter(id => id !== getId(row)) : [...ids, getId(row)])
    },
    togglePage: () => {
      if (disabled) return

      const onPage = new Set(eligible)

      selection.onChange(pageSelected ? ids.filter(id => !onPage.has(id)) : [...new Set([...ids, ...eligible])])
    },
    clear: () => {
      if (!disabled) selection.onChange([])
    }
  }
}
