package com.santi020k.lumen.playground.compose

import androidx.compose.foundation.layout.Column
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import com.santi020k.lumen.LumenCheckbox
import com.santi020k.lumen.LumenKanbanColumn
import com.santi020k.lumen.LumenKanbanCard
import com.santi020k.lumen.LumenKanbanColumnData
import com.santi020k.lumen.LumenText

@Composable
fun KanbanColumnParityExample() {
    var column by remember { mutableStateOf(LumenKanbanColumnData("todo", "To do", listOf(
        LumenKanbanCard("todo", "Design mobile column"), LumenKanbanCard("test", "Test accessible reorder")
    ), capacity = 3)) }
    var disabled by remember { mutableStateOf(false) }
    var readOnly by remember { mutableStateOf(false) }
    var loading by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf(false) }
    var opened by remember { mutableStateOf("No card opened") }
    Column {
        LumenCheckbox("Disable column", disabled, { disabled = it })
        LumenCheckbox("Read-only column", readOnly, { readOnly = it })
        LumenCheckbox("Loading", loading, { loading = it })
        LumenCheckbox("Error", error, { error = it })
        LumenKanbanColumn(column, { column = it }, enabled = !disabled, readOnly = readOnly,
            loading = loading, error = if (error) "Column unavailable" else null,
            onAdd = { if (column.cards.none { it.id == "review" }) column = column.copy(cards = column.cards + LumenKanbanCard("review", "Review results")) },
            onCardPress = { opened = it }, cardContent = { LumenText("${it.label} · App-owned content") })
        LumenText("Opened card: $opened")
    }
}
