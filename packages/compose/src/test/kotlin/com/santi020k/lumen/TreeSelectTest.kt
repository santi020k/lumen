package com.santi020k.lumen

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class TreeSelectTest {
    @Test fun flattensHierarchyAndSelectsParentOrLeaf() {
        val model = LumenTreeSelectModel(listOf(LumenTreeNode("r", "Root"), LumenTreeNode("c", "Child", "r")))
        assertTrue(model.valid)
        assertEquals(listOf("r", "c"), model.rows.map { it.node.id })
        assertEquals(listOf(0, 1), model.rows.map { it.depth })
        assertEquals("r", model.selecting("r", "missing"))
        assertEquals("c", model.selecting("c", null))
        assertEquals("Missing", model.selectionLabel("unknown", "Choose", "Missing"))
        assertEquals("Choose", model.selectionLabel(null, "Choose", "Missing"))
    }
    @Test fun disabledAncestryNonselectableAndUnknownIdsRetainHostValue() {
        val model = LumenTreeSelectModel(listOf(LumenTreeNode("r", "Root", disabled = true), LumenTreeNode("c", "Child", "r"), LumenTreeNode("g", "Group", selectable = false)))
        listOf("r", "c", "g", "missing").forEach { assertEquals("host-only", model.selecting(it, "host-only")) }
        assertEquals("Child", model.selectionLabel("c", "Choose", "Missing"))
    }
    @Test fun invalidGraphsHideOptionsAndDeepGraphsStayIterative() {
        val invalid = listOf(listOf(LumenTreeNode(" ", "")), listOf(LumenTreeNode("a", ""), LumenTreeNode("a", "")), listOf(LumenTreeNode("a", "", "missing")), listOf(LumenTreeNode("a", "", "a")))
        invalid.forEach {
            val model = LumenTreeSelectModel(it)
            assertFalse(model.valid)
            assertTrue(model.rows.isEmpty())
            assertEquals("unknown", model.selecting("a", "unknown"))
        }
        val deep = LumenTreeSelectModel((0 until 10000).map { LumenTreeNode(it.toString(), it.toString(), if (it == 0) null else (it - 1).toString()) })
        assertEquals(10000, deep.rows.size)
        assertEquals(9999, deep.rows.last().depth)
    }
}
