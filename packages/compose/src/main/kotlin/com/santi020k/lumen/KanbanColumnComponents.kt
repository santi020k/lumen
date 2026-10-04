package com.santi020k.lumen

import androidx.compose.foundation.gestures.detectDragGesturesAfterLongPress
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.heightIn
import androidx.compose.runtime.Composable
import androidx.compose.runtime.key
import androidx.compose.runtime.remember
import androidx.compose.runtime.mutableStateMapOf
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.boundsInRoot
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp

@Composable
fun LumenKanbanColumn(
    column: LumenKanbanColumnData,
    onColumnChange: (LumenKanbanColumnData) -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    readOnly: Boolean = false,
    loading: Boolean = false,
    error: String? = null,
    onAdd: (() -> Unit)? = null,
    onCardPress: ((String) -> Unit)? = null,
    addLabel: String = "Add card",
    loadingLabel: String = "Loading",
    emptyLabel: String = "No cards",
    invalidLabel: String = "Invalid column data",
    formatCount: (Int, Int?) -> String = { count, capacity -> if (capacity == null) "$count cards" else "$count of $capacity cards" },
    formatMove: (String, Int) -> String = { card, position -> "Move $card to position $position" },
    formatOpen: (String) -> String = { "Open $it" },
    cardContent: @Composable (LumenKanbanCard) -> Unit = { LumenText(it.label) }
) {
    val model = LumenKanbanModel(listOf(column))
    val bounds = remember { mutableStateMapOf<String, Rect>() }
    val interactive = enabled && !readOnly && !column.disabled && !loading && error == null
    fun move(id: String, index: Int) {
        if (!interactive) return
        val next = model.moving(id, column.id, index)?.firstOrNull() ?: return
        onColumnChange(next)
    }
    val status = when { loading -> loadingLabel; error != null -> error; !model.valid -> invalidLabel; else -> null }
    Column(modifier.heightIn(min = 88.dp).onGloballyPositioned { bounds["column:${column.id}"] = it.boundsInRoot() }
        .semantics { contentDescription = column.label }, verticalArrangement = Arrangement.spacedBy(LumenSpacing.Md)) {
        LumenText(column.label, modifier = Modifier.semantics { heading() })
        if (status != null) LumenText(status, modifier = Modifier.semantics { liveRegion = LiveRegionMode.Polite })
        else {
            LumenText(formatCount(column.cards.size, column.capacity))
            if (column.cards.isEmpty()) LumenText(emptyLabel)
            column.cards.forEachIndexed { index, card -> key(card.id) {
                val movable = interactive && !card.disabled
                val drag = Modifier.onGloballyPositioned { bounds["card:${card.id}"] = it.boundsInRoot() }
                    .pointerInput(column, movable) {
                        if (!movable) return@pointerInput
                        var position = Offset.Zero
                        detectDragGesturesAfterLongPress(
                            onDragStart = { position = (bounds["card:${card.id}"]?.topLeft ?: Offset.Zero) + it },
                            onDrag = { change, amount -> change.consume(); position += amount },
                            onDragEnd = {
                                if (bounds["column:${column.id}"]?.contains(position) == true) {
                                    val remaining = column.cards.filter { it.id != card.id }
                                    val before = remaining.indexOfFirst { candidate -> bounds["card:${candidate.id}"]?.let { position.y < it.center.y } == true }
                                    move(card.id, if (before < 0) remaining.size else before)
                                }
                            }
                        )
                    }
                Column(drag, verticalArrangement = Arrangement.spacedBy(LumenSpacing.Xs)) {
                    LumenCard(padding = LumenSurfacePadding.Md) { cardContent(card) }
                    if (onCardPress != null) LumenButton(enabled = enabled && !column.disabled && !card.disabled,
                        onClick = { if (enabled && !column.disabled && !card.disabled) onCardPress(card.id) }) { LumenText(formatOpen(card.label)) }
                    listOf(index - 1, index + 1).forEach { position ->
                        LumenButton(enabled = movable && model.moving(card.id, column.id, position) != null,
                            onClick = { if (movable) move(card.id, position) }) { LumenText(formatMove(card.label, position + 1)) }
                    }
                }
            } }
            if (onAdd != null) {
                val canAdd = interactive && (column.capacity == null || column.cards.size < column.capacity)
                LumenButton(enabled = canAdd, onClick = { if (canAdd) onAdd() }) { LumenText(addLabel) }
            }
        }
    }
}
