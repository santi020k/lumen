package com.santi020k.lumen

import org.junit.Assert.*
import org.junit.Test

class CascaderTest {
    @Test fun selectsOnlyEnabledSelectableLeaves() {
        val model = LumenCascaderModel(listOf(LumenTreeNode("r", "Root"), LumenTreeNode("l", "Leaf", "r"),
            LumenTreeNode("no", "No", selectable = false), LumenTreeNode("d", "Disabled", disabled = true), LumenTreeNode("x", "Inherited", "d")))
        val host = listOf("unknown")
        listOf("r", "no", "d", "x", "missing").forEach {
            assertFalse(model.canSelect(it)); assertSame(host, model.selecting(it, host))
        }
        assertEquals(listOf("r", "l"), model.selecting("l", host))
        assertTrue(model.isPathValid(listOf("r", "l")))
        listOf(listOf("l"), listOf("r", "unknown"), listOf("l", "r")).forEach { assertFalse(model.isPathValid(it)) }
    }
    @Test fun invalidGraphFailsClosed() {
        val model = LumenCascaderModel(listOf(LumenTreeNode("a", "", "a")))
        assertFalse(model.canSelect("a")); assertFalse(model.isPathValid(listOf("a")))
        assertEquals(listOf("host"), model.selecting("a", listOf("host")))
    }
}
