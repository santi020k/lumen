package com.santi020k.lumen.playground.compose

import androidx.compose.foundation.layout.Column
import androidx.compose.runtime.*
import com.santi020k.lumen.*

@Composable
fun CommandParityExample() {
    var open by remember { mutableStateOf(false) }
    var query by remember { mutableStateOf("") }
    var activeId by remember { mutableStateOf<String?>("note") }
    var readOnly by remember { mutableStateOf(false) }
    var loading by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf(false) }
    var empty by remember { mutableStateOf(false) }
    var preview by remember { mutableStateOf(false) }
    var message by remember { mutableStateOf("Choose a command") }
    val groups = listOf(LumenCommandGroup("navigation", "Navigation", listOf(
        LumenCommandItem("note", "Show documentation note", "Read local guidance", listOf("guide", "manual"), "⌘D")
    )), LumenCommandGroup("actions", "Actions", listOf(
        LumenCommandItem("preview", "Toggle preview"), LumenCommandItem("reset", "Reset example"), LumenCommandItem("unavailable", "Unavailable command", disabled = true)
    )))
    Column {
        LumenCheckbox("Read only", readOnly, { readOnly = it })
        LumenCheckbox("Loading", loading, { loading = it })
        LumenCheckbox("Error", error, { error = it })
        LumenCheckbox("Empty", empty, { empty = it })
        LumenButton(onClick = { open = true }) { LumenText("Open commands") }
        LumenText(message); LumenText(if (preview) "Preview enabled" else "Preview disabled")
    }
    LumenSheet(open, { open = false }) {
        LumenCommand("Project commands", if (empty) emptyList() else groups, open, { open = it }, query, { query = it; activeId = null }, activeId, { activeId = it }, onSelect = { item ->
            if (item.id == "preview") preview = !preview
            if (item.id == "reset") { preview = false; query = ""; activeId = null }
            message = if (item.id == "note") "Documentation: search for a component and inspect its public contract." else "Selected ${item.label}"
            open = false
        }, readOnly = readOnly, loading = loading, error = if (error) "Commands unavailable" else null, formatCount = { "$it commands" })
    }
}
