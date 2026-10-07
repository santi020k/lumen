package com.santi020k.lumen.playground.compose

import androidx.compose.foundation.layout.Column
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import com.santi020k.lumen.LumenCascader
import com.santi020k.lumen.LumenCheckbox
import com.santi020k.lumen.LumenText
import com.santi020k.lumen.LumenTreeNode

@Composable
fun CascaderParityExample() {
    var path by remember { mutableStateOf(listOf("missing")) }
    var disabled by remember { mutableStateOf(false) }
    var readOnly by remember { mutableStateOf(false) }
    var loading by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf(false) }
    val nodes = listOf(LumenTreeNode("americas", "Americas"), LumenTreeNode("colombia", "Colombia", "americas"),
        LumenTreeNode("bogota", "Bogotá", "colombia"), LumenTreeNode("locked", "Unavailable region", disabled = true))
    Column {
        LumenCheckbox("Disable cascader", disabled, { disabled = it })
        LumenCheckbox("Read-only selection", readOnly, { readOnly = it })
        LumenCheckbox("Loading", loading, { loading = it })
        LumenCheckbox("Error", error, { error = it })
        LumenCascader("Destination", nodes, path, { path = it }, enabled = !disabled, readOnly = readOnly,
            loading = loading, error = if (error) "Destinations unavailable" else null)
        LumenText("Selected path: ${path.joinToString(" / ")}")
    }
}
