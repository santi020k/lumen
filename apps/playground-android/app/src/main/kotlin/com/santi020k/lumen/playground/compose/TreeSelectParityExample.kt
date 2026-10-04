package com.santi020k.lumen.playground.compose

import androidx.compose.foundation.layout.Column
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import com.santi020k.lumen.LumenButton
import com.santi020k.lumen.LumenCheckbox
import com.santi020k.lumen.LumenText
import com.santi020k.lumen.LumenTreeNode
import com.santi020k.lumen.LumenTreeSelect

@Composable
fun TreeSelectParityExample() {
    var value by remember { mutableStateOf<String?>("retained-record") }
    var disabled by remember { mutableStateOf(false) }
    var readOnly by remember { mutableStateOf(false) }
    var loading by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf(false) }
    var empty by remember { mutableStateOf(false) }
    val nodes = listOf(LumenTreeNode("workspace", "Workspace"), LumenTreeNode("design", "Design", "workspace"),
        LumenTreeNode("mobile", "Mobile", "design"), LumenTreeNode("archive", "Locked archive", disabled = true),
        LumenTreeNode("past", "Past project", "archive"))
    Column {
        LumenCheckbox("Disable picker", disabled, { disabled = it })
        LumenCheckbox("Read-only picker", readOnly, { readOnly = it })
        LumenCheckbox("Loading", loading, { loading = it })
        LumenCheckbox("Error", error, { error = it })
        LumenCheckbox("Empty options", empty, { empty = it })
        LumenTreeSelect("Project", if (empty) emptyList() else nodes, value, { value = it }, enabled = !disabled,
            readOnly = readOnly, loading = loading, error = if (error) "Projects unavailable" else null)
        LumenText("Controlled ID: ${value ?: "none"}")
        LumenButton(onClick = { value = "retained-record" }) { LumenText("Restore unknown ID") }
        LumenButton(onClick = { value = null }) { LumenText("Clear selection") }
    }
}
