package com.santi020k.lumen.playground.compose

import android.content.pm.ActivityInfo
import android.content.res.Configuration
import androidx.test.platform.app.InstrumentationRegistry
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.unit.Density
import androidx.activity.ComponentActivity
import androidx.compose.ui.test.hasSetTextAction
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.StateRestorationTester
import androidx.compose.ui.test.junit4.v2.createAndroidComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performTextReplacement
import androidx.compose.ui.test.assertIsNotDisplayed
import androidx.compose.ui.test.assertIsDisplayed
import com.santi020k.lumen.LumenTheme
import org.junit.Rule
import org.junit.Test

class WorkspaceExampleTest {
    @get:Rule
    val composeRule = createAndroidComposeRule<ComponentActivity>()

    @Test
    fun savesTheSelectedRecordAndRestoresItsDetailAndDraft() {
        val restoration = StateRestorationTester(composeRule)
        restoration.setContent { LumenTheme { WorkspaceExample(onBack = {}) } }
        composeRule.onNode(hasSetTextAction() and hasText("Search records")).performTextReplacement("Lumen 200")
        composeRule.onNode(hasText("Lumen 200") and !hasSetTextAction()).performClick()
        composeRule.onNodeWithText("Edit record").performClick()
        composeRule.onNode(hasSetTextAction() and hasText("Name")).performTextReplacement("Updated record")
        composeRule.onNode(hasSetTextAction() and hasText("Notes")).performTextReplacement("A saved note")
        restoration.emulateSavedInstanceStateRestore()
        composeRule.onNodeWithText("Updated record").assertIsDisplayed()
        composeRule.onNodeWithText("Save", substring = false).performClick()
        composeRule.onNodeWithText("Changes saved locally").assertIsDisplayed()
        restoration.emulateSavedInstanceStateRestore()
        composeRule.onNodeWithText("Updated record").assertIsDisplayed()
        composeRule.onNodeWithText("A saved note").assertIsDisplayed()
        composeRule.onNodeWithText("Back", substring = false).performClick()
        composeRule.onNodeWithText("No records found").assertIsDisplayed()
        composeRule.onNode(hasSetTextAction() and hasText("Search records")).performTextReplacement("Updated record")
        composeRule.onNode(hasText("Updated record") and !hasSetTextAction()).performClick()
        composeRule.onNodeWithText("A saved note").assertIsDisplayed()
    }

    @Test
    fun largeTextKeepsTheDraftAndUsesSinglePaneBackNavigation() {
        val fontScale = mutableFloatStateOf(1f)
        composeRule.activityRule.scenario.onActivity {
            it.requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE
        }
        composeRule.waitUntil(timeoutMillis = 5_000) {
            composeRule.activity.resources.configuration.orientation == Configuration.ORIENTATION_LANDSCAPE
        }
        InstrumentationRegistry.getInstrumentation().waitForIdleSync()
        try {
            composeRule.setContent {
                val density = LocalDensity.current
                CompositionLocalProvider(LocalDensity provides Density(density.density, fontScale.floatValue)) {
                    LumenTheme { WorkspaceExample(onBack = {}) }
                }
            }
            composeRule.onNode(hasSetTextAction() and hasText("Search records")).performTextReplacement("Lumen 002")
            composeRule.onNode(hasText("Lumen 002") and !hasSetTextAction()).performClick()
            composeRule.onNode(hasSetTextAction() and hasText("Search records")).assertIsDisplayed()
            composeRule.onNodeWithText("Edit record").performClick()
            composeRule.onNode(hasSetTextAction() and hasText("Notes")).performTextReplacement("Draft retained during scaling")
            composeRule.runOnIdle { fontScale.floatValue = 2f }
            composeRule.onNodeWithText("Draft retained during scaling").assertExists()
            composeRule.onNodeWithText("Save", substring = false).performClick()
            composeRule.onNode(hasSetTextAction() and hasText("Search records")).assertIsNotDisplayed()
            composeRule.onNodeWithText("Back", substring = false).performClick()
            composeRule.onNode(hasSetTextAction() and hasText("Search records")).assertExists()
            composeRule.runOnIdle { fontScale.floatValue = 1f }
            composeRule.onNode(hasText("Lumen 002") and !hasSetTextAction()).performClick()
            composeRule.onNodeWithText("Draft retained during scaling").assertIsDisplayed()
        } finally {
            composeRule.activity.requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED
        }
    }

    @Test
    fun cancellationAndStateRecoveryDoNotOverwriteRecords() {
        composeRule.setContent { LumenTheme { WorkspaceExample(onBack = {}) } }
        composeRule.onNode(hasSetTextAction() and hasText("Search records")).performTextReplacement("Lumen 001")
        composeRule.onNode(hasText("Lumen 001") and !hasSetTextAction()).performClick()
        composeRule.onNodeWithText("Edit record").performClick()
        composeRule.onNode(hasSetTextAction() and hasText("Name")).performTextReplacement("Unsaved")
        composeRule.onNodeWithText("Cancel", substring = false).performClick()
        composeRule.onNode(hasText("Lumen 001") and !hasSetTextAction()).assertIsDisplayed()
        composeRule.onNodeWithText("Back", substring = false).performClick()
        composeRule.onNodeWithText("Error", substring = false).performClick()
        composeRule.onNodeWithText("Records could not load").assertIsDisplayed()
        composeRule.onNodeWithText("Retry", substring = false).performClick()
        composeRule.onNode(hasText("Lumen 001") and !hasSetTextAction()).assertIsDisplayed()
    }
}
