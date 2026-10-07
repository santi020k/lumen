package com.santi020k.lumen

data class LumenKanbanCard(val id: String, val label: String, val disabled: Boolean = false)
data class LumenKanbanColumnData(val id: String, val label: String, val cards: List<LumenKanbanCard>, val capacity: Int? = null, val disabled: Boolean = false)

/** Destination index is measured after removing the moving card. */
class LumenKanbanModel(val columns: List<LumenKanbanColumnData>) {
    val valid: Boolean = run {
        val columnIds = mutableSetOf<String>()
        val cardIds = mutableSetOf<String>()
        columns.all { column ->
            column.id.isNotBlank() && columnIds.add(column.id) &&
                (column.capacity == null || column.capacity >= column.cards.size) &&
                column.cards.all { it.id.isNotBlank() && cardIds.add(it.id) }
        }
    }
    fun moving(cardId: String, toColumnId: String, toIndex: Int): List<LumenKanbanColumnData>? {
        if (!valid) return null
        val source = columns.find { column -> column.cards.any { it.id == cardId } } ?: return null
        val target = columns.find { it.id == toColumnId } ?: return null
        val card = source.cards.find { it.id == cardId } ?: return null
        if (source.disabled || target.disabled || card.disabled) return null
        val destination = target.cards.filter { it.id != cardId }.toMutableList()
        if (toIndex !in 0..destination.size || (target.capacity != null && destination.size >= target.capacity)) return null
        if (source.id == target.id && source.cards.indexOf(card) == toIndex) return null
        destination.add(toIndex, card)
        return columns.map { column -> when (column.id) {
            target.id -> column.copy(cards = destination)
            source.id -> column.copy(cards = column.cards.filter { it.id != cardId })
            else -> column
        } }
    }
}
