package com.santi020k.lumen

import org.junit.Assert.*
import org.junit.Test

class TableParityTest {
    @Test fun identityValidationAndEmptyInputsRemainUnchanged() {
        val columns = listOf(LumenTableColumn("description", "Description"))
        val row = LumenTableRow("one", "One", emptyMap())
        assertTrue(LumenTableModel.isValid(emptyList(), emptyList()))
        assertTrue(LumenTableModel.isValid(columns, emptyList()))
        assertFalse(LumenTableModel.isValid(columns, listOf(row, row)))
        assertFalse(LumenTableModel.isValid(columns + columns, listOf(row)))
        assertFalse(LumenTableModel.isValid(columns, listOf(row.copy(id = ""))))
        assertEquals("one", row.id)
        assertTrue(row.cells.isEmpty())
    }
    @Test fun literalKeysAndMultilineUnicodeDoNotAliasMissingCells() {
        val text = "Synthetic record with long content 😀.\nSecond line preserved."
        val row = LumenTableRow("Unicode 😀", "Synthetic", mapOf("__proto__" to LumenTableCell(text)))
        val columns = listOf(LumenTableColumn("__proto__", "Literal key"), LumenTableColumn("constructor", "Missing"))
        assertTrue(LumenTableModel.isValid(columns, listOf(row)))
        assertEquals(text, row.cells["__proto__"]?.text)
        assertNull(row.cells["constructor"])
        assertEquals(1, row.cells.size)
    }
}
