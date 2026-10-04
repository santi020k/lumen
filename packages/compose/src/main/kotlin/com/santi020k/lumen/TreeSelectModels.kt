package com.santi020k.lumen

class LumenTreeSelectModel(nodes: List<LumenTreeNode>) {
    val tree = LumenTreeModel(nodes)
    val valid = tree.valid && nodes.all { it.id.isNotBlank() }
    val rows = if (valid) tree.visibleRows(nodes.map { it.id }.toSet()) else emptyList()
    fun canSelect(id: String): Boolean = valid && tree.node(id)?.selectable == true && !tree.isDisabled(id)
    fun selecting(id: String, current: String?): String? = if (canSelect(id)) id else current
    fun selectionLabel(value: String?, placeholder: String, unknownLabel: String): String = when {
        value == null -> placeholder
        !valid -> unknownLabel
        else -> tree.node(value)?.label ?: unknownLabel
    }
}
