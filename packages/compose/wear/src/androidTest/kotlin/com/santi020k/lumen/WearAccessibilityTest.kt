package com.santi020k.lumen

import androidx.activity.ComponentActivity
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.text.BasicText
import androidx.compose.ui.semantics.ProgressBarRangeInfo
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.ExperimentalTestApi
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.assert
import androidx.compose.ui.test.assertHasClickAction
import androidx.compose.ui.test.assertIsEnabled
import androidx.compose.ui.test.assertIsNotEnabled
import androidx.compose.ui.test.junit4.accessibility.enableAccessibilityChecks
import androidx.compose.ui.test.junit4.v2.createAndroidComposeRule
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onRoot
import androidx.compose.ui.test.tryPerformAccessibilityChecks
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

class WearAccessibilityTest {
    @get:Rule
    val composeRule = createAndroidComposeRule<ComponentActivity>()

    @Test
    fun wearThemeProvidesTheRequestedSemanticPalette() {
        var observedValues: LumenThemeValues? = null

        composeRule.setContent {
            LumenWearTheme(darkTheme = false) {
                observedValues = LocalLumenTheme.current
            }
        }

        composeRule.runOnIdle {
            assertEquals(LumenColors.Light, observedValues?.colors)
            assertEquals(false, observedValues?.isDark)
        }
    }

    @Test
    fun actionButtonExposesItsLabelRoleActionAndEnabledState() {
        composeRule.setContent {
            LumenWearTheme {
                LumenWearActionButton(
                    accessibilityLabel = "Start timer",
                    onClick = {}
                ) {
                    BasicText("Start")
                }
            }
        }

        composeRule.onNodeWithContentDescription("Start timer")
            .assertHasClickAction()
            .assertIsEnabled()
            .assert(SemanticsMatcher.expectValue(SemanticsProperties.Role, Role.Button))
    }

    @Test
    fun disabledActionButtonRemainsDiscoverableButUnavailable() {
        composeRule.setContent {
            LumenWearTheme {
                LumenWearActionButton(
                    accessibilityLabel = "Start timer",
                    enabled = false,
                    onClick = {}
                ) {
                    BasicText("Start")
                }
            }
        }

        composeRule.onNodeWithContentDescription("Start timer")
            .assertHasClickAction()
            .assertIsNotEnabled()
    }

    @Test
    fun progressRingExposesItsClampedValueAndRange() {
        composeRule.setContent {
            LumenWearTheme {
                LumenWearProgressRing(value = 12f, maximum = 10f) {
                    BasicText("Timer progress")
                }
            }
        }

        composeRule.onNode(
            SemanticsMatcher.expectValue(
                SemanticsProperties.ProgressBarRangeInfo,
                ProgressBarRangeInfo(current = 10f, range = 0f..10f, steps = 0)
            )
        ).assertExists()
    }

    @OptIn(ExperimentalTestApi::class)
    @Test
    fun representativeSupportedWearSurfacePassesAutomatedAccessibilityChecks() {
        composeRule.setContent {
            LumenWearTheme {
                Column {
                    LumenWearActionButton(
                        accessibilityLabel = "Start timer",
                        onClick = {}
                    ) {
                        BasicText("Start")
                    }
                    LumenWearProgressRing(value = 0.5f) {
                        BasicText("Timer progress")
                    }
                    LumenWearStatus("Ready", tone = LumenWearTone.Success)
                }
            }
        }

        composeRule.enableAccessibilityChecks()
        composeRule.onRoot().tryPerformAccessibilityChecks()
    }
}
