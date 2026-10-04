package com.santi020k.lumen

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.stateDescription

@Composable
fun LumenTree(
    label: String,
    nodes: List<LumenTreeNode>,
    expandedIds: Set<String>,
    onExpandedChange: (Set<String>) -> Unit,
    modifier: Modifier = Modifier,
    selectedIds: Set<String> = emptySet(),
    onSelectionChange: ((Set<String>) -> Unit)? = null,
    enabled: Boolean = true,
    readOnly: Boolean = false,
    loading: Boolean = false,
    error: String? = null,
    loadingLabel: String = "Loading",
    emptyLabel: String = "No items",
    invalidLabel: String = "Invalid tree data",
    formatDisclosure: (String, Boolean) -> String = { name, expanded -> "${if (expanded) "Collapse" else "Expand"} $name" },
    formatLevel: (Int) -> String = { "Level ${it + 1}" }
) {
    val model = LumenTreeModel(nodes)
    Column(modifier.semantics { contentDescription = label }, verticalArrangement = Arrangement.spacedBy(LumenSpacing.Md)) {
        LumenText(label)
        when {
            loading -> LumenText(loadingLabel, modifier = Modifier.semantics { liveRegion = LiveRegionMode.Polite })
            error != null -> LumenText(error, modifier = Modifier.semantics { liveRegion = LiveRegionMode.Polite })
            !model.valid -> LumenText(invalidLabel)
            nodes.isEmpty() -> LumenText(emptyLabel)
            else -> model.visibleRows(expandedIds).forEach { row ->
                androidx.compose.runtime.key(row.node.id) {
                    Column(Modifier.padding(start = LumenSpacing.Md * row.depth.coerceAtMost(8)),
                        verticalArrangement = Arrangement.spacedBy(LumenSpacing.Xs)) {
                        val interactive = enabled && !row.disabled
                        if (row.hasChildren) LumenButton(
                            onClick = { if (interactive) onExpandedChange(model.togglingExpansion(row.node.id, expandedIds)) },
                            enabled = interactive,
                            modifier = Modifier.semantics { stateDescription = formatDisclosure(row.node.label, row.node.id in expandedIds) }
                        ) { LumenText(formatDisclosure(row.node.label, row.node.id in expandedIds)) }
                        if (onSelectionChange != null && row.node.selectable) LumenCheckbox(
                            label = row.node.label, checked = row.node.id in selectedIds,
                            enabled = interactive && !readOnly,
                            onCheckedChange = { if (interactive && !readOnly) onSelectionChange(model.togglingSelection(row.node.id, selectedIds)) }
                        ) else LumenText(row.node.label)
                        LumenText(formatLevel(row.depth))
                    }
                }
            }
        }
    }
}
