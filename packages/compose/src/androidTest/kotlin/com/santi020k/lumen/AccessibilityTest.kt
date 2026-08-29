package com.santi020k.lumen

import androidx.activity.ComponentActivity
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.width
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.ProgressBarRangeInfo
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.ExperimentalTestApi
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.assert
import androidx.compose.ui.test.assertHasClickAction
import androidx.compose.ui.test.assertIsEnabled
import androidx.compose.ui.test.assertIsNotEnabled
import androidx.compose.ui.test.assertIsSelected
import androidx.compose.ui.test.junit4.accessibility.enableAccessibilityChecks
import androidx.compose.ui.test.junit4.v2.createAndroidComposeRule
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.onRoot
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.tryPerformAccessibilityChecks
import androidx.compose.ui.unit.dp
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

class AccessibilityTest {
    @get:Rule
    val composeRule = createAndroidComposeRule<ComponentActivity>()

    @Test
    fun productMaterialThemePopulatesMaterialAndLumenScopesTogether() {
        val productScheme = lightColorScheme(
            primary = Color(0xFF102A43),
            secondary = Color(0xFF486581),
            background = Color(0xFFF0F4F8)
        )
        val productSuccess = Color(0xFF14804A)
        var observedLumenValues: LumenThemeValues? = null
        var observedMaterialPrimary: Color? = null

        composeRule.setContent {
            LumenTheme(
                darkTheme = false,
                materialColorScheme = productScheme,
                materialColorOverrides = LumenMaterialColorOverrides(success = productSuccess)
            ) {
                observedLumenValues = LocalLumenTheme.current
                observedMaterialPrimary = MaterialTheme.colorScheme.primary
            }
        }

        composeRule.runOnIdle {
            assertEquals(productScheme.primary, observedMaterialPrimary)
            assertEquals(productScheme.background, observedLumenValues?.colors?.canvas)
            assertEquals(productScheme.primary, observedLumenValues?.colors?.brand)
            assertEquals(productSuccess, observedLumenValues?.colors?.success)
            assertEquals(false, observedLumenValues?.isDark)
        }
    }

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
    fun bannerRendersAtCompactWidthWithoutIntrinsicMeasurement() {
        composeRule.setContent {
            LumenTheme {
                Box(modifier = Modifier.width(320.dp)) {
                    LumenBanner(
                        title = "Native structured feedback",
                        description = "Dismiss this notice to exercise local state.",
                        onDismiss = {}
                    )
                }
            }
        }

        composeRule.onNodeWithText("Native structured feedback").assertExists()
        composeRule.onNodeWithText("Dismiss this notice to exercise local state.").assertExists()
        composeRule.onNodeWithText("Dismiss").assertHasClickAction()
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
    fun disabledAndLoadingButtonsDoNotInvokeCallbacks() {
        var disabledCallbackCount = 0
        var loadingCallbackCount = 0

        composeRule.setContent {
            LumenTheme {
                Column {
                    LumenButton(
                        onClick = { disabledCallbackCount += 1 },
                        enabled = false
                    ) {
                        Text("Disabled action")
                    }
                    LumenButton(
                        onClick = { loadingCallbackCount += 1 },
                        loading = true
                    ) {
                        Text("Loading action")
                    }
                }
            }
        }

        composeRule.onNodeWithText("Disabled action")
            .assertHasClickAction()
            .assertIsNotEnabled()
            .performClick()
        composeRule.onNodeWithText("Loading action")
            .assertHasClickAction()
            .assertIsNotEnabled()
            .performClick()

        composeRule.runOnIdle {
            assertEquals(0, disabledCallbackCount)
            assertEquals(0, loadingCallbackCount)
        }
    }

    @Test
    fun textFieldErrorMessageExposesInvalidSemantics() {
        composeRule.setContent {
            LumenTheme {
                LumenTextField(
                    value = "Draft",
                    onValueChange = {},
                    label = "Project name",
                    modifier = Modifier.testTag("project-name"),
                    errorMessage = "Project name is required"
                )
            }
        }

        composeRule.onNodeWithTag("project-name")
            .assert(
                SemanticsMatcher.expectValue(
                    SemanticsProperties.Error,
                    "Project name is required"
                )
            )
    }

    @Test
    fun groupedAndMultilineFieldsExposeValidationContext() {
        composeRule.setContent {
            LumenTheme {
                Column {
                    LumenFieldGroup(
                        label = "Project details",
                        required = true,
                        errorMessage = "Project details are required"
                    ) {
                        Text("Grouped control")
                    }
                    LumenTextarea(
                        value = "Draft",
                        onValueChange = {},
                        label = "Project notes",
                        modifier = Modifier.testTag("project-notes"),
                        errorMessage = "Project notes are required"
                    )
                }
            }
        }

        composeRule.onNodeWithContentDescription("Project details, required").assertExists()
        composeRule.onNodeWithText("Project details are required")
            .assert(
                SemanticsMatcher.expectValue(
                    SemanticsProperties.Error,
                    "Project details are required"
                )
            )
        composeRule.onNodeWithTag("project-notes")
            .assert(
                SemanticsMatcher.expectValue(
                    SemanticsProperties.Error,
                    "Project notes are required"
                )
            )
    }

    @Test
    fun dateAndPhoneControlsExposeValidationContextOnTheActionableNode() {
        val country = LumenPhoneCountry("US", "+1", "United States")

        composeRule.setContent {
            LumenTheme {
                Column {
                    LumenDateField(
                        label = "Start date",
                        value = null,
                        onValueChange = {},
                        errorMessage = "Start date is required"
                    )
                    LumenPhoneInput(
                        value = LumenPhoneNumber.empty(country),
                        onValueChange = {},
                        label = "Contact number",
                        countries = listOf(country),
                        errorMessage = "Contact number is invalid"
                    )
                }
            }
        }

        composeRule.onNodeWithContentDescription("Start date: Choose a date")
            .assert(
                SemanticsMatcher.expectValue(
                    SemanticsProperties.Error,
                    "Start date is required"
                )
            )
        composeRule.onNode(
            SemanticsMatcher.expectValue(
                SemanticsProperties.Error,
                "Contact number is invalid"
            ) and SemanticsMatcher.keyIsDefined(SemanticsProperties.EditableText)
        ).assertExists()
    }

    @Test
    fun disablingAnOpenDateFieldDismissesItsDialogWithoutReopening() {
        val enabled = mutableStateOf(true)

        composeRule.setContent {
            LumenTheme {
                LumenDateField(
                    label = "Start date",
                    value = null,
                    onValueChange = {},
                    enabled = enabled.value
                )
            }
        }

        composeRule.onNodeWithContentDescription("Start date: Choose a date").performClick()
        composeRule.onNodeWithText("Confirm").assertExists()
        composeRule.runOnIdle { enabled.value = false }
        composeRule.onNodeWithText("Confirm").assertDoesNotExist()
        composeRule.runOnIdle { enabled.value = true }
        composeRule.onNodeWithText("Confirm").assertDoesNotExist()
    }

    @Test
    fun disablingAnOpenPickerDismissesItsMenuWithoutReopening() {
        val enabled = mutableStateOf(true)

        composeRule.setContent {
            LumenTheme {
                LumenPicker(
                    label = "Profile",
                    value = "quiet",
                    options = listOf(
                        LumenPickerOption("quiet", "Quiet"),
                        LumenPickerOption("balanced", "Balanced")
                    ),
                    onValueChange = {},
                    enabled = enabled.value
                )
            }
        }

        composeRule.onNodeWithContentDescription("Profile").performClick()
        composeRule.onNodeWithText("Balanced").assertExists()
        composeRule.runOnIdle { enabled.value = false }
        composeRule.onNodeWithText("Balanced").assertDoesNotExist()
        composeRule.runOnIdle { enabled.value = true }
        composeRule.onNodeWithText("Balanced").assertDoesNotExist()
    }

    @Test
    fun disablingAnOpenPhoneCountryPickerDismissesItsSheetWithoutReopening() {
        val country = LumenPhoneCountry("US", "+1", "United States")
        val enabled = mutableStateOf(true)

        composeRule.setContent {
            LumenTheme {
                LumenPhoneInput(
                    value = LumenPhoneNumber.empty(country),
                    onValueChange = {},
                    label = "Contact number",
                    countries = listOf(country),
                    enabled = enabled.value
                )
            }
        }

        composeRule.onNodeWithContentDescription("Country code, United States, +1").performClick()
        composeRule.onNodeWithText("Select country").assertExists()
        composeRule.runOnIdle { enabled.value = false }
        composeRule.onNodeWithText("Select country").assertDoesNotExist()
        composeRule.runOnIdle { enabled.value = true }
        composeRule.onNodeWithText("Select country").assertDoesNotExist()
    }

    @Test
    fun alertDialogDisablesConfirmAndKeepsCancelReachableWhileLoading() {
        composeRule.setContent {
            LumenTheme {
                LumenAlertDialog(
                    visible = true,
                    title = "Delete project",
                    description = "This cannot be undone.",
                    confirmLabel = "Delete",
                    confirmLoading = true,
                    onConfirm = {},
                    onDismiss = {}
                )
            }
        }

        composeRule.onNodeWithText("Delete project").assertExists()
        composeRule.onNodeWithText("This cannot be undone.").assertExists()
        composeRule.onNodeWithText("Delete")
            .assertIsNotEnabled()
            .assert(
                SemanticsMatcher.expectValue(
                    SemanticsProperties.StateDescription,
                    "Loading"
                )
            )
        composeRule.onNodeWithText("Cancel")
            .assertIsEnabled()
            .assertHasClickAction()
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

    @Test
    fun tabsExposeSelectionAndTheActivePanel() {
        composeRule.setContent {
            LumenTheme {
                LumenTabs(
                    label = "Workspace views",
                    options = listOf(
                        LumenSelectionOption("overview", "Overview"),
                        LumenSelectionOption("activity", "Activity")
                    ),
                    value = "overview",
                    onValueChange = {}
                ) {
                    LumenText("Workspace health is ready")
                }
            }
        }

        composeRule.onNodeWithText("Overview")
            .assertIsSelected()
            .assertHasClickAction()
        composeRule.onNodeWithContentDescription("Overview tab panel").assertExists()
        composeRule.onNodeWithText("Workspace health is ready").assertExists()
    }
}
