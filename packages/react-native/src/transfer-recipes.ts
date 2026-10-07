export interface LumenTransferItem { id: string, label: string, detail?: string, disabled?: boolean }
export interface LumenTransferValue { selectedIds: readonly string[], checkedIds: readonly string[] }
export type LumenTransferSide = 'source' | 'target'
export interface LumenTransferLists {
  source: readonly LumenTransferItem[]
  target: readonly LumenTransferItem[]
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)
const optionalBoolean = (value: unknown): boolean => value === undefined || typeof value === 'boolean'
const optionalString = (value: unknown): boolean => value === undefined || typeof value === 'string'

const validItem = (value: unknown): value is LumenTransferItem => {
  if (!isRecord(value) || typeof value.id !== 'string' || typeof value.label !== 'string') return false

  return optionalString(value.detail) && optionalBoolean(value.disabled)
}

const validIds = (ids: readonly string[]): boolean => {
  if (!Array.isArray(ids)) return false

  const seen = new Set<string>()

  for (const id of ids as readonly unknown[]) {
    if (typeof id !== 'string' || id.trim().length === 0 || seen.has(id)) return false

    seen.add(id)
  }

  return true
}

export const isLumenTransferItemsValid = (items: readonly LumenTransferItem[]): boolean => {
  if (!Array.isArray(items)) return false

  const ids: string[] = []

  for (const item of items as readonly unknown[]) {
    if (!validItem(item)) return false

    ids.push(item.id)
  }

  return validIds(ids)
}
export const isLumenTransferValueValid = (value: LumenTransferValue): boolean => {
  if (!isRecord(value)) return false

  return validIds(value.selectedIds) && validIds(value.checkedIds)
}

export const lumenTransferLists = (
  items: readonly LumenTransferItem[], value: LumenTransferValue
): LumenTransferLists | null => {
  if (!isLumenTransferItemsValid(items) || !isLumenTransferValueValid(value)) return null

  const selected = new Set(value.selectedIds)

  return { source: items.filter(item => !selected.has(item.id)), target: items.filter(item => selected.has(item.id)) }
}
export const toggleLumenTransferItem = (
  items: readonly LumenTransferItem[], value: LumenTransferValue, id: string, checked: boolean
): LumenTransferValue | null => {
  if (!lumenTransferLists(items, value)) return null

  const item = items.find(input => input.id === id)

  if (!item || item.disabled) return null

  if (value.checkedIds.includes(id) === checked) return null

  const checkedIds = value.checkedIds.filter(key => key !== id)

  if (checked) checkedIds.push(id)

  return { selectedIds: [...value.selectedIds], checkedIds }
}
export const moveLumenTransferItems = (
  items: readonly LumenTransferItem[], value: LumenTransferValue, to: LumenTransferSide
): LumenTransferValue | null => {
  const lists = lumenTransferLists(items, value)

  if (!lists) return null

  const checked = new Set(value.checkedIds)
  const candidates = to === 'target' ? lists.source : lists.target
  const moved = candidates.filter(item => !item.disabled && checked.has(item.id)).map(item => item.id)

  if (moved.length === 0) return null

  const movedSet = new Set(moved)

  const selectedIds = to === 'target' ?
    [...value.selectedIds, ...moved] :
    value.selectedIds.filter(id => !movedSet.has(id))

  return { selectedIds, checkedIds: value.checkedIds.filter(id => !movedSet.has(id)) }
}
