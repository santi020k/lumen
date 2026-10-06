export interface LumenTreeNode {
  id: string
  label: string
  parentId?: string | null
  disabled?: boolean
  selectable?: boolean
}
export interface LumenTreeRow {
  node: LumenTreeNode
  depth: number
  hasChildren: boolean
  disabled: boolean
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)
const optionalBoolean = (value: unknown): boolean => value === undefined || typeof value === 'boolean'

const isTreeNode = (value: unknown): value is LumenTreeNode => {
  if (!isRecord(value) || typeof value.id !== 'string' || typeof value.label !== 'string') return false

  return (value.parentId == null || typeof value.parentId === 'string') &&
    optionalBoolean(value.disabled) && optionalBoolean(value.selectable)
}

const validNodes = (value: unknown): value is readonly LumenTreeNode[] => {
  if (!Array.isArray(value)) return false

  for (const node of value as readonly unknown[]) if (!isTreeNode(node)) return false

  return true
}

export const isLumenTreeIdSet = (value: unknown): value is ReadonlySet<string> => {
  try {
    const values: IterableIterator<unknown> = Set.prototype.values.call(value)

    for (const id of values) if (typeof id !== 'string') return false

    return true
  } catch {
    return false
  }
}

/** A flat, single-parent hierarchy with iterative validation and traversal. */
export class LumenTreeModel {
  readonly valid: boolean
  readonly #byId = new Map<string, LumenTreeNode>()
  readonly #children = new Map<string | null, LumenTreeNode[]>()
  readonly #disabled = new Set<string>()

  constructor(nodes: readonly LumenTreeNode[]) {
    if (!validNodes(nodes)) {
      this.valid = false

      return
    }

    let valid = true

    for (const node of nodes) {
      if (!node.id || this.#byId.has(node.id)) valid = false

      this.#byId.set(node.id, node)

      const parentId = node.parentId ?? null
      const siblings = this.#children.get(parentId) ?? []

      siblings.push(node)

      this.#children.set(parentId, siblings)
    }

    this.valid = valid && this.#validateParents(nodes) && this.#validateReachability(nodes.length)
  }

  #validateParents(nodes: readonly LumenTreeNode[]): boolean {
    return nodes.every(node => node.parentId == null || this.#byId.has(node.parentId))
  }

  #validateReachability(count: number): boolean {
    const stack = [...this.childrenOf(null)]
    const visited = new Set<string>()

    while (stack.length > 0) {
      const node = stack.pop()

      if (!node || visited.has(node.id)) return false

      visited.add(node.id)

      if (node.disabled || (node.parentId != null && this.#disabled.has(node.parentId))) this.#disabled.add(node.id)

      for (const child of this.childrenOf(node.id)) stack.push(child)
    }

    return visited.size === count
  }

  childrenOf(parentId: string | null): readonly LumenTreeNode[] {
    return this.#children.get(parentId) ?? []
  }

  node(id: string): LumenTreeNode | undefined {
    return this.#byId.get(id)
  }

  isDisabled(id: string): boolean {
    return this.#disabled.has(id)
  }

  path(id: string): readonly LumenTreeNode[] {
    if (!this.valid) return []

    const result: LumenTreeNode[] = []
    let node = this.node(id)

    while (node) {
      result.push(node)

      node = node.parentId == null ? undefined : this.node(node.parentId)
    }

    return result.reverse()
  }

  visibleRows(expandedIds: ReadonlySet<string>): readonly LumenTreeRow[] {
    if (!this.valid || !isLumenTreeIdSet(expandedIds)) return []

    const result: LumenTreeRow[] = []
    const stack = this.childrenOf(null).map(node => ({ node, depth: 0 })).reverse()

    while (stack.length > 0) {
      const entry = stack.pop()

      if (!entry) break

      const children = this.childrenOf(entry.node.id)

      result.push({ ...entry, hasChildren: children.length > 0, disabled: this.isDisabled(entry.node.id) })

      if (Set.prototype.has.call(expandedIds, entry.node.id)) {
        for (let index = children.length - 1; index >= 0; index -= 1) {
          const node = children[index]

          if (node) stack.push({ node, depth: entry.depth + 1 })
        }
      }
    }

    return result
  }

  togglingExpansion(id: string, expandedIds: ReadonlySet<string>): Set<string> {
    if (!isLumenTreeIdSet(expandedIds)) return new Set()

    const next = new Set<string>(Set.prototype.values.call(expandedIds))

    if (!this.valid || this.isDisabled(id) || this.childrenOf(id).length === 0) return next

    if (next.has(id)) next.delete(id)
    else next.add(id)

    return next
  }

  togglingSelection(id: string, selectedIds: ReadonlySet<string>): Set<string> {
    if (!isLumenTreeIdSet(selectedIds)) return new Set()

    const next = new Set(selectedIds)
    const node = this.node(id)

    if (!this.valid || !node || this.isDisabled(id) || node.selectable === false) return next

    if (next.has(id)) next.delete(id)
    else next.add(id)

    return next
  }
}
