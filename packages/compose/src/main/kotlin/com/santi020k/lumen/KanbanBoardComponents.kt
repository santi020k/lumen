package com.santi020k.lumen

import androidx.compose.foundation.gestures.detectDragGesturesAfterLongPress
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.width
import androidx.compose.runtime.Composable
import androidx.compose.runtime.key
import androidx.compose.runtime.remember
import androidx.compose.runtime.mutableStateMapOf
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.boundsInRoot
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp

@Composable
fun LumenKanbanBoard(
    label: String,
    columns: List<LumenKanbanColumnData>,
    onColumnsChange: (List<LumenKanbanColumnData>) -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    readOnly: Boolean = false,
    loading: Boolean = false,
    error: String? = null,
    loadingLabel: String = "Loading",
    emptyLabel: String = "No cards",
    invalidLabel: String = "Invalid board data",
    formatMove: (String, String, Int) -> String = { card, column, position -> "Move $card to $column, position $position" },
    cardContent: @Composable (LumenKanbanCard) -> Unit = { LumenText(it.label) }
) {
    val model = LumenKanbanModel(columns)
    val columnBounds = remember { mutableStateMapOf<String, Rect>() }
    val cardBounds = remember { mutableStateMapOf<String, Rect>() }
    val interactive = enabled && !readOnly && !loading && error == null
    Column(modifier.semantics { contentDescription = label }, verticalArrangement = Arrangement.spacedBy(LumenSpacing.Md)) {
        LumenText(label, modifier = Modifier.semantics { heading() })
        val status = when { loading -> loadingLabel; error != null -> error; !model.valid -> invalidLabel; columns.isEmpty() -> emptyLabel; else -> null }
        if (status != null) LumenText(status, modifier = Modifier.semantics { liveRegion = LiveRegionMode.Polite })
        else Row(Modifier.horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(LumenSpacing.Md)) {
            columns.forEach { column -> key(column.id) {
                Column(Modifier.width(272.dp).heightIn(min = 88.dp).onGloballyPositioned { columnBounds[column.id] = it.boundsInRoot() }.padding(LumenSpacing.Md), verticalArrangement = Arrangement.spacedBy(LumenSpacing.Md)) {
                    LumenText(column.label, modifier = Modifier.semantics { heading() })
                    if (column.cards.isEmpty()) LumenText(emptyLabel)
                    column.cards.forEachIndexed { index, card -> key(card.id) {
                        val movable = interactive && !card.disabled && !column.disabled
                        val dragModifier = Modifier.onGloballyPositioned { cardBounds[card.id] = it.boundsInRoot() }
                            .pointerInput(columns, movable) {
                                if (!movable) return@pointerInput
                                var position = Offset.Zero
                                detectDragGesturesAfterLongPress(
                                    onDragStart = { offset -> position = (cardBounds[card.id]?.topLeft ?: Offset.Zero) + offset },
                                    onDrag = { change, amount -> if (movable) { change.consume(); position += amount } },
                                    onDragEnd = {
                                        if (movable) {
                                            val target = columns.find { columnBounds[it.id]?.contains(position) == true }
                                            if (target != null) {
                                                val remaining = target.cards.filter { it.id != card.id }
                                                val before = remaining.indexOfFirst { candidate ->
                                                    cardBounds[candidate.id]?.let { position.y < it.center.y } == true
                                                }
                                                val next = model.moving(card.id, target.id, if (before < 0) remaining.size else before)
                                                if (next != null) onColumnsChange(next)
                                            }
                                        }
                                    }
                                )
                            }
                        Column(dragModifier, verticalArrangement = Arrangement.spacedBy(LumenSpacing.Xs)) {
                            LumenCard(padding = LumenSurfacePadding.Md) { cardContent(card) }
                            columns.forEach { target ->
                                val positions = if (target.id == column.id) listOf(index - 1, index + 1) else listOf(target.cards.size)
                                positions.forEach { position ->
                                    val next = model.moving(card.id, target.id, position)
                                    LumenButton(onClick = { if (interactive && next != null) onColumnsChange(next) }, enabled = interactive && next != null) {
                                        LumenText(formatMove(card.label, target.label, position + 1))
                                    }
                                }
                            }
                        }
                    } }
                }
            } }
        }
    }
}
