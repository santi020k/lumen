package com.santi020k.lumen

import androidx.compose.foundation.border
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.key
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp

@Composable
fun LumenTable(
    label: String,
    columns: List<LumenTableColumn>,
    rows: List<LumenTableRow>,
    modifier: Modifier = Modifier,
    layout: LumenTableLayout = LumenTableLayout.Records,
    emptyLabel: String = "No records",
    invalidLabel: String = "Invalid table data",
    missingLabel: String = ""
) {
    Column(modifier.semantics { contentDescription = label }, verticalArrangement = Arrangement.spacedBy(LumenSpacing.Md)) {
        LumenText(label)
        if (!LumenTableModel.isValid(columns, rows)) LumenText(invalidLabel)
        else if (rows.isEmpty() || columns.isEmpty()) LumenText(emptyLabel)
        else LumenNativeTableContent(columns, rows, layout, missingLabel)
    }
}

@Composable
fun LumenDataTable(
    label: String,
    columns: List<LumenTableColumn>,
    rows: List<LumenTableRow>,
    modifier: Modifier = Modifier,
    layout: LumenTableLayout = LumenTableLayout.Records,
    sort: LumenTableSort? = null,
    sortMode: LumenTableSortMode = LumenTableSortMode.Manual,
    onSortChange: ((LumenTableSort?) -> Unit)? = null,
    selectedIds: Set<String> = emptySet(),
    onSelectionChange: ((Set<String>) -> Unit)? = null,
    enabled: Boolean = true,
    readOnly: Boolean = false,
    loading: Boolean = false,
    loadingLabel: String = "Loading",
    error: String? = null,
    onRetry: (() -> Unit)? = null,
    retryLabel: String = "Retry",
    emptyLabel: String = "No records",
    invalidLabel: String = "Invalid table data",
    missingLabel: String = "",
    selectAllLabel: String = "Select visible",
    deselectAllLabel: String = "Deselect visible",
    formatSort: (LumenTableSort?) -> String = { it?.direction?.name ?: "" }
) {
    Column(modifier.semantics { contentDescription = label }, verticalArrangement = Arrangement.spacedBy(LumenSpacing.Md)) {
        LumenText(label)
        if (loading) LumenSpinner(label = loadingLabel)
        else if (error != null) {
            LumenText(error)
            if (onRetry != null) LumenButton(onClick = onRetry, enabled = enabled) { LumenText(retryLabel) }
        } else if (!LumenTableModel.isValid(columns, rows)) LumenText(invalidLabel)
        else if (rows.isEmpty() || columns.isEmpty()) LumenText(emptyLabel)
        else {
            val available = rows.filter { it.enabled }
            val allSelected = available.isNotEmpty() && available.all { it.id in selectedIds }
            if (onSelectionChange != null) {
                LumenButton(enabled = enabled && !readOnly && available.isNotEmpty(), onClick = {
                        if (enabled && !readOnly) onSelectionChange(LumenTableModel.togglingVisible(rows, selectedIds))
                    }) { LumenText(if (allSelected) deselectAllLabel else selectAllLabel) }
            }
            LumenNativeTableContent(columns, LumenTableModel.sorted(rows, columns, sort, sortMode), layout, missingLabel,
                sort, onSortChange, selectedIds, onSelectionChange, enabled && !readOnly, formatSort)
        }
    }
}

@Composable
private fun LumenNativeTableContent(
    columns: List<LumenTableColumn>, rows: List<LumenTableRow>, layout: LumenTableLayout, missingLabel: String,
    sort: LumenTableSort? = null, onSortChange: ((LumenTableSort?) -> Unit)? = null,
    selectedIds: Set<String> = emptySet(), onSelectionChange: ((Set<String>) -> Unit)? = null,
    editable: Boolean = true, formatSort: (LumenTableSort?) -> String = { it?.direction?.name ?: "" }
) {
    val colors = LocalLumenTheme.current.colors
    val scroll = layout == LumenTableLayout.Scroll
    Column(if (scroll) Modifier.horizontalScroll(rememberScrollState()) else Modifier,
        verticalArrangement = Arrangement.spacedBy(LumenSpacing.Md)) {
        if (scroll) {
            Row(Modifier.padding(LumenSpacing.Sm)) {
                columns.forEach { column -> key(column.key) {
                    Column(Modifier.width(180.dp)) { LumenNativeTableHeader(column, sort, onSortChange, editable, formatSort) }
                } }
            }
        } else if (onSortChange != null) {
            Column(verticalArrangement = Arrangement.spacedBy(LumenSpacing.Sm)) {
                columns.filter { it.sortable }.forEach { column -> key(column.key) {
                    LumenNativeTableHeader(column, sort, onSortChange, editable, formatSort)
                } }
            }
        }
        rows.forEach { row -> key(row.id) {
            Column(Modifier.border(1.dp, colors.line, RoundedCornerShape(LumenRadius.Md))
                .padding(LumenSpacing.Sm).semantics { contentDescription = row.label },
                verticalArrangement = Arrangement.spacedBy(LumenSpacing.Sm)) {
                if (onSelectionChange != null) {
                    LumenCheckbox(row.label, checked = row.id in selectedIds, enabled = editable && row.enabled,
                        onCheckedChange = { if (editable && row.enabled) onSelectionChange(LumenTableModel.toggling(row, selectedIds)) })
                }
                if (scroll) Row { columns.forEach { column -> key(column.key) {
                    Column(Modifier.width(180.dp)) { LumenNativeTableCell(row, column, missingLabel, false) }
                } } }
                else Column(verticalArrangement = Arrangement.spacedBy(LumenSpacing.Sm)) {
                    columns.forEach { column -> key(column.key) { LumenNativeTableCell(row, column, missingLabel, true) } }
                }
            }
        } }
    }
}
@Composable
private fun LumenNativeTableHeader(column: LumenTableColumn, sort: LumenTableSort?,
    onSortChange: ((LumenTableSort?) -> Unit)?, editable: Boolean, formatSort: (LumenTableSort?) -> String) {
    if (column.sortable && onSortChange != null) {
        val label = column.label + if (sort?.key == column.key) ", " + formatSort(sort) else ""
        LumenButton(enabled = editable, onClick = { if (editable) onSortChange(LumenTableModel.nextSort(sort, column.key)) }) { LumenText(label) }
    } else LumenText(column.label)
}
@Composable
private fun LumenNativeTableCell(row: LumenTableRow, column: LumenTableColumn, missingLabel: String, records: Boolean) {
    val text = row.cells[column.key]?.text ?: missingLabel
    Column(Modifier.padding(LumenSpacing.Sm).clearAndSetSemantics { contentDescription = "${column.label}, $text" },
        verticalArrangement = Arrangement.spacedBy(LumenSpacing.Xs)) {
        if (records) LumenText(column.label)
        LumenText(text)
    }
}
