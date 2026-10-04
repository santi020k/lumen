package com.santi020k.lumen

data class LumenTreeNode(
    val id: String,
    val label: String,
    val parentId: String? = null,
    val disabled: Boolean = false,
    val selectable: Boolean = true
)
data class LumenTreeRow(val node: LumenTreeNode, val depth: Int, val hasChildren: Boolean, val disabled: Boolean)

/** Flat single-parent graph. Validation and all traversals are iterative. */
class LumenTreeModel(nodes: List<LumenTreeNode>) {
    private val byId = nodes.associateBy { it.id }
    private val children = nodes.groupBy { it.parentId }
    private val disabledIds = mutableSetOf<String>()
    val valid: Boolean
    init {
        val stack = java.util.ArrayDeque<LumenTreeNode>()
        childrenOf(null).forEach { stack.addLast(it) }
        val visited = mutableSetOf<String>()
        var reachable = true
        while (stack.isNotEmpty()) {
            val node = stack.removeLast()
            if (!visited.add(node.id)) { reachable = false; break }
            if (node.disabled || node.parentId in disabledIds) disabledIds.add(node.id)
            childrenOf(node.id).forEach { stack.addLast(it) }
        }
        valid = reachable && byId.size == nodes.size && nodes.none { it.id.isEmpty() } && visited.size == nodes.size
    }
    fun node(id: String): LumenTreeNode? = byId[id]
    fun childrenOf(parentId: String?): List<LumenTreeNode> = children[parentId].orEmpty()
    fun isDisabled(id: String): Boolean = id in disabledIds
    fun path(id: String): List<LumenTreeNode> {
        if (!valid) return emptyList()
        val result = mutableListOf<LumenTreeNode>()
        var current = node(id)
        while (current != null) { result.add(current); current = current.parentId?.let { node(it) } }
        return result.asReversed()
    }
    fun visibleRows(expandedIds: Set<String>): List<LumenTreeRow> {
        if (!valid) return emptyList()
        val stack = java.util.ArrayDeque<Pair<LumenTreeNode, Int>>()
        childrenOf(null).asReversed().forEach { stack.addLast(it to 0) }
        val result = mutableListOf<LumenTreeRow>()
        while (stack.isNotEmpty()) {
            val (node, depth) = stack.removeLast()
            val children = childrenOf(node.id)
            result.add(LumenTreeRow(node, depth, children.isNotEmpty(), isDisabled(node.id)))
            if (node.id in expandedIds) children.asReversed().forEach { stack.addLast(it to depth + 1) }
        }
        return result
    }
    fun togglingExpansion(id: String, expandedIds: Set<String>): Set<String> =
        if (!valid || isDisabled(id) || childrenOf(id).isEmpty()) expandedIds
        else toggle(id, expandedIds)
    fun togglingSelection(id: String, selectedIds: Set<String>): Set<String> =
        if (!valid || isDisabled(id) || node(id)?.selectable != true) selectedIds
        else toggle(id, selectedIds)
    private fun toggle(id: String, ids: Set<String>): Set<String> =
        LinkedHashSet(ids).apply { if (!remove(id)) add(id) }
}
