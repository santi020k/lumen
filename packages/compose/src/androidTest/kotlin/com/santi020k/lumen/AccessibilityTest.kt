package com.santi020k.lumen

import androidx.activity.ComponentActivity
import androidx.compose.foundation.layout.Column
import androidx.compose.material3.Text
import androidx.compose.ui.test.ExperimentalTestApi
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.ProgressBarRangeInfo
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.assert
import androidx.compose.ui.test.assertHasClickAction
import androidx.compose.ui.test.assertIsEnabled
import androidx.compose.ui.test.assertIsSelected
import androidx.compose.ui.test.junit4.accessibility.enableAccessibilityChecks
import androidx.compose.ui.test.junit4.v2.createAndroidComposeRule
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.onRoot
import androidx.compose.ui.test.tryPerformAccessibilityChecks
import org.junit.Rule
import org.junit.Test

class AccessibilityTest {
    @get:Rule
    val composeRule = createAndroidComposeRule<ComponentActivity>()

    @OptIn(ExperimentalTestApi::class)
    @Test
    fun representativeCatalogPassesAutomatedAccessibilityChecks() {
        composeRule.setContent {
            LumenTheme {
                Column {
                    LumenButton(onClick = {}) { Text("Continue") }
                    LumenToast(title = "Settings saved", onDismiss = {})
                    LumenGauge(label = "Completion", value = 72f, valueLabel = "72 percent")
                }
            }
        }

        composeRule.enableAccessibilityChecks()
        composeRule.onRoot().tryPerformAccessibilityChecks()
    }

    @Test
    fun buttonExposesItsActionAndEnabledState() {
        composeRule.setContent {
            LumenTheme {
                LumenButton(onClick = {}) { Text("Continue") }
            }
        }

        composeRule.onNodeWithText("Continue")
            .assertHasClickAction()
            .assertIsEnabled()
    }

    @Test
    fun toastUsesAPoliteLiveRegion() {
        composeRule.setContent {
            LumenTheme {
                LumenToast(title = "Settings saved")
            }
        }

        composeRule.onNode(
            SemanticsMatcher.expectValue(SemanticsProperties.LiveRegion, LiveRegionMode.Polite)
        ).assertExists()
        composeRule.onNodeWithText("Settings saved").assertExists()
    }

    @Test
    fun gaugeExposesItsLabelValueAndRange() {
        composeRule.setContent {
            LumenTheme {
                LumenGauge(label = "Completion", value = 72f, valueLabel = "72 percent")
            }
        }

        composeRule.onNodeWithContentDescription("Completion")
            .assert(
                SemanticsMatcher.expectValue(
                    SemanticsProperties.ProgressBarRangeInfo,
                    ProgressBarRangeInfo(current = 72f, range = 0f..100f, steps = 0)
                )
            )
            .assert(
                SemanticsMatcher.expectValue(
                    SemanticsProperties.StateDescription,
                    "72 percent"
                )
            )
    }

    @Test
    fun segmentedControlExposesSelectedAndActionableOptions() {
        composeRule.setContent {
            LumenTheme {
                LumenSegmentedControl(
                    label = "Density",
                    options = listOf(
                        LumenSelectionOption("compact", "Compact"),
                        LumenSelectionOption("balanced", "Balanced")
                    ),
                    value = "balanced",
                    onValueChange = {}
                )
            }
        }

        composeRule.onNodeWithText("Balanced")
            .assertIsSelected()
            .assertHasClickAction()
    }
}
