package com.santi020k.lumen

import org.junit.Assert.*
import org.junit.Test

class TransferTest {
    @Test fun preservesHiddenDisabledAndControlledState() {
        val items = listOf(LumenTransferItem("a", "Alpha"), LumenTransferItem("b", "Beta", disabled = true), LumenTransferItem("c", "Gamma"))
        val value = LumenTransferValue(listOf("missing", "c"), listOf("unknown-check", "b", "a", "c"))
        val next = requireNotNull(moveLumenTransferItems(items, value, LumenTransferSide.Target))
        assertEquals(LumenTransferValue(listOf("missing", "c", "a"), listOf("unknown-check", "b", "c")), next)
        assertEquals(listOf("missing", "c"), value.selectedIds)
        assertEquals(LumenTransferValue(listOf("missing", "a"), listOf("unknown-check", "b")), moveLumenTransferItems(items, next, LumenTransferSide.Source))
        assertNull(toggleLumenTransferItem(items, value, "b", false))
        assertNull(toggleLumenTransferItem(items, value, "missing", true))
        assertNull(toggleLumenTransferItem(items, value, "a", true))
        assertEquals(listOf("unknown-check", "b", "c"), toggleLumenTransferItem(items, value, "a", false)?.checkedIds)
    }
    @Test fun rejectsIdentityAmbiguityAndHandlesMissingData() {
        val item = LumenTransferItem("a", "Alpha")
        val value = LumenTransferValue(listOf("missing"), listOf("unknown-check"))
        assertNull(lumenTransferLists(listOf(item, item), value))
        assertFalse(isLumenTransferItemsValid(listOf(LumenTransferItem(" ", "Blank"))))
        assertFalse(isLumenTransferValueValid(LumenTransferValue(selectedIds = listOf("a", "a"))))
        assertFalse(isLumenTransferValueValid(LumenTransferValue(checkedIds = listOf(" "))))
        assertTrue(requireNotNull(lumenTransferLists(emptyList(), value)).target.isEmpty())
        assertNull(moveLumenTransferItems(emptyList(), value, LumenTransferSide.Target))
        assertTrue(isLumenTransferItemsValid(listOf(LumenTransferItem("x".repeat(100000), "Long"))))
    }
}
