package com.santi020k.lumen

import androidx.activity.ComponentActivity
import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.test.assertIsNotEnabled
import androidx.compose.ui.test.junit4.v2.createAndroidComposeRule
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

class DataTableInteractionTest {
    @get:Rule val rule = createAndroidComposeRule<ComponentActivity>()
    private val columns = listOf(LumenTableColumn("amount", "Amount", sortable = true))
    private val rows = listOf(
        LumenTableRow("large", "Large", mapOf("amount" to LumenTableCell("20 items", LumenTableSortValue.Number(20.0)))),
        LumenTableRow("small", "Small", mapOf("amount" to LumenTableCell("2 items", LumenTableSortValue.Number(2.0)))),
        LumenTableRow("locked", "Locked", mapOf("amount" to LumenTableCell("Missing", LumenTableSortValue.Missing)), enabled = false)
    )
    @Test fun nativeSortCyclesAndManualModeKeepsHostOrder() {
        val sort = mutableStateOf<LumenTableSort?>(null)
        val client = mutableStateOf(true)
        rule.setContent { LumenTheme {
            LumenDataTable("Synthetic records", columns, rows, sort = sort.value,
                sortMode = if (client.value) LumenTableSortMode.Client else LumenTableSortMode.Manual,
                onSortChange = { sort.value = it }, onSelectionChange = {},
                formatSort = { it?.direction?.name ?: "None" })
        } }
        rule.onNodeWithText("Amount").performClick()
        rule.runOnIdle { assertEquals(LumenTableSort("amount", LumenTableSortDirection.Ascending), sort.value) }
        assertTrue(rule.onNodeWithText("Small").fetchSemanticsNode().boundsInRoot.top < rule.onNodeWithText("Large").fetchSemanticsNode().boundsInRoot.top)
        rule.onNodeWithText("Amount, Ascending").performClick()
        rule.runOnIdle { assertEquals(LumenTableSortDirection.Descending, sort.value?.direction) }
        assertTrue(rule.onNodeWithText("Large").fetchSemanticsNode().boundsInRoot.top < rule.onNodeWithText("Small").fetchSemanticsNode().boundsInRoot.top)
        rule.onNodeWithText("Amount, Descending").performClick()
        rule.runOnIdle { assertEquals(null, sort.value); client.value = false }
        rule.onNodeWithText("Amount").performClick()
        rule.runOnIdle { assertEquals(LumenTableSortDirection.Ascending, sort.value?.direction) }
        assertTrue(rule.onNodeWithText("Large").fetchSemanticsNode().boundsInRoot.top < rule.onNodeWithText("Small").fetchSemanticsNode().boundsInRoot.top)
    }
    @Test fun bulkSelectionRetainsHiddenDisabledIdsAndReadOnlyBlocksChanges() {
        val selected = mutableStateOf(setOf("hidden", "locked"))
        val locked = mutableStateOf(false)
        rule.setContent { LumenTheme {
            LumenDataTable("Synthetic records", columns, rows, selectedIds = selected.value,
                onSelectionChange = { selected.value = it }, onSortChange = {}, readOnly = locked.value,
                selectAllLabel = "Choose visible records", deselectAllLabel = "Clear visible records")
        } }
        rule.onNodeWithText("Locked").assertIsNotEnabled()
        rule.onNodeWithText("Choose visible records").performClick()
        rule.runOnIdle { assertEquals(setOf("hidden", "locked", "large", "small"), selected.value) }
        rule.onNodeWithText("Clear visible records").performClick()
        rule.runOnIdle { assertEquals(setOf("hidden", "locked"), selected.value) }
        rule.onNodeWithText("Small").performClick()
        rule.runOnIdle { assertEquals(setOf("hidden", "locked", "small"), selected.value); locked.value = true }
        rule.onNodeWithText("Small").assertIsNotEnabled()
        rule.onNodeWithText("Amount").assertIsNotEnabled()
        rule.onNodeWithText("Choose visible records").assertIsNotEnabled()
    }
    @Test fun loadingErrorRetryEmptyAndInvalidStatesReplaceStaleControls() {
        val phase = mutableStateOf(0)
        var retries = 0
        rule.setContent { LumenTheme {
            val records = when (phase.value) { 3 -> emptyList(); 4 -> listOf(rows[0], rows[0]); else -> rows }
            LumenDataTable("Synthetic records", columns, records, onSortChange = {}, onSelectionChange = {},
                loading = phase.value == 1, loadingLabel = "Loading records", error = if (phase.value == 2) "Records unavailable" else null,
                onRetry = { retries++; phase.value = 0 }, retryLabel = "Retry records", emptyLabel = "No records here", invalidLabel = "Invalid record IDs")
        } }
        rule.onNodeWithText("Amount").assertExists()
        rule.runOnIdle { phase.value = 1 }
        rule.onNodeWithContentDescription("Loading records").assertExists()
        rule.onNodeWithText("Amount").assertDoesNotExist()
        rule.runOnIdle { phase.value = 2 }
        rule.onNodeWithText("Records unavailable").assertExists()
        rule.onNodeWithText("Amount").assertDoesNotExist()
        rule.onNodeWithText("Retry records").performClick()
        rule.runOnIdle { assertEquals(1, retries) }
        rule.onNodeWithText("Amount").assertExists()
        for ((value, message) in listOf(3 to "No records here", 4 to "Invalid record IDs")) {
            rule.runOnIdle { phase.value = value }
            rule.onNodeWithText(message).assertExists()
            rule.onNodeWithText("Amount").assertDoesNotExist()
        }
    }
}
