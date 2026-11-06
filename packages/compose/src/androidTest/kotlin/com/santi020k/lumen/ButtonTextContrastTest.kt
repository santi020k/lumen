package com.santi020k.lumen

import androidx.activity.ComponentActivity
import androidx.compose.foundation.layout.Column
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Typography
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.SideEffect
import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toPixelMap
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.SemanticsActions
import androidx.compose.ui.test.captureToImage
import androidx.compose.ui.test.performSemanticsAction
import androidx.compose.ui.text.TextLayoutResult
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.test.junit4.v2.createAndroidComposeRule
import androidx.compose.ui.test.onNodeWithTag
import kotlin.math.abs
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

class ButtonTextContrastTest {
    @get:Rule
    val composeRule = createAndroidComposeRule<ComponentActivity>()

    @Test
    fun defaultLabelsInheritButtonForegroundWhileExplicitTonesAndBodyStaySemantic() {
        val dark = mutableStateOf(false)
        composeRule.setContent {
            LumenTheme(darkTheme = dark.value) {
                LumenSurface(tone = LumenSurfaceTone.Canvas) {
                    Column {
                        LumenText("BODY", modifier = Modifier.testTag("body"))
                        LumenIcon(LumenIconName.Check, modifier = Modifier.testTag("body-icon"), contentDescription = "Body icon")
                        LumenButton(onClick = {}) {
                            LumenText("LABEL", modifier = Modifier.testTag("label"))
                            LumenIcon(LumenIconName.Check, modifier = Modifier.testTag("button-icon"), contentDescription = "Button icon")
                            LumenText("DANGER", modifier = Modifier.testTag("danger"), tone = LumenTextTone.Danger)
                        }
                    }
                }
            }
        }
        for (appearance in listOf(false, true)) {
            composeRule.runOnIdle { dark.value = appearance }
            composeRule.waitForIdle()
            val colors = LumenThemeValues.preset(LumenThemePreset.Default, appearance).colors
            assertTextColor("body", colors.ink)
            assertTextColor("label", colors.onBrand)
            assertTextColor("body-icon", colors.ink)
            assertTextColor("button-icon", colors.onBrand)
            assertTextColor("danger", colors.danger)
        }
    }

    @Test
    fun scopedThemesFollowParentOrPinAcrossAnOpenSheet() {
        val dark = mutableStateOf(false)
        val visible = mutableStateOf(false)
        composeRule.setContent {
            LumenTheme(darkTheme = dark.value) {
                Column {
                    LumenThemeScope(LumenNamedThemes.Santi020k) {
                        LumenButton(onClick = {}, modifier = Modifier.testTag("action-bg")) {
                            LumenText("Save", modifier = Modifier.testTag("action-text"))
                        }
                        LumenText("Warning", modifier = Modifier.testTag("warning-text"), tone = LumenTextTone.Warning)
                        LumenBadge("Error", modifier = Modifier.testTag("danger-badge"), tone = LumenBadgeTone.Danger)
                        LumenButton(onClick = {}, intent = LumenButtonIntent.Success) {
                            LumenText("Ready", modifier = Modifier.testTag("success-text"))
                        }
                    }
                    LumenThemeScope(LumenNamedThemes.Paper, darkTheme = false) {
                        LumenSheet(visible = visible.value, onDismiss = {}, title = "Proof") {
                            LumenText("Note", modifier = Modifier.testTag("sheet-text"))
                        }
                    }
                }
            }
        }
        for (isDark in listOf(false, true)) {
            composeRule.runOnIdle { dark.value = isDark }
            composeRule.waitForIdle()
            val colors = LumenNamedThemes.Santi020k.values(isDark).colors
            assertTextColor("action-bg", colors.ink)
            assertTextColor("action-text", colors.surface)
            val theme = LumenNamedThemes.Santi020k
            val statusText = if (isDark) theme.darkStatusText else theme.lightStatusText
            assertTextColor("danger-badge", statusText ?: colors.danger)
            assertTextColor("warning-text", statusText ?: colors.warning)
            assertTextColor("success-text", requireNotNull(if (isDark) theme.darkOnSuccess else theme.lightOnSuccess))
        }
        composeRule.runOnIdle { visible.value = true }
        for (isDark in listOf(true, false)) {
            composeRule.runOnIdle { dark.value = isDark }
            composeRule.waitForIdle()
            assertTextColor("sheet-text", LumenNamedThemes.Paper.light.ink)
        }
    }

    @Test
    fun paperUsesAnEditorialFamilyAndRespectsHostTypographyAndMaterialColors() {
        val product = mutableStateOf(false)
        val defaults = Typography()
        val custom = defaults.copy(headlineSmall = defaults.headlineSmall.copy(fontFamily = FontFamily.Monospace))
        val material = lightColorScheme(primary = Color.Magenta)
        var actualPrimary: Color? = null
        composeRule.setContent {
            LumenThemeScope(
                LumenNamedThemes.Paper, darkTheme = false,
                typography = if (product.value) custom else defaults,
                materialColorScheme = if (product.value) material else null
            ) {
                val primary = MaterialTheme.colorScheme.primary
                SideEffect { actualPrimary = primary }
                LumenText("Heading", modifier = Modifier.testTag("heading"), variant = LumenTextVariant.Title)
            }
        }
        for (customized in listOf(false, true)) {
            composeRule.runOnIdle { product.value = customized }
            val layouts = mutableListOf<TextLayoutResult>()
            composeRule.onNodeWithTag("heading").performSemanticsAction(SemanticsActions.GetTextLayoutResult) {
                it(layouts)
            }
            assertEquals(if (customized) FontFamily.Monospace else FontFamily.Serif, layouts.single().layoutInput.style.fontFamily)
            assertEquals(if (customized) material.primary else LumenNamedThemes.Paper.light.brandSolid, actualPrimary)
        }
    }

    private fun assertTextColor(tag: String, expected: Color) {
        val pixels = composeRule.onNodeWithTag(tag, useUnmergedTree = true).captureToImage().toPixelMap()
        var found = false
        for (y in 0 until pixels.height) {
            for (x in 0 until pixels.width) {
                val pixel = pixels[x, y]
                if (abs(pixel.red - expected.red) < 0.025f &&
                    abs(pixel.green - expected.green) < 0.025f &&
                    abs(pixel.blue - expected.blue) < 0.025f) found = true
            }
        }
        assertTrue("Expected semantic foreground in rendered $tag text", found)
    }
}
