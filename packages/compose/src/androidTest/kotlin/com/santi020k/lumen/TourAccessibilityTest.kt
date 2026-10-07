package com.santi020k.lumen

import androidx.activity.ComponentActivity
import androidx.compose.foundation.layout.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.input.key.Key
import androidx.compose.ui.layout.boundsInParent
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.v2.createAndroidComposeRule
import androidx.compose.ui.unit.dp
import org.junit.Assert.*
import org.junit.Rule
import org.junit.Test

class TourAccessibilityTest {
    @get:Rule val rule = createAndroidComposeRule<ComponentActivity>()
    private val steps = listOf(LumenTourStep("first", "anchor", "First target", "Guidance for a real control"),
        LumenTourStep("disabled", "anchor", "Disabled step", "Skipped", true),
        LumenTourStep("last", "missing", "Optional target", "Missing targets remain safely navigable"))
    @Test fun realMeasuredHighlightNavigationAndFinishRemainControlled() {
        val open = mutableStateOf(true)
        val index = mutableStateOf(0)
        val anchors = mutableStateOf<Map<String, LumenTourRect>>(emptyMap())
        var finished: String? = null
        rule.setContent { LumenTheme {
            val density = LocalDensity.current.density
            LumenTour("Tour", steps, anchors.value, open.value, { open.value = it }, index.value, { index.value = it },
                { finished = it.id }, modifier = Modifier.size(350.dp, 600.dp)) {
                Box(Modifier.fillMaxSize()) {
                    LumenButton(onClick = {}, modifier = Modifier.offset(20.dp, 80.dp).size(120.dp, 44.dp).onGloballyPositioned {
                        val rect = it.boundsInParent()
                        anchors.value = mapOf("anchor" to LumenTourRect(rect.left.toDouble() / density, rect.top.toDouble() / density, rect.width.toDouble() / density, rect.height.toDouble() / density))
                    }) { LumenText("Underlying target") }
                }
            }
        } }
        rule.onNodeWithTag("tour-highlight").assertIsDisplayed().assertLeftPositionInRootIsEqualTo(20.dp).assertTopPositionInRootIsEqualTo(80.dp).assertWidthIsEqualTo(120.dp).assertHeightIsEqualTo(44.dp)
        rule.onNodeWithText("Underlying target").assertDoesNotExist()
        rule.onNodeWithText("Previous").assertIsNotEnabled()
        rule.onNodeWithText("Next").performScrollTo().performClick()
        rule.runOnIdle { assertEquals(2, index.value); assertTrue(open.value) }
        rule.onNodeWithTag("tour-highlight").assertDoesNotExist()
        rule.onNodeWithText("Target unavailable").assertExists()
        rule.onNodeWithText("Finish").performScrollTo().performClick()
        rule.runOnIdle { assertEquals("last", finished); assertTrue(open.value); assertEquals(2, index.value) }
        rule.onNodeWithText("Previous").performScrollTo().performClick()
        rule.runOnIdle { assertEquals(0, index.value) }
        rule.onNodeWithTag("tour-highlight").assertExists()
        rule.onNodeWithText("Close tour").performScrollTo().performClick()
        rule.runOnIdle { assertFalse(open.value); assertEquals(0, index.value) }
        rule.onNodeWithText("Underlying target").assertExists()
    }
    @Test fun readOnlyBackLoadingEscapeAndInvalidCloseRemainUsable() {
        val open = mutableStateOf(true)
        val readOnly = mutableStateOf(true)
        val loading = mutableStateOf(false)
        val data = mutableStateOf(steps)
        var changes = 0
        rule.setContent { LumenTheme {
            LumenTour("Tour", data.value, emptyMap(), open.value, { open.value = it }, 0, { changes++ }, { changes++ },
                modifier = Modifier.size(350.dp, 600.dp), readOnly = readOnly.value, loading = loading.value, loadingLabel = "Waiting") {
                Box(Modifier.fillMaxSize()) { LumenText("Host content") }
            }
        } }
        rule.onNodeWithText("Next").assertIsNotEnabled()
        // Await native input focus, then send a real Back event to the popup.
        pressBackOnFocusedPopup(rule)
        rule.runOnIdle { assertFalse(open.value); assertEquals(0, changes); open.value = true; loading.value = true }
        rule.onNodeWithText("Waiting").assertExists()
        rule.onNodeWithTag("tour-highlight").assertDoesNotExist()
        rule.onNodeWithText("Next").assertDoesNotExist()
        rule.onNode(SemanticsMatcher.expectValue(SemanticsProperties.PaneTitle, "Tour")).assertIsFocused().performKeyInput { pressKey(Key.Escape) }
        rule.runOnIdle { assertFalse(open.value); open.value = true; loading.value = false; readOnly.value = false; data.value = steps + steps }
        rule.onNodeWithText("Invalid tour step").assertExists()
        rule.onNodeWithText("Close tour").performScrollTo().performClick()
        rule.runOnIdle { assertFalse(open.value); assertEquals(0, changes) }
    }
}
