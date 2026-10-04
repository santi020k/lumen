package com.santi020k.lumen

import androidx.activity.ComponentActivity
import androidx.compose.foundation.layout.Column
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.test.assertIsNotEnabled
import androidx.compose.ui.test.junit4.v2.createAndroidComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.test.espresso.Espresso.pressBack
import kotlinx.coroutines.launch
import org.junit.Rule
import org.junit.Test

class TooltipParityTest {
    @get:Rule val rule = createAndroidComposeRule<ComponentActivity>()

    @Test fun existingNativeStateSupportsExplicitShowDismissAndDisabledGuards() {
        val enabled = mutableStateOf(true)
        rule.setContent { LumenTheme {
            val state = rememberLumenTooltipState(isPersistent = true)
            val scope = rememberCoroutineScope()
            Column {
                LumenTooltip("Synthetic project explanation", state = state, enabled = enabled.value) {
                    LumenButton(enabled = enabled.value, onClick = { if (enabled.value) scope.launch { state.show() } }) {
                        LumenText("Project help")
                    }
                }
                LumenButton(onClick = { state.dismiss() }) { LumenText("Close explanation") }
            }
        } }
        rule.onNodeWithText("Project help").performClick()
        rule.onNodeWithText("Synthetic project explanation").assertExists()
        rule.onNodeWithText("Close explanation").performClick()
        rule.onNodeWithText("Synthetic project explanation").assertDoesNotExist()
        rule.onNodeWithText("Project help").performClick()
        rule.onNodeWithText("Synthetic project explanation").assertExists()
        pressBack()
        rule.onNodeWithText("Synthetic project explanation").assertDoesNotExist()
        rule.onNodeWithText("Project help").performClick()
        rule.onNodeWithText("Synthetic project explanation").assertExists()
        rule.runOnIdle { enabled.value = false }
        rule.onNodeWithText("Synthetic project explanation").assertDoesNotExist()
        rule.onNodeWithText("Project help").assertIsNotEnabled()
    }
}
