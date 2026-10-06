package com.santi020k.lumen.playground.compose

import androidx.activity.ComponentActivity
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.junit4.v2.createAndroidComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import com.santi020k.lumen.LumenTheme
import org.junit.Rule
import org.junit.Test

class MotionExampleTest {
    @get:Rule
    val composeRule = createAndroidComposeRule<ComponentActivity>()

    @Test
    fun expansionAndFeedbackWorkWithReducedEffects() {
        composeRule.setContent { LumenTheme { MotionExample() } }
        composeRule.onNodeWithText("Reduce demo effects").performClick()
        composeRule.onNodeWithText("Demo effects are immediate.").assertIsDisplayed()
        composeRule.onNodeWithText("Expandable details").performClick()
        composeRule.onNodeWithText("Content stays readable while its surrounding layout changes.").assertIsDisplayed()
        composeRule.onNodeWithText("Simulate save").performClick()
        composeRule.waitUntil(5_000) {
            composeRule.onAllNodes(androidx.compose.ui.test.hasText("Demonstration saved.")).fetchSemanticsNodes().isNotEmpty()
        }
        composeRule.onNodeWithText("Demonstration saved.").assertIsDisplayed()
    }

    @Test
    fun nativeSheetClosesAndReopens() {
        composeRule.setContent { LumenTheme { MotionExample() } }
        composeRule.onNodeWithText("Open sheet").performClick()
        composeRule.onNodeWithText("Close sheet").assertIsDisplayed().performClick()
        composeRule.waitForIdle()
        composeRule.onNodeWithText("Close sheet").assertDoesNotExist()
        composeRule.onNodeWithText("Open sheet").performClick()
        composeRule.onNodeWithText("Close sheet").assertIsDisplayed()
    }
}
