package com.santi020k.lumen

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.selected
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.unit.dp

@Composable
fun LumenTreeSelect(
    label: String,
    nodes: List<LumenTreeNode>,
    value: String?,
    onValueChange: (String) -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    readOnly: Boolean = false,
    loading: Boolean = false,
    error: String? = null,
    placeholder: String = "Select…",
    unknownSelectionLabel: String = "Unavailable selection",
    loadingLabel: String = "Loading",
    emptyLabel: String = "No options",
    invalidLabel: String = "Invalid options",
    expandedLabel: String = "Expanded",
    collapsedLabel: String = "Collapsed",
    formatOption: (String, List<String>, Int) -> String = { _, path, level -> "${path.joinToString(" / ")}, level $level" }
) {
    val model = LumenTreeSelectModel(nodes)
    var open by remember { mutableStateOf(false) }
    val selection = model.selectionLabel(value, placeholder, unknownSelectionLabel)
    val status = when { loading -> loadingLabel; error != null -> error; !model.valid -> invalidLabel; else -> null }
    Column(modifier.semantics { contentDescription = label }, verticalArrangement = Arrangement.spacedBy(LumenSpacing.Sm)) {
        LumenText(label)
        if (status != null) LumenText(selection, modifier = Modifier.semantics { liveRegion = LiveRegionMode.Polite })
        if (status != null) LumenText(status, modifier = Modifier.semantics { liveRegion = LiveRegionMode.Polite })
        else {
            LumenButton(enabled = enabled, onClick = { if (enabled) open = !open },
                modifier = Modifier.semantics { contentDescription = "$label: $selection"; stateDescription = if (open) expandedLabel else collapsedLabel }) { LumenText(selection) }
            if (open) LazyColumn(Modifier.heightIn(max = 320.dp), verticalArrangement = Arrangement.spacedBy(LumenSpacing.Xs)) {
                if (model.rows.isEmpty()) item { LumenText(emptyLabel) }
                items(model.rows, key = { it.node.id }) { row ->
                    val interactive = enabled && !readOnly && model.canSelect(row.node.id)
                    val name = formatOption(row.node.label, model.tree.path(row.node.id).map { it.label }, row.depth + 1)
                    LumenButton(enabled = interactive, modifier = Modifier.padding(start = LumenSpacing.Sm * row.depth.coerceAtMost(8))
                        .semantics { contentDescription = name; selected = value == row.node.id }, onClick = {
                            if (interactive) {
                                val next = model.selecting(row.node.id, value)
                                if (next != null && next != value) onValueChange(next)
                                open = false
                            }
                        }) { LumenText(row.node.label) }
                }
            }
        }
    }
}
