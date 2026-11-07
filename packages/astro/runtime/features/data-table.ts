import { initDataTableSorting } from '../controllers/data-table'
import { queryScope } from '../scope.js'

const getDataTableRows = (table: HTMLTableElement): HTMLTableRowElement[] => [
  ...(table.tBodies[0]?.rows ?? [])
]

const getDataTableRowValue = (row: HTMLTableRowElement): string => row.dataset.value ?? row.id

const syncDataTableSelection = (
  root: HTMLElement,
  table: HTMLTableElement,
  selectAll: HTMLInputElement,
  dispatch = false
): void => {
  const rows = getDataTableRows(table)
  const selectedValues: string[] = []

  rows.forEach(row => {
    const checkbox = row.querySelector<HTMLInputElement>('[data-ui-datatable-row-select]')
    const selected = checkbox?.checked === true

    row.setAttribute('aria-selected', String(selected))

    if (selected) {
      row.dataset.state = 'selected'

      selectedValues.push(getDataTableRowValue(row))
    } else {
      delete row.dataset.state
    }
  })

  selectAll.checked = rows.length > 0 && selectedValues.length === rows.length

  selectAll.indeterminate = selectedValues.length > 0 && selectedValues.length < rows.length

  const name = root.dataset.uiDatatableName
  let inputs = root.querySelector<HTMLElement>('[data-ui-datatable-inputs]')

  if (name) {
    if (!inputs) {
      inputs = document.createElement('div')

      inputs.hidden = true

      inputs.dataset.uiDatatableInputs = ''

      root.append(inputs)
    }

    inputs.replaceChildren(...selectedValues.map(value => {
      const input = document.createElement('input')

      input.type = 'hidden'

      input.name = name

      input.value = value

      return input
    }))
  } else {
    inputs?.replaceChildren()
  }

  if (dispatch) {
    const detail = { values: selectedValues }

    root.dispatchEvent(new CustomEvent('ui:data-table-selection-change', { bubbles: true, detail }))
  }
}

const initDataTableSelection = (root: HTMLElement, table: HTMLTableElement): void => {
  if (root.dataset.uiDatatableSelectable !== 'true' || root.dataset.uiDatatableSelectionBound === 'true') return

  const headRow = table.tHead?.rows[0]
  const body = table.tBodies[0]

  if (!headRow || !body) return

  root.dataset.uiDatatableSelectionBound = 'true'

  const headerCell = document.createElement('th')
  const selectAll = document.createElement('input')

  headerCell.className = 'ui-data-table__selection'

  headerCell.scope = 'col'

  selectAll.type = 'checkbox'

  selectAll.className = 'ui-data-table__checkbox'

  selectAll.dataset.uiDatatableSelectAll = ''

  selectAll.setAttribute('aria-label', 'Select all rows')

  headerCell.append(selectAll)

  headRow.prepend(headerCell)

  getDataTableRows(table).forEach((row, index) => {
    row.dataset.uiDatatableRow = ''

    row.dataset.value = getDataTableRowValue(row)

    const cell = document.createElement('td')
    const checkbox = document.createElement('input')
    const selected = row.dataset.state === 'selected' || row.getAttribute('aria-selected') === 'true'

    cell.className = 'ui-data-table__selection'

    checkbox.type = 'checkbox'

    checkbox.className = 'ui-data-table__checkbox'

    checkbox.dataset.uiDatatableRowSelect = ''

    checkbox.checked = selected

    checkbox.defaultChecked = selected

    checkbox.setAttribute('aria-label', `Select row ${index + 1}`)

    checkbox.addEventListener('change', () => {
      syncDataTableSelection(root, table, selectAll, true)
    })

    cell.append(checkbox)

    row.prepend(cell)
  })

  selectAll.addEventListener('change', () => {
    for (const checkbox of table.querySelectorAll<HTMLInputElement>('[data-ui-datatable-row-select]')) {
      checkbox.checked = selectAll.checked
    }

    syncDataTableSelection(root, table, selectAll, true)
  })

  root.closest('form')?.addEventListener('reset', () => {
    window.setTimeout(() => {
      syncDataTableSelection(root, table, selectAll, true)
    })
  })

  syncDataTableSelection(root, table, selectAll)
}

const bindDataTables = (root: HTMLElement): void => {
  if (root.dataset.uiBound === 'true') return

  const table = root.querySelector<HTMLTableElement>('table')

  if (!table) return

  root.dataset.uiBound = 'true'

  initDataTableSelection(root, table)

  initDataTableSorting(root, table)
}

export const initDataTables = (scope: ParentNode): void => {
  for (const root of queryScope(scope, '[data-ui-datatable]')) bindDataTables(root)
}
