export interface LumenCommandItem {
  id: string
  label: string
  detail?: string
  keywords?: readonly string[]
  shortcut?: string
  disabled?: boolean
}
export interface LumenCommandGroup { id: string, label: string, items: readonly LumenCommandItem[] }
export type LumenCommandNavigation = 'next' | 'previous' | 'first' | 'last'
export const isLumenCommandGroupsValid = (groups: readonly LumenCommandGroup[]): boolean => {
  const groupIds = new Set<string>()
  const itemIds = new Set<string>()

  return groups.every(group => {
    if (group.id.trim().length === 0 || groupIds.has(group.id)) return false

    groupIds.add(group.id)

    return group.items.every(item => {
      if (item.id.trim().length === 0 || itemIds.has(item.id)) return false

      itemIds.add(item.id)

      return true
    })
  })
}

const commandMatches = (item: LumenCommandItem, query: string): boolean => [item.label || item.id, item.detail ?? '', item.shortcut ?? '', ...(item.keywords ?? [])]
  .some(text => text.toLowerCase().includes(query))

export const lumenCommandGroups = (
  groups: readonly LumenCommandGroup[], query: string
): readonly LumenCommandGroup[] | null => {
  if (!isLumenCommandGroupsValid(groups)) return null

  const search = query.trim().toLowerCase()

  return groups.map(group => ({ ...group, items: group.items.filter(item => commandMatches(item, search)) }))
    .filter(group => group.items.length > 0)
}
export const resolveLumenCommandActive = (
  groups: readonly LumenCommandGroup[], query: string, activeId: string | null
): LumenCommandItem | null => {
  const filtered = lumenCommandGroups(groups, query)

  if (!filtered || activeId === null) return null

  return filtered.flatMap(group => group.items).find(item => item.id === activeId && !item.disabled) ?? null
}

const enabledCommands = (groups: readonly LumenCommandGroup[], query: string): readonly LumenCommandItem[] => {
  const filtered = lumenCommandGroups(groups, query)

  if (!filtered) return []

  return filtered.flatMap(group => group.items).filter(item => !item.disabled)
}

const boundaryCommand = (items: readonly LumenCommandItem[], direction: LumenCommandNavigation): string | null => {
  const item = direction === 'next' || direction === 'first' ? items[0] : items.at(-1)

  return item?.id ?? null
}

export const moveLumenCommandActive = (
  groups: readonly LumenCommandGroup[], query: string, activeId: string | null, direction: LumenCommandNavigation
): string | null => {
  const items = enabledCommands(groups, query)

  if (items.length === 0) return null

  if (direction === 'first') return boundaryCommand(items, direction)

  if (direction === 'last') return boundaryCommand(items, direction)

  const index = items.findIndex(item => item.id === activeId)

  if (index < 0) return boundaryCommand(items, direction)

  const delta = direction === 'next' ? 1 : -1

  return items[(index + delta + items.length) % items.length]?.id ?? null
}
