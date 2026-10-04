package com.santi020k.lumen

import androidx.activity.ComponentActivity
import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.test.assertIsNotEnabled
import androidx.compose.ui.test.junit4.v2.createAndroidComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

class TreeGridAccessibilityTest {
    @get:Rule val rule = createAndroidComposeRule<ComponentActivity>()
    private val columns = listOf(LumenTreeGridColumn("status", "Status"))
    private val records = listOf(
        LumenTreeGridRecord(LumenTreeNode("root", "Packages"), mapOf("status" to LumenTableCell("Group"))),
        LumenTreeGridRecord(LumenTreeNode("child", "Astro", "root"), mapOf("status" to LumenTableCell("Ready"))),
        LumenTreeGridRecord(LumenTreeNode("locked", "Locked", disabled = true), emptyMap()),
        LumenTreeGridRecord(LumenTreeNode("locked-child", "Locked child", "locked"), emptyMap())
    )
    @Test fun disclosuresPreserveUnknownIdsAndReadOnlyCustomCellsAreGuarded() {
        val expanded = mutableStateOf(setOf("root", "unknown"))
        var cellClicks = 0
        rule.setContent { LumenTheme {
            LumenTreeGrid("Project status", columns, records, expanded.value, { expanded.value = it }, readOnly = true,
                cellContent = { record, _, cell, enabled, readOnly ->
                    LumenButton(enabled = enabled && !readOnly, onClick = { cellClicks++ }) { LumenText("Open ${record.node.label}") }
                    LumenText(cell?.text ?: "Unavailable")
                })
        } }
        rule.onNodeWithText("Ready").assertExists()
        rule.onNodeWithText("Open Packages").assertIsNotEnabled()
        rule.onNodeWithText("Expand Locked").assertIsNotEnabled()
        rule.onNodeWithText("Collapse Packages").performClick()
        rule.runOnIdle { assertEquals(setOf("unknown"), expanded.value); assertEquals(0, cellClicks) }
        rule.onNodeWithText("Ready").assertDoesNotExist()
        rule.onNodeWithText("Expand Packages").performClick()
        rule.onNodeWithText("Ready").assertExists()
        rule.runOnIdle { assertEquals(setOf("unknown", "root"), expanded.value) }
    }
    @Test fun statusAndInvalidDataHideStaleControlsAndEmptyIsLocalized() {
        val phase = mutableStateOf(0)
        rule.setContent { LumenTheme {
            val source = when (phase.value) {
                3 -> listOf(LumenTreeGridRecord(LumenTreeNode("cycle", "Cycle", "cycle"), emptyMap()))
                4 -> emptyList()
                else -> records
            }
            LumenTreeGrid("Project status", columns, source, emptySet(), {}, loading = phase.value == 1,
                error = if (phase.value == 2) "Synthetic error" else null,
                loadingLabel = "Loading project records", emptyLabel = "No project records", invalidLabel = "Invalid project records")
        } }
        rule.onNodeWithText("Expand Packages").assertExists()
        for ((value, message) in listOf(1 to "Loading project records", 2 to "Synthetic error", 3 to "Invalid project records", 4 to "No project records")) {
            rule.runOnIdle { phase.value = value }
            rule.onNodeWithText(message).assertExists()
            rule.onNodeWithText("Expand Packages").assertDoesNotExist()
        }
    }
}
