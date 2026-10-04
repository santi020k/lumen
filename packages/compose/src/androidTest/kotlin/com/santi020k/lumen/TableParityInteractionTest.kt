package com.santi020k.lumen

import androidx.activity.ComponentActivity
import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.semantics.SemanticsActions
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.junit4.v2.createAndroidComposeRule
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onRoot
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performSemanticsAction
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

class TableParityInteractionTest {
    @get:Rule val rule = createAndroidComposeRule<ComponentActivity>()
    private val text = "Synthetic record with long content 😀.\nSecond line preserved."
    private val columns = listOf(LumenTableColumn("description", "Long description"), LumenTableColumn("owner", "Owner"),
        LumenTableColumn("status", "Status"))
    private val rows = listOf(LumenTableRow("one", "One record", mapOf("description" to LumenTableCell(text),
        "status" to LumenTableCell("Ready"))))
    @Test fun recordsExposeNamedMissingCellsAndInvalidEmptyRestoreStates() {
        val phase = mutableStateOf(0)
        rule.setContent { LumenTheme { LumenTable("Records", columns,
            when (phase.value) { 1 -> emptyList(); 2 -> rows + rows; else -> rows },
            emptyLabel = "Sin registros", invalidLabel = "Invalid identities", missingLabel = "Faltante") } }
        rule.onNodeWithContentDescription("Long description, $text").assertIsDisplayed()
        rule.onNodeWithContentDescription("Owner, Faltante").assertIsDisplayed()
        rule.runOnIdle { phase.value = 1 }
        rule.onNodeWithText("Sin registros").assertIsDisplayed()
        rule.onNodeWithContentDescription("Long description, $text").assertDoesNotExist()
        rule.runOnIdle { phase.value = 2 }
        rule.onNodeWithText("Invalid identities").assertIsDisplayed()
        rule.onNodeWithContentDescription("Long description, $text").assertDoesNotExist()
        rule.runOnIdle { phase.value = 0 }
        rule.onNodeWithContentDescription("Long description, $text").assertIsDisplayed()
    }
    @Test fun wideCellsUseContainedNativeHorizontalScrollAndAccessibleScrollAction() {
        rule.setContent { LumenTheme { LumenTable("Records", columns, rows, layout = LumenTableLayout.Scroll) } }
        val viewport = rule.onNode(SemanticsMatcher.keyIsDefined(SemanticsProperties.HorizontalScrollAxisRange))
        val rootWidth = rule.onRoot().fetchSemanticsNode().boundsInRoot.width
        assertTrue(viewport.fetchSemanticsNode().boundsInRoot.width <= rootWidth)
        viewport.performSemanticsAction(SemanticsActions.ScrollBy) { it(1000f, 0f) }
        rule.waitForIdle()
        rule.onNodeWithContentDescription("Status, Ready").assertIsDisplayed()
    }
}
