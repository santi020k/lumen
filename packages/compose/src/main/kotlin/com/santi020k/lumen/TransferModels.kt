package com.santi020k.lumen

data class LumenTransferItem(val id: String, val label: String, val detail: String? = null, val disabled: Boolean = false)
data class LumenTransferValue(val selectedIds: List<String> = emptyList(), val checkedIds: List<String> = emptyList())
enum class LumenTransferSide { Source, Target }
data class LumenTransferLists(val source: List<LumenTransferItem>, val target: List<LumenTransferItem>)
private fun validTransferIds(ids: List<String>): Boolean = ids.none { it.isBlank() } && ids.toSet().size == ids.size
fun isLumenTransferItemsValid(items: List<LumenTransferItem>): Boolean = validTransferIds(items.map { it.id })
fun isLumenTransferValueValid(value: LumenTransferValue): Boolean = validTransferIds(value.selectedIds) && validTransferIds(value.checkedIds)
fun lumenTransferLists(items: List<LumenTransferItem>, value: LumenTransferValue): LumenTransferLists? {
    if (!isLumenTransferItemsValid(items) || !isLumenTransferValueValid(value)) return null
    val selected = value.selectedIds.toSet()
    return LumenTransferLists(items.filter { it.id !in selected }, items.filter { it.id in selected })
}
fun toggleLumenTransferItem(items: List<LumenTransferItem>, value: LumenTransferValue, id: String, checked: Boolean): LumenTransferValue? {
    if (lumenTransferLists(items, value) == null) return null
    val item = items.firstOrNull { it.id == id } ?: return null
    if (item.disabled || (id in value.checkedIds) == checked) return null
    val checks = value.checkedIds.filter { it != id } + if (checked) listOf(id) else emptyList()
    return LumenTransferValue(value.selectedIds.toList(), checks)
}
fun moveLumenTransferItems(items: List<LumenTransferItem>, value: LumenTransferValue, to: LumenTransferSide): LumenTransferValue? {
    val lists = lumenTransferLists(items, value) ?: return null
    val checked = value.checkedIds.toSet()
    val candidates = if (to == LumenTransferSide.Target) lists.source else lists.target
    val moved = candidates.filter { !it.disabled && it.id in checked }.map { it.id }
    if (moved.isEmpty()) return null
    val movedSet = moved.toSet()
    val selected = if (to == LumenTransferSide.Target) value.selectedIds + moved else value.selectedIds.filter { it !in movedSet }
    return LumenTransferValue(selected, value.checkedIds.filter { it !in movedSet })
}
