package com.santi020k.lumen

import androidx.activity.ComponentActivity
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.Modifier
import androidx.compose.ui.test.assertIsNotEnabled
import androidx.compose.ui.test.junit4.v2.createAndroidComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

class KanbanColumnAccessibilityTest {
    @get:Rule val rule = createAndroidComposeRule<ComponentActivity>()

    @Test fun reorderDetailsAndAddAreControlledAndReadOnlyGuardsMutation() {
        val column = mutableStateOf(LumenKanbanColumnData("todo", "Todo", listOf(
            LumenKanbanCard("a", "A"), LumenKanbanCard("b", "B")
        ), capacity = 3))
        val readOnly = mutableStateOf(false)
        var opened = ""
        var adds = 0
        rule.setContent { LumenTheme {
            Column(Modifier.verticalScroll(rememberScrollState())) {
                LumenKanbanColumn(column.value, { column.value = it }, readOnly = readOnly.value,
                    onAdd = { adds++ }, onCardPress = { opened = it },
                    formatCount = { count, _ -> "$count tasks" })
            }
        } }
        rule.onNodeWithText("2 tasks").assertExists()
        rule.onNodeWithText("Move A to position 2").performScrollTo().performClick()
        rule.runOnIdle { assertEquals(listOf("b", "a"), column.value.cards.map { it.id }) }
        rule.onNodeWithText("Open A").performScrollTo().performClick()
        rule.onNodeWithText("Add card").performScrollTo().performClick()
        rule.runOnIdle { assertEquals("a", opened); assertEquals(1, adds); readOnly.value = true }
        rule.onNodeWithText("Move A to position 1").assertIsNotEnabled()
        rule.onNodeWithText("Add card").assertIsNotEnabled()
        rule.onNodeWithText("Open A").performScrollTo().performClick()
    }

    @Test fun onlyReachableNeighborTargetsRemainAfterControlledUpdates() {
        val column = mutableStateOf(LumenKanbanColumnData("c", "Column", listOf(
            LumenKanbanCard("a", "A"), LumenKanbanCard("b", "B"), LumenKanbanCard("c", "C")
        )))
        rule.setContent { LumenTheme {
            Column(Modifier.verticalScroll(rememberScrollState())) {
                LumenKanbanColumn(column.value, { column.value = it })
            }
        } }
        rule.onNodeWithText("Move A to position 0").assertDoesNotExist()
        rule.onNodeWithText("Move C to position 4").assertDoesNotExist()
        rule.onNodeWithText("Move B to position 1").assertExists()
        rule.onNodeWithText("Move B to position 3").performScrollTo().performClick()
        rule.runOnIdle { assertEquals(listOf("a", "c", "b"), column.value.cards.map { it.id }) }
        rule.onNodeWithText("Move B to position 2").assertExists()
        rule.onNodeWithText("Move B to position 4").assertDoesNotExist()
        rule.runOnIdle { column.value = column.value.copy(cards = listOf(LumenKanbanCard("b", "B"))) }
        rule.onNodeWithText("Move B to position 0").assertDoesNotExist()
        rule.onNodeWithText("Move B to position 2").assertDoesNotExist()
    }

    @Test fun capacityEmptyAndStatusStatesExposeOnlyCurrentControls() {
        val loading = mutableStateOf(false)
        val column = mutableStateOf(LumenKanbanColumnData("c", "Column", emptyList(), capacity = 0))
        rule.setContent { LumenTheme {
            LumenKanbanColumn(column.value, { column.value = it }, loading = loading.value,
                loadingLabel = "Waiting", emptyLabel = "Nothing here", onAdd = {})
        } }
        rule.onNodeWithText("Nothing here").assertExists()
        rule.onNodeWithText("Add card").assertIsNotEnabled()
        rule.runOnIdle { loading.value = true }
        rule.onNodeWithText("Waiting").assertExists()
        rule.onNodeWithText("Add card").assertDoesNotExist()
        rule.runOnIdle { loading.value = false; column.value = column.value.copy(capacity = -1) }
        rule.onNodeWithText("Invalid column data").assertExists()
        rule.onNodeWithText("Add card").assertDoesNotExist()
    }
}
