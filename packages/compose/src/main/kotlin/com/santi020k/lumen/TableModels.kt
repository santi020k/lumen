package com.santi020k.lumen

import androidx.compose.runtime.Immutable
import java.text.Collator
import java.util.Locale

@Immutable
sealed interface LumenTableSortValue {
    data class Text(val value: String) : LumenTableSortValue
    data class Number(val value: Double) : LumenTableSortValue
    data class Boolean(val value: kotlin.Boolean) : LumenTableSortValue
    data object Missing : LumenTableSortValue
}
@Immutable
data class LumenTableCell(val text: String, val sortValue: LumenTableSortValue? = null)
@Immutable
data class LumenTableColumn(val key: String, val label: String, val sortable: Boolean = false)
@Immutable
data class LumenTableRow(val id: String, val label: String, val cells: Map<String, LumenTableCell>, val enabled: Boolean = true)
enum class LumenTableSortDirection { Ascending, Descending }
enum class LumenTableSortMode { Client, Manual }
enum class LumenTableLayout { Records, Scroll }
@Immutable
data class LumenTableSort(val key: String, val direction: LumenTableSortDirection)

object LumenTableModel {
    fun isValid(columns: List<LumenTableColumn>, rows: List<LumenTableRow>): Boolean =
        columns.map { it.key }.toSet().size == columns.size && rows.map { it.id }.toSet().size == rows.size &&
            columns.all { it.key.isNotEmpty() } && rows.all { it.id.isNotEmpty() }

    fun nextSort(sort: LumenTableSort?, key: String): LumenTableSort? =
        if (sort?.key != key) LumenTableSort(key, LumenTableSortDirection.Ascending)
        else if (sort.direction == LumenTableSortDirection.Ascending) LumenTableSort(key, LumenTableSortDirection.Descending)
        else null

    fun toggling(row: LumenTableRow, selection: Set<String>): Set<String> {
        if (!row.enabled) return selection
        return if (row.id in selection) selection - row.id else selection + row.id
    }
    fun togglingVisible(rows: List<LumenTableRow>, selection: Set<String>): Set<String> {
        val available = rows.filter { it.enabled }.map { it.id }.toSet()
        return if (available.all { it in selection }) selection - available else selection + available
    }
    fun sorted(rows: List<LumenTableRow>, columns: List<LumenTableColumn>, sort: LumenTableSort?,
               mode: LumenTableSortMode = LumenTableSortMode.Manual, locale: Locale = Locale.getDefault()): List<LumenTableRow> {
        if (mode != LumenTableSortMode.Client || sort == null || columns.none { it.key == sort.key && it.sortable }) return rows
        val collator = Collator.getInstance(locale).apply { strength = Collator.PRIMARY }
        return rows.withIndex().sortedWith { left, right ->
            val a = value(left.value, sort.key)
            val b = value(right.value, sort.key)
            if (a == LumenTableSortValue.Missing) {
                if (b == LumenTableSortValue.Missing) left.index.compareTo(right.index) else 1
            } else if (b == LumenTableSortValue.Missing) -1
            else {
                val compared = compare(a, b, collator)
                if (compared == 0) left.index.compareTo(right.index)
                else if (sort.direction == LumenTableSortDirection.Ascending) compared else -compared
            }
        }.map { it.value }
    }
    private fun value(row: LumenTableRow, key: String): LumenTableSortValue {
        val cell = row.cells[key] ?: return LumenTableSortValue.Missing
        val value = cell.sortValue ?: LumenTableSortValue.Text(cell.text)
        return if (value is LumenTableSortValue.Number && !value.value.isFinite()) LumenTableSortValue.Missing else value
    }
    private fun compare(a: LumenTableSortValue, b: LumenTableSortValue, collator: Collator): Int = when {
        rank(a) != rank(b) -> rank(a).compareTo(rank(b))
        a is LumenTableSortValue.Number && b is LumenTableSortValue.Number -> if (a.value == b.value) 0 else a.value.compareTo(b.value)
        a is LumenTableSortValue.Boolean && b is LumenTableSortValue.Boolean -> a.value.compareTo(b.value)
        else -> collator.compare(text(a), text(b))
    }
    private fun rank(value: LumenTableSortValue): Int = when (value) {
        is LumenTableSortValue.Number -> 0
        is LumenTableSortValue.Boolean -> 1
        is LumenTableSortValue.Text -> 2
        LumenTableSortValue.Missing -> 3
    }
    private fun text(value: LumenTableSortValue): String = when (value) {
        is LumenTableSortValue.Text -> value.value
        is LumenTableSortValue.Number -> value.value.toString()
        is LumenTableSortValue.Boolean -> value.value.toString()
        LumenTableSortValue.Missing -> ""
    }
}
