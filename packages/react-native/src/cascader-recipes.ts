import { LumenTreeModel, type LumenTreeNode } from './tree-recipes.js'

const isPath = (value: unknown): value is readonly string[] => {
  if (!Array.isArray(value)) return false

  for (const id of value as readonly unknown[]) if (typeof id !== 'string') return false

  return true
}

/** Leaf-only selection over the shared validated tree graph. */
export class LumenCascaderModel {
  readonly tree: LumenTreeModel
  constructor(nodes: readonly LumenTreeNode[]) {
    this.tree = new LumenTreeModel(nodes)
  }

  canSelect(id: string): boolean {
    const node = this.tree.node(id)

    return this.tree.valid && Boolean(node) && node?.selectable !== false &&
      !this.tree.isDisabled(id) && this.tree.childrenOf(id).length === 0
  }

  isPathValid(path: readonly string[]): boolean {
    if (!isPath(path)) return false

    const last = path.at(-1)

    if (!last) return path.length === 0 && this.tree.valid

    const canonical = this.tree.path(last)

    return canonical.length === path.length && canonical.every((node, index) => node.id === path[index])
  }

  selecting(id: string, current: readonly string[]): readonly string[] {
    return this.canSelect(id) ? this.tree.path(id).map(node => node.id) : current
  }
}
