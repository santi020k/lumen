import { LumenTreeModel, type LumenTreeNode, type LumenTreeRow } from './tree-recipes.js'

/** Single selection over the validated hierarchy; parent nodes are selectable. */
export class LumenTreeSelectModel {
  readonly tree: LumenTreeModel
  readonly rows: readonly LumenTreeRow[]
  readonly valid: boolean

  constructor(nodes: readonly LumenTreeNode[]) {
    this.tree = new LumenTreeModel(nodes)

    this.valid = this.tree.valid && nodes.every(node => node.id.trim().length > 0)

    this.rows = this.valid ? this.tree.visibleRows(new Set(nodes.map(node => node.id))) : []
  }

  canSelect(id: string): boolean {
    const node = this.tree.node(id)

    return this.valid && node !== undefined && !this.tree.isDisabled(id) && node.selectable !== false
  }

  selecting(id: string, current: string | null): string | null {
    return this.canSelect(id) ? id : current
  }

  selectionLabel(value: string | null, placeholder: string, unknownLabel: string): string {
    if (value === null) return placeholder

    if (!this.valid) return unknownLabel

    return this.tree.node(value)?.label ?? unknownLabel
  }
}
