import { type LumenTableCell, type LumenTableColumn, validateLumenTable } from './table-recipes.js'
import { LumenTreeModel, type LumenTreeNode, type LumenTreeRow } from './tree-recipes.js'

export type LumenTreeGridColumn = Pick<LumenTableColumn, 'key' | 'label'>
export interface LumenTreeGridRecord {
  node: LumenTreeNode
  cells: Readonly<Record<string, LumenTableCell>>
}
export interface LumenTreeGridRow { tree: LumenTreeRow, record: LumenTreeGridRecord }

const hasText = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0

const validCells = (cells: unknown): boolean => {
  if (typeof cells !== 'object' || cells === null || Array.isArray(cells)) return false

  return Object.values(cells).every((cell: unknown) => typeof cell === 'object' && cell !== null &&
    'text' in cell && Object.hasOwn(cell, 'text') && typeof cell.text === 'string')
}

const isRecord = function (value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

const validColumn = function (value: unknown): value is LumenTreeGridColumn {
  return isRecord(value) && hasText(value.key) && hasText(value.label)
}

const validRecord = (value: unknown): value is LumenTreeGridRecord => {
  if (!isRecord(value) || !isRecord(value.node)) return false

  return hasText(value.node.id) && hasText(value.node.label) && validCells(value.cells)
}

const validColumns = (value: unknown): value is readonly LumenTreeGridColumn[] => {
  if (!Array.isArray(value)) return false

  for (const column of value as readonly unknown[]) if (!validColumn(column)) return false

  return true
}

const validRecords = (value: unknown): value is readonly LumenTreeGridRecord[] => {
  if (!Array.isArray(value)) return false

  for (const record of value as readonly unknown[]) if (!validRecord(record)) return false

  return true
}

/** Joins host cells to the existing validated flat tree without changing host state. */
export class LumenTreeGridModel {
  readonly valid: boolean
  readonly #tree: LumenTreeModel
  readonly #records: ReadonlyMap<string, LumenTreeGridRecord>

  constructor(columns: readonly LumenTreeGridColumn[], records: readonly LumenTreeGridRecord[]) {
    this.#tree = new LumenTreeModel([])

    this.#records = new Map()

    this.valid = false

    if (!validColumns(columns) || !validRecords(records)) return

    this.#tree = new LumenTreeModel(records.map(record => record.node))

    this.#records = new Map(records.map(record => [record.node.id, record]))

    const rows = records.map(record => ({ ...record.node, cells: record.cells }))

    this.valid = this.#tree.valid && columns.length > 0 && validateLumenTable(columns, rows)
  }

  visibleRows(expandedIds: ReadonlySet<string>): readonly LumenTreeGridRow[] {
    if (!this.valid) return []

    return this.#tree.visibleRows(expandedIds).flatMap(tree => {
      const record = this.#records.get(tree.node.id)

      return record ? [{ tree, record }] : []
    })
  }

  togglingExpansion(id: string, expandedIds: ReadonlySet<string>): Set<string> {
    return this.valid ? this.#tree.togglingExpansion(id, expandedIds) : new Set(expandedIds)
  }
}
