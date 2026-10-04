package com.santi020k.lumen.playground.compose

import androidx.compose.foundation.layout.Column
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import com.santi020k.lumen.LumenCheckbox
import com.santi020k.lumen.LumenKanbanBoard
import com.santi020k.lumen.LumenKanbanCard
import com.santi020k.lumen.LumenKanbanColumnData

@Composable
fun KanbanBoardParityExample() {
    var columns by remember { mutableStateOf(listOf(
        LumenKanbanColumnData("todo", "To do", listOf(LumenKanbanCard("design", "Design mobile board"), LumenKanbanCard("test", "Test keyboard moves"))),
        LumenKanbanColumnData("done", "Done (capacity 1)", emptyList(), capacity = 1)
    )) }
    var disabled by remember { mutableStateOf(false) }
    var empty by remember { mutableStateOf(false) }
    var readOnly by remember { mutableStateOf(false) }
    var loading by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf(false) }
    Column {
        LumenCheckbox("Disable board", disabled, { disabled = it })
        LumenCheckbox("Empty board", empty, { empty = it })
        LumenCheckbox("Read-only board", readOnly, { readOnly = it })
        LumenCheckbox("Loading", loading, { loading = it })
        LumenCheckbox("Error", error, { error = it })
        LumenKanbanBoard("Project board", if (empty) emptyList() else columns, { columns = it }, enabled = !disabled, readOnly = readOnly,
            loading = loading, error = if (error) "Board unavailable" else null)
    }
}
