package com.santi020k.lumen

import org.junit.Assert.*
import org.junit.Test

class TreeGridTest {
    private val columns = listOf(LumenTreeGridColumn("status", "Status"))
    private val records = listOf(
        LumenTreeGridRecord(LumenTreeNode("root", "Packages"), mapOf("status" to LumenTableCell("Group"))),
        LumenTreeGridRecord(LumenTreeNode("child", "Astro", "root"), mapOf("status" to LumenTableCell("Ready"))),
        LumenTreeGridRecord(LumenTreeNode("locked", "Locked", disabled = true), emptyMap()),
        LumenTreeGridRecord(LumenTreeNode("locked-child", "Locked child", "locked"), emptyMap()),
        LumenTreeGridRecord(LumenTreeNode("locked-leaf", "Locked leaf", "locked-child"), emptyMap())
    )
    @Test fun recordsPreserveCellsLevelsAndHostExpansion() {
        val model = LumenTreeGridModel(columns, records)
        val expanded = setOf("root", "child", "unknown", "locked", "locked-child")
        assertTrue(model.valid)
        assertEquals(listOf("root", "locked"), model.visibleRows(emptySet()).map { it.tree.node.id })
        assertEquals("Ready", model.visibleRows(expanded)[1].record.cells["status"]?.text)
        assertEquals(1, model.visibleRows(expanded)[1].tree.depth)
        assertEquals(expanded - "root", model.togglingExpansion("root", expanded))
        assertEquals(expanded, model.togglingExpansion("locked-child", expanded))
        assertTrue(model.visibleRows(expanded).first { it.tree.node.id == "locked-child" }.tree.disabled)
    }
    @Test fun invalidGraphAndIdentityHideAllRows() {
        for (badColumns in listOf(emptyList(), columns + columns, listOf(LumenTreeGridColumn(" ", "Status")))) {
            assertFalse(LumenTreeGridModel(badColumns, records).valid)
        }
        for (badRecords in listOf(listOf(records[0], records[0]),
            listOf(LumenTreeGridRecord(LumenTreeNode(" ", "Blank"), emptyMap())),
            listOf(LumenTreeGridRecord(LumenTreeNode("cycle", "Cycle", "cycle"), emptyMap())))) {
            val model = LumenTreeGridModel(columns, badRecords)
            assertFalse(model.valid)
            assertTrue(model.visibleRows(setOf("cycle")).isEmpty())
            assertEquals(setOf("unknown"), model.togglingExpansion("cycle", setOf("unknown")))
        }
    }
    @Test fun deepSemanticLevelsRemainUncapped() {
        val deep = (0 until 1000).map { LumenTreeGridRecord(LumenTreeNode("$it", "Record $it", if (it == 0) null else "${it - 1}"), emptyMap()) }
        val model = LumenTreeGridModel(columns, deep)
        assertEquals(999, model.visibleRows(deep.map { it.node.id }.toSet()).last().tree.depth)
    }
}
