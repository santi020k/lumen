package com.santi020k.lumen.playground.compose

import androidx.compose.foundation.layout.Column
import androidx.compose.runtime.*
import com.santi020k.lumen.*

@Composable
fun TransferParityExample() {
    var value by remember { mutableStateOf(LumenTransferValue(selectedIds = listOf("release", "external-id"))) }
    var readOnly by remember { mutableStateOf(false) }
    var loading by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf(false) }
    var empty by remember { mutableStateOf(false) }
    val items = listOf(LumenTransferItem("design", "Design", "Interface library"), LumenTransferItem("docs", "Documentation"), LumenTransferItem("release", "Release", "Managed by the host", disabled = true))
    Column {
        LumenCheckbox("Read only", readOnly, { readOnly = it })
        LumenCheckbox("Loading", loading, { loading = it })
        LumenCheckbox("Error", error, { error = it })
        LumenCheckbox("Empty", empty, { empty = it })
        LumenTransfer("Project transfer", if (empty) emptyList() else items, value, { value = it }, readOnly = readOnly, loading = loading, error = if (error) "Transfer unavailable" else null, formatCount = { "$it items" })
        LumenText("Target IDs: ${value.selectedIds.joinToString(", ")}")
        LumenText("Checked IDs: ${value.checkedIds.joinToString(", ")}")
    }
}
