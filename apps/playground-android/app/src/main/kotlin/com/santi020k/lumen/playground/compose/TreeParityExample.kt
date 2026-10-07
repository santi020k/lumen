package com.santi020k.lumen.playground.compose

import androidx.compose.foundation.layout.Column
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import com.santi020k.lumen.LumenCheckbox
import com.santi020k.lumen.LumenText
import com.santi020k.lumen.LumenTree
import com.santi020k.lumen.LumenTreeNode

@Composable
fun TreeParityExample() {
    var expanded by remember { mutableStateOf(setOf("work")) }
    var selected by remember { mutableStateOf(setOf("missing-record")) }
    var disabled by remember { mutableStateOf(false) }
    var readOnly by remember { mutableStateOf(false) }
    var loading by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf(false) }
    val nodes = listOf(LumenTreeNode("work", "Workspace"), LumenTreeNode("reports", "Reports", "work"),
        LumenTreeNode("quarter", "Quarterly report", "reports"), LumenTreeNode("archive", "Locked archive", disabled = true),
        LumenTreeNode("past", "Past report", "archive"))
    Column {
        LumenCheckbox("Disable tree", disabled, { disabled = it })
        LumenCheckbox("Read-only selection", readOnly, { readOnly = it })
        LumenCheckbox("Loading", loading, { loading = it })
        LumenCheckbox("Error", error, { error = it })
        LumenTree("Project files", nodes, expanded, { expanded = it }, selectedIds = selected,
            onSelectionChange = { selected = it }, enabled = !disabled, readOnly = readOnly,
            loading = loading, error = if (error) "Files unavailable" else null,
            formatDisclosure = { name, open -> "${if (open) "Collapse" else "Expand"} $name" },
            formatLevel = { "Level ${it + 1}" })
        LumenText("Expanded: ${expanded.joinToString()}")
        LumenText("Selected: ${selected.joinToString()}")
    }
}
