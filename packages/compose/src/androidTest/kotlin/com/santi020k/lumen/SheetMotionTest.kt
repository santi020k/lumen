package com.santi020k.lumen

import androidx.activity.ComponentActivity
import androidx.compose.material3.Text
import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.junit4.v2.createAndroidComposeRule
import androidx.compose.ui.test.onNodeWithText
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

class SheetMotionTest {
    @get:Rule
    val composeRule = createAndroidComposeRule<ComponentActivity>()

    @Test
    fun controlledCloseKeepsContentUntilTheExitFinishes() {
        val visible = mutableStateOf(true)
        var dismissals = 0
        composeRule.mainClock.autoAdvance = false
        composeRule.setContent {
            LumenTheme { LumenSheet(visible.value, { dismissals++ }) { Text("Animated sheet") } }
        }
        composeRule.mainClock.advanceTimeBy(1_000)
        composeRule.waitForIdle()
        composeRule.onNodeWithText("Animated sheet").assertIsDisplayed()
        composeRule.runOnIdle { visible.value = false }
        composeRule.mainClock.advanceTimeByFrame()
        composeRule.onNodeWithText("Animated sheet").assertExists()
        composeRule.mainClock.advanceTimeBy(1_000)
        composeRule.waitForIdle()
        composeRule.onNodeWithText("Animated sheet").assertDoesNotExist()
        assertEquals(0, dismissals)
    }

    @Test
    fun reopeningCancelsAnExitAndProgrammaticCloseOverridesDismissible() {
        val visible = mutableStateOf(true)
        composeRule.mainClock.autoAdvance = false
        composeRule.setContent {
            LumenTheme { LumenSheet(visible.value, {}, dismissible = false) { Text("Protected sheet") } }
        }
        composeRule.mainClock.advanceTimeBy(1_000)
        composeRule.waitForIdle()
        composeRule.runOnIdle { visible.value = false }
        composeRule.mainClock.advanceTimeBy(48)
        composeRule.runOnIdle { visible.value = true }
        composeRule.mainClock.advanceTimeBy(1_000)
        composeRule.waitForIdle()
        composeRule.onNodeWithText("Protected sheet").assertIsDisplayed()
        composeRule.runOnIdle { visible.value = false }
        composeRule.mainClock.advanceTimeBy(1_000)
        composeRule.waitForIdle()
        composeRule.onNodeWithText("Protected sheet").assertDoesNotExist()
    }

    @Test
    fun cancellingAnEntranceDoesNotLeaveAHiddenModalMounted() {
        val visible = mutableStateOf(false)
        composeRule.mainClock.autoAdvance = false
        composeRule.setContent {
            LumenTheme { LumenSheet(visible.value, {}) { Text("Brief sheet") } }
        }
        composeRule.onNodeWithText("Brief sheet").assertDoesNotExist()
        composeRule.runOnIdle { visible.value = true }
        composeRule.mainClock.advanceTimeByFrame()
        composeRule.runOnIdle { visible.value = false }
        composeRule.mainClock.advanceTimeBy(1_000)
        composeRule.waitForIdle()
        composeRule.onNodeWithText("Brief sheet").assertDoesNotExist()
    }
}
