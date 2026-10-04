package com.santi020k.lumen

import androidx.activity.ComponentActivity
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toPixelMap
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
        rule.setContent { LumenTheme(darkTheme = dark.value) { LumenSurface(tone = LumenSurfaceTone.Canvas) {
            Column {
                LumenTimelineItem(modifier = Modifier.testTag("continuing").fillMaxWidth().heightIn(min = 80.dp)) { LumenText("Continuing event") }
                LumenTimelineItem(modifier = Modifier.testTag("terminal").fillMaxWidth().heightIn(min = 80.dp), isLast = true) { LumenText("Terminal event") }
            }
        } } }
        for (appearance in listOf(false, true)) {
            rule.runOnIdle { dark.value = appearance }
            rule.waitForIdle()
            val line = LumenThemeValues.preset(LumenThemePreset.Default, appearance).colors.line
            assertTrue(linePixels("continuing", line) > 20)
            assertEquals(0, linePixels("terminal", line))
        }
    }
    private fun linePixels(tag: String, color: Color): Int {
        val pixels = rule.onNodeWithTag(tag, useUnmergedTree = true).captureToImage().toPixelMap()
        var matches = 0
        // Content begins 36dp from the edge; inspect only the decorative marker rail.
        for (y in 0 until pixels.height) for (x in 0 until minOf(40, pixels.width)) {
            val pixel = pixels[x, y]
            if (abs(pixel.red - color.red) < 0.015f && abs(pixel.green - color.green) < 0.015f &&
                abs(pixel.blue - color.blue) < 0.015f) matches++
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
