export type LumenKanbanMoveInput = 'keyboard' | 'pointer'

export interface LumenKanbanMoveDetail {
  beforeId?: string
  fromColumn: string
  input: LumenKanbanMoveInput
  itemId: string
  toColumn: string
}

export const createLumenKanbanMoveDetail = ({
  beforeId,
  fromColumn,
  input,
  itemId,
  toColumn
}: LumenKanbanMoveDetail): LumenKanbanMoveDetail | null => {
  const normalizedItemId = itemId.trim()
  const normalizedFromColumn = fromColumn.trim()
  const normalizedToColumn = toColumn.trim()
  const normalizedBeforeId = beforeId?.trim()

  if (!normalizedItemId || !normalizedFromColumn || !normalizedToColumn)
    return null

  return {
    ...(normalizedBeforeId ? { beforeId: normalizedBeforeId } : {}),
    fromColumn: normalizedFromColumn,
    input,
    itemId: normalizedItemId,
    toColumn: normalizedToColumn
  }
}

export const getAdjacentKanbanColumn = (
  columns: readonly string[],
  currentColumn: string,
  direction: -1 | 1,
  rightToLeft = false
): string | undefined => {
  const currentIndex = columns.indexOf(currentColumn)

  if (currentIndex < 0) return undefined

  const effectiveDirection = rightToLeft ? -direction : direction
  const nextIndex = currentIndex + effectiveDirection

  return columns[nextIndex]
}
