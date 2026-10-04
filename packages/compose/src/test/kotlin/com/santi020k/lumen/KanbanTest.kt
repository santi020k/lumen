package com.santi020k.lumen

import org.junit.Assert.*
import org.junit.Test

class KanbanTest {
    @Test fun movesAndReordersWithoutMutation() {
        val columns = listOf(LumenKanbanColumnData("todo", "Todo", listOf(LumenKanbanCard("a", "A"), LumenKanbanCard("b", "B")), 2), LumenKanbanColumnData("done", "Done", emptyList(), 1))
        val model = LumenKanbanModel(columns)
        assertTrue(model.valid)
        assertEquals(listOf("b", "a"), model.moving("a", "todo", 1)?.first()?.cards?.map { it.id })
        assertEquals(listOf("b"), model.moving("b", "done", 0)?.last()?.cards?.map { it.id })
        assertEquals(listOf("a", "b"), columns.first().cards.map { it.id })
        assertNull(model.moving("a", "done", -1))
        assertNull(model.moving("a", "todo", 0))
        assertNull(model.moving("missing", "done", 0))
    }
    @Test fun rejectsInvalidCapacityIdentitiesAndDisabled() {
        assertFalse(LumenKanbanModel(listOf(LumenKanbanColumnData("", "", emptyList()))).valid)
        assertFalse(LumenKanbanModel(listOf(LumenKanbanColumnData("c", "", listOf(LumenKanbanCard("a", ""), LumenKanbanCard("a", ""))))).valid)
        assertFalse(LumenKanbanModel(listOf(LumenKanbanColumnData("c", "", emptyList(), -1))).valid)
        val model = LumenKanbanModel(listOf(LumenKanbanColumnData("a", "", listOf(LumenKanbanCard("card", "")), disabled = true), LumenKanbanColumnData("b", "", emptyList())))
        assertNull(model.moving("card", "b", 0))
    }
    @Test fun respectsCardAndCapacityGuards() {
        val columns = listOf(LumenKanbanColumnData("a", "", listOf(LumenKanbanCard("one", ""), LumenKanbanCard("two", "", disabled = true)), capacity = 2), LumenKanbanColumnData("b", "", emptyList(), capacity = 0))
        val model = LumenKanbanModel(columns)
        assertTrue(model.valid)
        assertNull(model.moving("one", "b", 0))
        assertNull(model.moving("two", "a", 0))
        assertEquals(listOf("two", "one"), model.moving("one", "a", 1)?.first()?.cards?.map { it.id })
        assertNull(model.moving("one", "unknown", 0))
    }
}
