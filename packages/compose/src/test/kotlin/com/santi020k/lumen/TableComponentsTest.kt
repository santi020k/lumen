package com.santi020k.lumen

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertSame
import org.junit.Test

class TableComponentsTest {
    private val columns = listOf(LumenTableColumn("amount", "Amount", sortable = true))
    private fun row(id: String, value: LumenTableSortValue) = LumenTableRow(id, id,
        mapOf("amount" to LumenTableCell(id, value)))

    @Test fun manualSortingRetainsOrderAndClientSortingIsStableWithMissingValuesLast() {
        val rows = listOf(row("large", LumenTableSortValue.Number(20.0)), row("small", LumenTableSortValue.Number(2.0)),
            row("equal", LumenTableSortValue.Number(2.0)), row("missing", LumenTableSortValue.Missing),
            row("nan", LumenTableSortValue.Number(Double.NaN)))
        val ascending = LumenTableSort("amount", LumenTableSortDirection.Ascending)
        assertSame(rows, LumenTableModel.sorted(rows, columns, ascending))
        assertEquals(listOf("small", "equal", "large", "missing", "nan"),
            LumenTableModel.sorted(rows, columns, ascending, LumenTableSortMode.Client).map { it.id })
        assertEquals(listOf("large", "small", "equal", "missing", "nan"),
            LumenTableModel.sorted(rows, columns, ascending.copy(direction = LumenTableSortDirection.Descending),
                LumenTableSortMode.Client).map { it.id })
        assertSame(rows, LumenTableModel.sorted(rows, columns, ascending.copy(key = "unknown"), LumenTableSortMode.Client))
    }
    @Test fun selectionPreservesHiddenAndDisabledIds() {
        val rows = listOf(row("one", LumenTableSortValue.Number(1.0)),
            LumenTableRow("locked", "Locked", emptyMap(), enabled = false))
        val selection = setOf("hidden", "locked")
        assertEquals(setOf("hidden", "locked", "one"), LumenTableModel.togglingVisible(rows, selection))
        assertEquals(selection, LumenTableModel.togglingVisible(rows, selection + "one"))
        assertEquals(selection, LumenTableModel.toggling(rows[1], selection))
        assertEquals(selection, LumenTableModel.togglingVisible(emptyList(), selection))
        assertFalse(LumenTableModel.isValid(columns, listOf(rows[0], rows[0])))
        assertFalse(LumenTableModel.isValid(columns + columns, rows))
    }
    @Test fun sortCyclesAndMixedValuesHaveTransitiveTypeOrdering() {
        val ascending = LumenTableModel.nextSort(null, "amount")
        assertEquals(LumenTableSort("amount", LumenTableSortDirection.Ascending), ascending)
        val descending = LumenTableModel.nextSort(ascending, "amount")
        assertEquals(LumenTableSort("amount", LumenTableSortDirection.Descending), descending)
        assertEquals(null, LumenTableModel.nextSort(descending, "amount"))
        val rows = listOf(row("text", LumenTableSortValue.Text("2")), row("ten", LumenTableSortValue.Number(10.0)),
            row("three", LumenTableSortValue.Number(3.0)), row("false", LumenTableSortValue.Boolean(false)),
            row("true", LumenTableSortValue.Boolean(true)))
        assertEquals(listOf("three", "ten", "false", "true", "text"),
            LumenTableModel.sorted(rows, columns, ascending, LumenTableSortMode.Client).map { it.id })
    }
}
