package com.santi020k.lumen

import androidx.activity.ComponentActivity
import androidx.compose.foundation.layout.Column
import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toPixelMap
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.test.captureToImage
import androidx.compose.ui.test.junit4.v2.createAndroidComposeRule
import androidx.compose.ui.test.onNodeWithTag
import kotlin.math.abs
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
