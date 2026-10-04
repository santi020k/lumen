package com.santi020k.lumen.playground.compose

import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.junit4.v2.createAndroidComposeRule
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import com.santi020k.lumen.LumenThemePreset
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

class PlaygroundAppearanceTest {
    @get:Rule
    val composeRule = createAndroidComposeRule<MainActivity>()

    @Test
    fun sharedPresetsRetainBothSchemesAndAppearance() {
        for (dark in listOf(false, true)) {
            for ((playground, shared) in listOf(
                PlaygroundThemePreset.Studio to LumenThemePreset.Studio,
                PlaygroundThemePreset.Glass to LumenThemePreset.Glass
            )) {
                val values = playground.values(dark)
                assertEquals(dark, values.isDark)
                assertEquals(shared.colors(dark), values.colors)
                assertEquals(shared.appearance, values.appearance)
            }
        }
    }

    @Test
    fun settingsSwitchSharedPresetsWithoutLeavingTheDestination() {
        composeRule.onNodeWithText("Settings", substring = false).performClick()
        for (label in listOf("Studio", "Glass", "Normal")) {
            composeRule.onNodeWithContentDescription("Theme").performClick()
            composeRule.onNodeWithText(label, substring = false).performClick()
            composeRule.onNodeWithText("$label · Light", substring = false).assertIsDisplayed()
        }
    }
}
