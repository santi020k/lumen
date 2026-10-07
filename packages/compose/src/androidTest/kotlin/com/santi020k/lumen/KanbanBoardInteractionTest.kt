package com.santi020k.lumen

import androidx.activity.ComponentActivity
import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.test.assertIsNotEnabled
import androidx.compose.ui.test.junit4.v2.createAndroidComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.onRoot
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performTouchInput
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

class KanbanBoardInteractionTest {
    @get:Rule val rule = createAndroidComposeRule<ComponentActivity>()
    private val work = LumenKanbanColumnData("work", "Work", listOf(LumenKanbanCard("a", "First"), LumenKanbanCard("b", "Second")))

    private fun drag(sourceText: String, destination: Offset) {
        val source = rule.onNodeWithText(sourceText).fetchSemanticsNode().boundsInRoot.center
        rule.onRoot().performTouchInput {
            down(source)
            advanceEventTime(700)
            moveTo(source + Offset(0f, 2f))
            moveTo(destination, delayMillis = 300)
            up()
        }
        rule.waitForIdle()
    }

    @Test fun finalPositionsExposeOnlyRealNeighborsAndRetainCapacityDisabledActions() {
        val columns = mutableStateOf(listOf(work, LumenKanbanColumnData("done", "Done", emptyList(), capacity = 0)))
        rule.setContent { LumenTheme { LumenKanbanBoard("Board", columns.value, { columns.value = it }) } }
        rule.onNodeWithText("Move First to Work, position 0").assertDoesNotExist()
        rule.onNodeWithText("Move Second to Work, position 3").assertDoesNotExist()
        rule.onNodeWithText("Move First to Done, position 1").assertIsNotEnabled()
        rule.onNodeWithText("Move First to Work, position 2").performClick()
        rule.runOnIdle { assertEquals(listOf("b", "a"), columns.value[0].cards.map { it.id }) }
        rule.onNodeWithText("Move First to Work, position 1").performClick()
        rule.runOnIdle { assertEquals(listOf("a", "b"), columns.value[0].cards.map { it.id }) }
    }

    @Test fun longPressDragReordersAndButtonsRestoreControlledOrder() {
        val columns = mutableStateOf(listOf(work))
        rule.setContent { LumenTheme { LumenKanbanBoard("Board", columns.value, { columns.value = it }) } }
        val destination = rule.onNodeWithText("Move Second to Work, position 1").fetchSemanticsNode().boundsInRoot.center
        drag("First", destination)
        rule.runOnIdle { assertEquals(listOf("b", "a"), columns.value[0].cards.map { it.id }) }
        rule.onNodeWithText("Move First to Work, position 1").performClick()
        rule.runOnIdle { assertEquals(listOf("a", "b"), columns.value[0].cards.map { it.id }) }
    }

    @Test fun longPressDragMovesBetweenVisibleColumnsAndRejectsCapacityOrReadOnly() {
        val done = LumenKanbanColumnData("done", "Done", emptyList(), capacity = 1)
        val columns = mutableStateOf(listOf(work, done))
        val readOnly = mutableStateOf(false)
        var proposals = 0
        rule.setContent { LumenTheme {
            LumenKanbanBoard("Board", columns.value, { columns.value = it; proposals++ }, readOnly = readOnly.value)
        } }
        fun destination(): Offset {
            val bounds = rule.onNodeWithText("Done").fetchSemanticsNode().boundsInRoot
            return Offset(bounds.left + 4f, bounds.center.y)
        }
        drag("First", destination())
        rule.runOnIdle {
            assertEquals(listOf("b"), columns.value[0].cards.map { it.id })
            assertEquals(listOf("a"), columns.value[1].cards.map { it.id })
            assertEquals(1, proposals)
            columns.value = listOf(work, done.copy(cards = listOf(LumenKanbanCard("locked", "Locked"))))
        }
        drag("First", destination())
        rule.runOnIdle {
            assertEquals(1, proposals)
            columns.value = listOf(work, done)
            readOnly.value = true
        }
        drag("First", destination())
        rule.runOnIdle { assertEquals(1, proposals); assertEquals(listOf("a", "b"), columns.value[0].cards.map { it.id }) }
    }
}
