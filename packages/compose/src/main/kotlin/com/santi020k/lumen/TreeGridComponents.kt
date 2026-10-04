package com.santi020k.lumen

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.unit.dp

@Composable
fun LumenTreeGrid(
    label: String,
    columns: List<LumenTreeGridColumn>,
    records: List<LumenTreeGridRecord>,
    expandedIds: Set<String>,
    onExpandedChange: (Set<String>) -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    readOnly: Boolean = false,
    loading: Boolean = false,
    error: String? = null,
    loadingLabel: String = "Loading",
    emptyLabel: String = "No records",
    invalidLabel: String = "Invalid tree grid data",
    missingCellLabel: String = "—",
    formatDisclosure: (String, Boolean) -> String = { name, expanded -> "${if (expanded) "Collapse" else "Expand"} $name" },
    formatLevel: (Int) -> String = { "Level ${it + 1}" },
    cellContent: (@Composable (LumenTreeGridRecord, LumenTreeGridColumn, LumenTableCell?, Boolean, Boolean) -> Unit)? = null
) {
    val model = LumenTreeGridModel(columns, records)
    Column(modifier.semantics { contentDescription = label }, verticalArrangement = Arrangement.spacedBy(LumenSpacing.Sm)) {
        LumenText(label)
        when {
            loading -> LumenText(loadingLabel, modifier = Modifier.semantics { liveRegion = LiveRegionMode.Polite })
            error != null -> LumenText(error, modifier = Modifier.semantics { liveRegion = LiveRegionMode.Polite })
            !model.valid || label.isBlank() -> LumenText(invalidLabel)
            records.isEmpty() -> LumenText(emptyLabel)
            else -> LazyColumn(Modifier.heightIn(max = 480.dp), verticalArrangement = Arrangement.spacedBy(LumenSpacing.Sm)) {
                items(model.visibleRows(expandedIds), key = { it.tree.node.id }) { row ->
                    val interactive = enabled && !row.tree.disabled
                    val expanded = row.tree.node.id in expandedIds
                    Column(Modifier.fillMaxWidth().padding(start = LumenSpacing.Sm * row.tree.depth.coerceAtMost(4))
                        .padding(LumenSpacing.Sm).semantics { contentDescription = row.tree.node.label },
                        verticalArrangement = Arrangement.spacedBy(LumenSpacing.Sm)) {
                        LumenText(row.tree.node.label)
                        LumenText(formatLevel(row.tree.depth))
                        if (row.tree.hasChildren) LumenButton(enabled = interactive,
                            modifier = Modifier.semantics { stateDescription = formatDisclosure(row.tree.node.label, expanded) },
                            onClick = { if (interactive) onExpandedChange(model.togglingExpansion(row.tree.node.id, expandedIds)) }
                        ) { LumenText(formatDisclosure(row.tree.node.label, expanded)) }
                        columns.forEach { column -> androidx.compose.runtime.key(column.key) {
                            Column(verticalArrangement = Arrangement.spacedBy(LumenSpacing.Xs)) {
                                LumenText(column.label)
                                if (cellContent != null) cellContent(row.record, column, row.record.cells[column.key], interactive, readOnly)
                                else LumenText(row.record.cells[column.key]?.text ?: missingCellLabel)
                            }
                        } }
                    }
                }
            }
        }
    }
}
