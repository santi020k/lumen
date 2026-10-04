package com.santi020k.lumen

data class LumenTreeGridColumn(val key: String, val label: String)
data class LumenTreeGridRecord(val node: LumenTreeNode, val cells: Map<String, LumenTableCell>)
data class LumenTreeGridRow(val tree: LumenTreeRow, val record: LumenTreeGridRecord)

/** Cell records joined to the existing iterative flat-tree model. */
class LumenTreeGridModel(columns: List<LumenTreeGridColumn>, records: List<LumenTreeGridRecord>) {
    private val tree = LumenTreeModel(records.map { it.node })
    private val recordsById = records.associateBy { it.node.id }
    val valid: Boolean = tree.valid && columns.isNotEmpty() &&
        columns.all { it.key.isNotBlank() && it.label.isNotBlank() } &&
        records.all { it.node.id.isNotBlank() && it.node.label.isNotBlank() } &&
        LumenTableModel.isValid(columns.map { LumenTableColumn(it.key, it.label) },
            records.map { LumenTableRow(it.node.id, it.node.label, it.cells) })

    fun visibleRows(expandedIds: Set<String>): List<LumenTreeGridRow> =
        if (!valid) emptyList() else tree.visibleRows(expandedIds).mapNotNull { row ->
            recordsById[row.node.id]?.let { LumenTreeGridRow(row, it) }
        }
    fun togglingExpansion(id: String, expandedIds: Set<String>): Set<String> =
        if (valid) tree.togglingExpansion(id, expandedIds) else expandedIds
}
