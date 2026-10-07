export interface LumenKanbanCard {
  id: string
  label: string
  disabled?: boolean | undefined
}

export interface LumenKanbanColumnData {
  id: string
  label: string
  cards: readonly LumenKanbanCard[]
  capacity?: number | undefined
  disabled?: boolean | undefined
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)
const optionalBoolean = (value: unknown): boolean => value === undefined || typeof value === 'boolean'

const validCard = (value: unknown): value is LumenKanbanCard => {
  if (!isRecord(value) || typeof value.id !== 'string' || typeof value.label !== 'string') return false

  return optionalBoolean(value.disabled)
}

const validColumn = (value: unknown): value is LumenKanbanColumnData => {
  if (!isRecord(value) || typeof value.id !== 'string' || typeof value.label !== 'string' || !Array.isArray(value.cards)) return false

  if (!optionalBoolean(value.disabled) || (value.capacity !== undefined && typeof value.capacity !== 'number')) return false

  for (const card of value.cards as readonly unknown[]) if (!validCard(card)) return false

  return true
}

const validColumns = (value: unknown): value is readonly LumenKanbanColumnData[] => {
  if (!Array.isArray(value)) return false

  for (const column of value as readonly unknown[]) if (!validColumn(column)) return false

  return true
}

/** Insertion indices refer to the destination after removal of the moving card. */
export class LumenKanbanModel {
  readonly valid: boolean
  readonly columns: readonly LumenKanbanColumnData[]

  constructor(columns: readonly LumenKanbanColumnData[]) {
    this.columns = []

    if (!validColumns(columns)) {
      this.valid = false

      return
    }

    this.columns = columns

    const columnIds = new Set<string>()
    const cardIds = new Set<string>()

    this.valid = columns.every(column => {
      if (!column.id.trim() || columnIds.has(column.id)) return false

      columnIds.add(column.id)

      if (column.capacity !== undefined) {
        if (!Number.isSafeInteger(column.capacity) || column.capacity < column.cards.length) return false
      }

      return column.cards.every((card: LumenKanbanCard) => {
        if (!card.id.trim() || cardIds.has(card.id)) return false

        cardIds.add(card.id)

        return true
      })
    })
  }

  private destination(cardId: string, toColumnId: string): {
    source: LumenKanbanColumnData
    target: LumenKanbanColumnData
    card: LumenKanbanCard
  } | null {
    const source = this.columns.find(column => column.cards.some(card => card.id === cardId))
    const target = this.columns.find(column => column.id === toColumnId)
    const card = source?.cards.find(candidate => candidate.id === cardId)

    if (!source || !target || !card) return null

    if (source.disabled || target.disabled || card.disabled) return null

    return { source, target, card }
  }

  moving(cardId: string, toColumnId: string, toIndex: number): readonly LumenKanbanColumnData[] | null {
    if (!this.valid || !Number.isSafeInteger(toIndex)) return null

    const destination = this.destination(cardId, toColumnId)

    if (!destination) return null

    const { source, target, card } = destination
    const targetCards = target.cards.filter(candidate => candidate.id !== cardId)
    const full = target.capacity !== undefined && targetCards.length >= target.capacity

    if (toIndex < 0 || toIndex > targetCards.length || full) return null

    if (source.id === target.id && source.cards.findIndex(candidate => candidate.id === cardId) === toIndex) return null

    targetCards.splice(toIndex, 0, card)

    return this.columns.map(column => {
      if (column.id === target.id) return { ...column, cards: targetCards }

      if (column.id === source.id) {
        return { ...column, cards: column.cards.filter(candidate => candidate.id !== cardId) }
      }

      return column
    })
  }
}
