package com.santi020k.lumen

import org.junit.Assert.*
import org.junit.Test

class TreeComponentsTest {
    @Test fun invalidGraphsFailClosed() {
        listOf(listOf(LumenTreeNode("", "")), listOf(LumenTreeNode("a", ""), LumenTreeNode("a", "")),
            listOf(LumenTreeNode("a", "", "missing")), listOf(LumenTreeNode("a", "", "b"), LumenTreeNode("b", "", "a")))
            .forEach { nodes ->
                val model = LumenTreeModel(nodes)
                assertFalse(model.valid)
                assertTrue(model.visibleRows(emptySet()).isEmpty())
            }
    }
    @Test fun preservesOrderStateAndDisabledAncestors() {
        val model = LumenTreeModel(listOf(LumenTreeNode("r", "Root"), LumenTreeNode("c", "Child", "r"),
            LumenTreeNode("d", "Disabled", disabled = true), LumenTreeNode("x", "Blocked", "d")))
        assertEquals(listOf("r", "c", "d"), model.visibleRows(setOf("r")).map { it.node.id })
        assertEquals(listOf("r", "c"), model.path("c").map { it.id })
        assertEquals(listOf("missing", "r", "c"), model.togglingSelection("c", linkedSetOf("missing", "r")).toList())
        assertEquals(setOf("missing"), model.togglingSelection("x", setOf("missing")))
        assertTrue(model.togglingExpansion("d", emptySet()).isEmpty())
    }
    @Test fun deepGraphDoesNotRecurse() {
        val nodes = (0 until 20000).map { LumenTreeNode("$it", "", if (it == 0) null else "${it - 1}") }
        val model = LumenTreeModel(nodes)
        assertTrue(model.valid)
        assertEquals(20000, model.path("19999").size)
        assertEquals(20000, model.visibleRows(nodes.map { it.id }.toSet()).size)
    }
    @Test fun wideGraphDoesNotUseVarargs() {
        val nodes = listOf(LumenTreeNode("root", "Root")) +
            (0 until 20000).map { LumenTreeNode("$it", "", "root") }
        val model = LumenTreeModel(nodes)
        assertTrue(model.valid)
        assertEquals(20001, model.visibleRows(setOf("root")).size)
    }
}
