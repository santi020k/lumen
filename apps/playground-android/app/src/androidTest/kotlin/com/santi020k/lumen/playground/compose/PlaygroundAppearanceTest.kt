package com.santi020k.lumen.playground.compose

import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.hasSetTextAction
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.v2.createAndroidComposeRule
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performScrollTo
import androidx.compose.ui.test.performTextInput
import androidx.compose.ui.test.performClick
import com.santi020k.lumen.LumenThemePreset
import com.santi020k.lumen.LumenNamedThemes
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

class PlaygroundAppearanceTest {
    @get:Rule
    val composeRule = createAndroidComposeRule<MainActivity>()

    @Test
    fun sharedPresetsRetainBothSchemesAndAppearance() {
        assertEquals(LumenThemePreset.Studio, PlaygroundThemePreset.Studio.shared)
        assertEquals(LumenThemePreset.Glass, PlaygroundThemePreset.Glass.shared)
        assertEquals(PlaygroundThemePreset.Santi020k, PlaygroundThemePreset.fromId("santi020k"))
        assertEquals(PlaygroundThemePreset.Lumen, PlaygroundThemePreset.fromId("retired"))
        assertEquals(LumenNamedThemes.Paper, PlaygroundThemePreset.Paper.named)
        assertEquals(LumenNamedThemes.Field, PlaygroundThemePreset.Field.named)
        assertEquals(LumenNamedThemes.Santi020k, PlaygroundThemePreset.Santi020k.named)
    }

    @Test
    fun settingsSwitchSharedPresetsWithoutLeavingTheDestination() {
        composeRule.onNodeWithText("Settings", substring = false).performClick()
        composeRule.onNodeWithContentDescription("Color scheme").performScrollTo().performClick()
        composeRule.onNodeWithText("Dark", substring = false).performClick()
        for (label in listOf("Studio", "Glass", "santi020k", "Paper", "Field", "Normal")) {
            composeRule.onNodeWithContentDescription("Theme").performScrollTo().performClick()
            composeRule.onNodeWithText(label, substring = false).performClick()
            composeRule.onNodeWithText("$label · Dark", substring = false).performScrollTo().assertIsDisplayed()
        }
    }

    @Test
    fun previewPreservesItsDraftAcrossThemeSelection() {
        composeRule.onNodeWithText("Settings", substring = false).performClick()
        composeRule.onNodeWithText("Open Harbor note").performScrollTo().performClick()
        composeRule.onNode(hasSetTextAction() and hasText("Draft")).performTextInput("Keep this note")
        composeRule.onNodeWithContentDescription("App appearance").performClick()
        composeRule.onNodeWithText("Dark", substring = false).performClick()
        composeRule.onNodeWithText("Harbor Dark").assertIsDisplayed()
        composeRule.onNodeWithText("Keep this note").assertIsDisplayed()
        composeRule.onNodeWithText("Done").performClick()
        composeRule.onNodeWithContentDescription("Theme").performScrollTo().performClick()
        composeRule.onNodeWithText("Paper", substring = false).performClick()
        composeRule.onNodeWithText("Open Harbor note").performScrollTo().performClick()
        composeRule.onNodeWithText("Keep this note").assertIsDisplayed()
    }
}
