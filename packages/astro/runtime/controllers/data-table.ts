/* cspell:ignore Datatable datatable */
const nextSortDirection = (current: string | null): 'ascending' | 'descending' | 'none' => {
  if (current === 'ascending') return 'descending'

  if (current === 'descending') return 'none'

  return 'ascending'
}

const getDataTableSortValue = (
  cell: HTMLTableCellElement | undefined
): string => cell?.dataset.sortValue ?? cell?.textContent.trim() ?? ''

const compareDataTableValues = (value: string, other: string, sortType: string | undefined): number => {
  const numericValue = Number(value.replaceAll(',', ''))
  const numericOther = Number(other.replaceAll(',', ''))

  const useNumeric = sortType === 'number' || (
    sortType !== 'string' &&
    value.trim() !== '' &&
    other.trim() !== '' &&
    Number.isFinite(numericValue) &&
    Number.isFinite(numericOther)
  )

  if (useNumeric) {
    return numericValue - numericOther
  }

  return value.localeCompare(other, undefined, { numeric: true, sensitivity: 'base' })
}

const sortDataTableRows = (
  table: HTMLTableElement,
  header: HTMLTableCellElement,
  columnIndex: number,
  direction: 'ascending' | 'descending' | 'none'
): void => {
  const body = table.tBodies[0]

  if (!body) return

  const rows = [...body.rows]
  const sortType = header.dataset.uiDatatableSortType

  rows.sort((row, other) => {
    if (direction === 'none') {
      return Number(row.dataset.uiDatatableIndex ?? '0') - Number(other.dataset.uiDatatableIndex ?? '0')
    }

    const result = compareDataTableValues(
      getDataTableSortValue(row.cells[columnIndex]), getDataTableSortValue(other.cells[columnIndex]), sortType
    )

    return (direction === 'ascending' ? result : -result) ||
      Number(row.dataset.uiDatatableIndex ?? '0') - Number(other.dataset.uiDatatableIndex ?? '0')
  })

  rows.forEach(row => {
    body.append(row)
  })
}

const updateDataTableSort = (
  root: HTMLElement,
  table: HTMLTableElement,
  header: HTMLTableCellElement,
  direction: 'ascending' | 'descending' | 'none'
): void => {
  for (const item of table.querySelectorAll<HTMLTableCellElement>('thead th[aria-sort]')) {
    item.setAttribute('aria-sort', item === header ? direction : 'none')

    item.dataset.sort = item === header ? direction : 'none'
  }

  root.dataset.uiDatatableSortDirection = direction

  if (direction === 'none') {
    delete root.dataset.uiDatatableSortColumn
  } else {
    root.dataset.uiDatatableSortColumn = header.dataset.uiDatatableColumn ?? ''
  }
}

export const initDataTableSorting = (root: HTMLElement, table: HTMLTableElement): void => {
  const headers = [...table.querySelectorAll<HTMLTableCellElement>('thead th')].filter(
    header => header.dataset.uiDatatableSortable === 'true' ||
      header.dataset.sortable === 'true' ||
      header.hasAttribute('data-sortable')
  )

  for (const header of headers) {
    if (header.dataset.uiDatatableSortBound === 'true') continue

    const row = header.parentElement
    const columnIndex = row ? [...row.children].indexOf(header) : -1

    if (columnIndex < 0) continue

    header.dataset.uiDatatableSortBound = 'true'

    header.dataset.uiDatatableColumn = String(columnIndex)

    header.setAttribute('aria-sort', header.getAttribute('aria-sort') ?? 'none')

    const button = document.createElement('button')

    button.type = 'button'

    button.className = 'ui-data-table__sort'

    button.dataset.uiDatatableSort = ''

    while (header.firstChild) {
      button.append(header.firstChild)
    }

    header.append(button)

    button.addEventListener('click', () => {
      const currentDirection = header.getAttribute('aria-sort')
      const nextDirection = nextSortDirection(currentDirection)

      updateDataTableSort(root, table, header, nextDirection)

      if (root.dataset.uiDatatableSortMode !== 'manual') sortDataTableRows(table, header, columnIndex, nextDirection)

      root.dispatchEvent(new CustomEvent('ui:data-table-sort-change', {
        bubbles: true,
        detail: { key: header.dataset.uiDatatableSortKey ?? String(columnIndex), columnIndex, direction: nextDirection }
      }))
    })
  }

  const body = table.tBodies[0]

  if (!body) return

  ;[...body.rows].forEach((row, index) => {
    row.dataset.uiDatatableIndex = row.dataset.uiDatatableIndex ?? String(index)
  })
}
