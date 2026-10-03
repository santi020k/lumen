package com.santi020k.lumen.playground.compose

import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.hasSetTextAction
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.v2.createAndroidComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performTextReplacement
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

class WorkspaceActivityTest {
    @get:Rule
    val composeRule = createAndroidComposeRule<MainActivity>()

    @Test
    fun workspaceHeaderRespectsStatusBarInsets() {
        composeRule.onNodeWithText("Examples", substring = false).performClick()
        composeRule.onNodeWithText("Workspace", substring = false).performClick()
        val statusBarInset = requireNotNull(
            ViewCompat.getRootWindowInsets(composeRule.activity.window.decorView)
        ).getInsets(WindowInsetsCompat.Type.statusBars()).top
        val header = composeRule.onNodeWithText("Back to examples").fetchSemanticsNode()
        assertTrue("Workspace header overlaps the status bar", header.boundsInWindow.top >= statusBarInset)
    }

    @Test
    fun activityRecreationKeepsNavigationAndUnsavedWorkspaceDraft() {
        composeRule.onNodeWithText("Examples", substring = false).performClick()
        composeRule.onNodeWithText("Workspace", substring = false).performClick()
        composeRule.onNode(hasSetTextAction() and hasText("Search records")).performTextReplacement("Lumen 200")
        composeRule.onNode(hasText("Lumen 200") and !hasSetTextAction()).performClick()
        composeRule.onNodeWithText("Edit record").performClick()
        composeRule.onNode(hasSetTextAction() and hasText("Name")).performTextReplacement("Retained draft")
        composeRule.activityRule.scenario.recreate()
        composeRule.onNodeWithText("Retained draft").assertIsDisplayed()
        composeRule.onNodeWithText("Save", substring = false).performClick()
        composeRule.onNodeWithText("Changes saved locally").assertIsDisplayed()
        composeRule.activityRule.scenario.recreate()
        composeRule.onNodeWithText("Retained draft").assertIsDisplayed()
        composeRule.onNodeWithText("Changes saved locally").assertIsDisplayed()
    }
}
