package com.santi020k.lumen

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.key
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.selected
import androidx.compose.ui.semantics.semantics

@Composable
fun LumenCascader(
    label: String, nodes: List<LumenTreeNode>, selectedPath: List<String>, onSelectionChange: (List<String>) -> Unit,
    modifier: Modifier = Modifier, enabled: Boolean = true, readOnly: Boolean = false,
    loading: Boolean = false, error: String? = null, loadingLabel: String = "Loading", emptyLabel: String = "No options",
    invalidLabel: String = "Invalid options", unknownSelectionLabel: String = "Unavailable selection",
    placeholder: String = "Select…", backLabel: String = "Back", formatDisclosure: (String) -> String = { "Open $it" }
) {
    val model = LumenCascaderModel(nodes)
    var browsingId by remember { mutableStateOf<String?>(null) }
    val parent = browsingId?.takeIf { model.tree.valid && !model.tree.isDisabled(it) }?.let { model.tree.node(it) }
    val selectionLabel = when {
        selectedPath.isEmpty() -> placeholder
        !model.isPathValid(selectedPath) -> unknownSelectionLabel
        else -> selectedPath.joinToString(" / ") { model.tree.node(it)?.label ?: it }
    }
    Column(modifier.semantics { contentDescription = label }, verticalArrangement = Arrangement.spacedBy(LumenSpacing.Sm)) {
        LumenText(label)
        LumenText(selectionLabel, modifier = Modifier.semantics { liveRegion = LiveRegionMode.Polite })
        when {
            loading -> LumenText(loadingLabel, modifier = Modifier.semantics { liveRegion = LiveRegionMode.Polite })
            error != null -> LumenText(error, modifier = Modifier.semantics { liveRegion = LiveRegionMode.Polite })
            !model.tree.valid -> LumenText(invalidLabel)
            else -> {
                if (parent != null) {
                    LumenButton(onClick = { if (enabled) browsingId = parent.parentId }, enabled = enabled) { LumenText(backLabel) }
                    LumenText(model.tree.path(parent.id).joinToString(" / ") { it.label })
                }
                val options = model.tree.childrenOf(parent?.id)
                if (options.isEmpty()) LumenText(emptyLabel)
                options.forEach { node -> key(node.id) {
                    val branch = model.tree.childrenOf(node.id).isNotEmpty()
                    val interactive = enabled && !model.tree.isDisabled(node.id) && (branch || (!readOnly && model.canSelect(node.id)))
                    LumenButton(onClick = {
                        if (interactive) {
                            if (branch) browsingId = node.id
                            else onSelectionChange(model.selecting(node.id, selectedPath))
                        }
                    }, enabled = interactive, modifier = Modifier.semantics {
                        contentDescription = if (branch) formatDisclosure(node.label) else node.label
                        selected = !branch && selectedPath.lastOrNull() == node.id
                    }) { LumenText(if (branch) "${node.label} ›" else node.label) }
                } }
            }
        }
    }
}
