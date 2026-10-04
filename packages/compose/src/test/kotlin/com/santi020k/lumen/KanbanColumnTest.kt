package com.santi020k.lumen

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class KanbanColumnTest {
    @Test fun standaloneColumnReordersAtCapacityWithoutMutatingHost() {
        val column = LumenKanbanColumnData("todo", "Todo", listOf(LumenKanbanCard("todo", "First"), LumenKanbanCard("second", "Second")), capacity = 2)
        val model = LumenKanbanModel(listOf(column))
        assertTrue(model.valid)
        val next = model.moving("second", column.id, 0)?.firstOrNull()
        assertEquals("todo", next?.id)
        assertEquals(listOf("second", "todo"), next?.cards?.map { it.id })
        assertEquals(listOf("todo", "second"), column.cards.map { it.id })
        assertNull(model.moving("todo", column.id, -1))
        assertNull(model.moving("second", column.id, 2))
        val single = LumenKanbanModel(listOf(LumenKanbanColumnData("single", "Single", listOf(LumenKanbanCard("a", "A")))))
        assertNull(single.moving("a", "single", -1))
        assertNull(single.moving("a", "single", 1))
    }
    @Test fun standaloneColumnRejectsDisabledAndInvalidRecords() {
        val card = LumenKanbanCard("a", "A", disabled = true)
        val column = LumenKanbanColumnData("c", "Column", listOf(card, LumenKanbanCard("b", "B")))
        assertNull(LumenKanbanModel(listOf(column)).moving("a", "c", 1))
        assertFalse(LumenKanbanModel(listOf(column.copy(cards = listOf(card, card)))).valid)
        assertFalse(LumenKanbanModel(listOf(column.copy(capacity = 1))).valid)
        assertNull(LumenKanbanModel(listOf(column.copy(disabled = true))).moving("b", "c", 0))
    }
}
