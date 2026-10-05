package com.santi020k.lumen

import androidx.activity.ComponentActivity
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toPixelMap
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.test.assertIsNotEnabled
import androidx.compose.ui.test.captureToImage
import androidx.compose.ui.test.junit4.v2.createAndroidComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.unit.dp
import kotlin.math.abs
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

class TimelineParityInteractionTest {
    @get:Rule val rule = createAndroidComposeRule<ComponentActivity>()
    @Test fun terminalConnectorMatchesReferenceInBothRenderedThemes() {
        val dark = mutableStateOf(false)
        var density = 1f
        rule.setContent { LumenTheme(darkTheme = dark.value) { LumenSurface(tone = LumenSurfaceTone.Canvas) {
            density = LocalDensity.current.density
            Column {
                LumenTimelineItem(modifier = Modifier.testTag("continuing").fillMaxWidth().heightIn(min = 80.dp)) { LumenText("Continuing event") }
                LumenTimelineItem(modifier = Modifier.testTag("terminal").fillMaxWidth().heightIn(min = 80.dp), isLast = true) { LumenText("Terminal event") }
            }
        } } }
        for (appearance in listOf(false, true)) {
            rule.runOnIdle { dark.value = appearance }
            rule.waitForIdle()
            val colors = LumenThemeValues.preset(LumenThemePreset.Default, appearance).colors
            assertTrue("Continuing connector must render in the marker rail", linePixels("continuing", colors.line, colors.canvas, density) > 20)
            assertEquals("Terminal connector must be absent", 0, linePixels("terminal", colors.line, colors.canvas, density))
        }
    }
    private fun linePixels(tag: String, color: Color, background: Color, density: Float): Int {
        val pixels = rule.onNodeWithTag(tag, useUnmergedTree = true).captureToImage().toPixelMap()
        val base = floatArrayOf(background.red, background.green, background.blue)
        val target = floatArrayOf(color.red, color.green, color.blue)
        val channel = (0..2).maxBy { abs(target[it] - base[it]) }
        val delta = target[channel] - base[channel]
        assertTrue("Connector color must differ from its background", abs(delta) > 0.01f)
        var matches = 0
        // Inspect the marker rail below the dot, using dp rather than fixed screenshot pixels.
        for (y in (12 * density).toInt() until pixels.height) for (x in 0 until minOf((20 * density).toInt(), pixels.width)) {
            val pixel = pixels[x, y]
            val actual = floatArrayOf(pixel.red, pixel.green, pixel.blue)
            val coverage = (actual[channel] - base[channel]) / delta
            // A one-pixel stroke centered between pixels has partial antialias coverage.
            if (coverage in 0.2f..1.05f && (0..2).all {
                    abs(actual[it] - (base[it] + (target[it] - base[it]) * coverage)) < 0.015f
                }) matches++
        }
        return matches
    }
    @Test fun hostContentActionsRemainAccessibleAndDecorativeMarkersStayHidden() {
        val disabled = mutableStateOf(false)
        var selected = ""
        rule.setContent { LumenTheme { LumenTimeline("Synthetic history") {
            LumenTimelineItem(dot = { LumenText("Decorative marker") }) {
                LumenText("Long first event\nUnicode 😀")
                LumenButton(onClick = { selected = "first" }, enabled = !disabled.value) { LumenText("View first") }
            }
            LumenTimelineItem(isLast = true) {
                LumenText("Last event")
                LumenButton(onClick = { selected = "last" }) { LumenText("View last") }
            }
        } } }
        rule.onNodeWithText("Decorative marker").assertDoesNotExist()
        rule.onNodeWithText("View first").performClick()
        rule.runOnIdle { assertEquals("first", selected); disabled.value = true }
        rule.onNodeWithText("View first").assertIsNotEnabled()
        rule.onNodeWithText("View last").performClick()
        rule.runOnIdle { assertEquals("last", selected) }
        assertTrue(rule.onNodeWithText("Long first event\nUnicode 😀").fetchSemanticsNode().boundsInRoot.top <
            rule.onNodeWithText("Last event").fetchSemanticsNode().boundsInRoot.top)
    }
}
