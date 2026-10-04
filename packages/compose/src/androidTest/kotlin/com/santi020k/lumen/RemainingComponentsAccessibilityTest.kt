package com.santi020k.lumen

import androidx.activity.ComponentActivity
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.width
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Modifier
import androidx.compose.ui.autofill.ContentType
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.painter.ColorPainter
import androidx.compose.ui.semantics.SemanticsActions
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.ExperimentalTestApi
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.assert
import androidx.compose.ui.test.assertIsNotEnabled
import androidx.compose.ui.test.junit4.accessibility.enableAccessibilityChecks
import androidx.compose.ui.test.junit4.v2.createAndroidComposeRule
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.onRoot
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performImeAction
import androidx.compose.ui.test.performKeyInput
import androidx.compose.ui.test.pressKey
import androidx.compose.ui.test.performTouchInput
import androidx.compose.ui.test.click
import androidx.compose.ui.test.longClick
import androidx.compose.ui.input.key.Key
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.test.performSemanticsAction
import androidx.compose.ui.test.performTextReplacement
import androidx.compose.ui.test.tryPerformAccessibilityChecks
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.launch
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

class RemainingComponentsAccessibilityTest {
    @get:Rule
    val composeRule = createAndroidComposeRule<ComponentActivity>()

    @Test
    fun unsupportedCountryFlagsHonorDecorativeAndCustomDescriptions() {
        composeRule.setContent {
            LumenTheme {
                Column {
                    LumenCountryFlag("ZZ", Modifier.testTag("decorative-flag"), contentDescription = null)
                    LumenCountryFlag("ZZ", Modifier.testTag("named-flag"), contentDescription = "Custom region")
                }
            }
        }
        composeRule.onNodeWithTag("decorative-flag").assert(
            SemanticsMatcher("Decorative flag has no accessible text or description") {
                !it.config.contains(SemanticsProperties.Text) && !it.config.contains(SemanticsProperties.ContentDescription)
            }
        )
        composeRule.onNodeWithTag("named-flag").assert(
            SemanticsMatcher.expectValue(SemanticsProperties.ContentDescription, listOf("Custom region"))
        ).assert(SemanticsMatcher("Fallback region text is not announced separately") {
            !it.config.contains(SemanticsProperties.Text)
        })
    }

    @Test
    fun passwordRevealKeepsPasswordAndAutofillSemanticsAndCanBeHidden() {
        val value = mutableStateOf("sample-only")
        var submitted = 0
        composeRule.setContent {
            LumenTheme {
                LumenPasswordField("Password", value.value, { value.value = it },
                    modifier = Modifier.testTag("password"), onSubmit = { submitted += 1 })
            }
        }
        composeRule.onNodeWithTag("password").assert(SemanticsMatcher.keyIsDefined(SemanticsProperties.Password))
            .assert(SemanticsMatcher.expectValue(SemanticsProperties.ContentType, ContentType.Password))
        composeRule.onNodeWithContentDescription("Show password").performClick()
        composeRule.onNodeWithContentDescription("Hide password").assertExists()
        composeRule.onNodeWithContentDescription("Hide password").performClick()
        composeRule.onNodeWithTag("password").performTextReplacement("replacement-only")
        composeRule.onNodeWithTag("password").performImeAction()
        composeRule.runOnIdle { assertEquals("replacement-only", value.value); assertEquals(1, submitted) }
    }

    @Test
    fun passwordReadOnlyAndDisabledStatesPreventRevealAndSubmission() {
        val readOnly = mutableStateOf(false)
        val enabled = mutableStateOf(true)
        var changes = 0
        composeRule.setContent {
            LumenTheme {
                LumenPasswordField("Password", "sample-only", { changes += 1 }, readOnly = readOnly.value, enabled = enabled.value, newPassword = true)
            }
        }
        composeRule.onNodeWithContentDescription("Show password").performClick()
        composeRule.runOnIdle { readOnly.value = true }
        composeRule.onNodeWithContentDescription("Show password").assertIsNotEnabled()
        composeRule.runOnIdle { readOnly.value = false; enabled.value = false }
        composeRule.onNodeWithContentDescription("Show password").assertIsNotEnabled()
        composeRule.runOnIdle { assertEquals(0, changes) }
    }

    @Test
    fun otpPastesLocalizedDigitsCompletesOnceAndSupportsDeletion() {
        val value = mutableStateOf("")
        val completed = mutableListOf<String>()
        composeRule.setContent {
            LumenTheme {
                LumenInputOTP("Code", value.value, { value.value = it },
                    modifier = Modifier.testTag("code"), onComplete = { completed += it })
            }
        }
        composeRule.onNodeWithTag("code").assert(SemanticsMatcher.expectValue(SemanticsProperties.ContentType, ContentType.SmsOtpCode))
        composeRule.onNodeWithTag("code").performClick()
        composeRule.runOnIdle {
            composeRule.activity.getSystemService(android.content.ClipboardManager::class.java)
                .setPrimaryClip(android.content.ClipData.newPlainText("Synthetic code", "١٢٣-٤٥٦"))
        }
        composeRule.onNodeWithTag("code").performSemanticsAction(SemanticsActions.PasteText) { it() }
        composeRule.runOnIdle {
            composeRule.activity.getSystemService(android.content.ClipboardManager::class.java)
                .setPrimaryClip(android.content.ClipData.newPlainText("", ""))
        }
        composeRule.onNodeWithTag("code").performTextReplacement("123456")
        composeRule.runOnIdle { assertEquals("123456", value.value); assertEquals(listOf("123456"), completed) }
        composeRule.onNodeWithTag("code").performTextReplacement("12345")
        composeRule.runOnIdle { assertEquals("12345", value.value); assertEquals(1, completed.size) }
        composeRule.onNodeWithTag("code").performTextReplacement("invalid")
        composeRule.runOnIdle { assertEquals("12345", value.value) }
    }

    @Test
    fun otpTracksHostUpdatesAndMaskedReadOnlyState() {
        val value = mutableStateOf("123")
        composeRule.setContent {
            LumenTheme {
                LumenInputOTP("Code", value.value, { value.value = it }, modifier = Modifier.testTag("code"), masked = true, readOnly = true)
            }
        }
        composeRule.runOnIdle { value.value = "456" }
        composeRule.onNodeWithTag("code").assert(SemanticsMatcher.keyIsDefined(SemanticsProperties.Password))
        composeRule.onNodeWithTag("code").assert(SemanticsMatcher.keyNotDefined(SemanticsActions.SetText))
        composeRule.runOnIdle { assertEquals("456", value.value) }
    }

    @Test
    fun tooltipCanBeShownExplicitlyAndDisablingDismissesIt() {
        val enabled = mutableStateOf(true)
        composeRule.setContent {
            val state = rememberLumenTooltipState(isPersistent = true)
            val scope = rememberCoroutineScope()
            LumenTheme {
                LumenTooltip("Helpful detail", state = state, enabled = enabled.value) {
                    LumenButton(onClick = { scope.launch { state.show() } }) { LumenText("Help") }
                }
            }
        }
        composeRule.onNodeWithText("Help").performClick()
        composeRule.onNodeWithText("Helpful detail").assertExists()
        composeRule.runOnIdle { enabled.value = false }
        composeRule.onNodeWithText("Helpful detail").assertDoesNotExist()
        composeRule.onNodeWithText("Help").assertExists()
    }

    @Test
    fun comparisonAccessibilityAdjustmentClampsAndDisabledStopsChanges() {
        val value = mutableStateOf(0.5f)
        val enabled = mutableStateOf(true)
        composeRule.setContent {
            LumenTheme {
                LumenImageComparison("Compare", ColorPainter(Color.Gray), ColorPainter(Color.White),
                    value.value, { value.value = it }, enabled = enabled.value)
            }
        }
        composeRule.onNodeWithContentDescription("Compare").performSemanticsAction(SemanticsActions.SetProgress) { assertTrue(it(0.75f)) }
        composeRule.runOnIdle { assertEquals(0.75f, value.value); enabled.value = false }
        composeRule.onNodeWithContentDescription("Compare").assertIsNotEnabled()
        composeRule.onNodeWithContentDescription("Compare").performSemanticsAction(SemanticsActions.SetProgress) { it(0.25f) }
        composeRule.runOnIdle { assertEquals(0.75f, value.value) }
    }

    @Test
    fun passwordLosingFocusHidesVisibility() {
        composeRule.setContent {
            LumenTheme {
                Column {
                    LumenPasswordField("Password", "sample-only", {}, modifier = Modifier.testTag("password"))
                    LumenTextField(label = "Other field", value = "", onValueChange = {}, modifier = Modifier.testTag("other"))
                }
            }
        }
        composeRule.onNodeWithTag("password").performClick()
        composeRule.onNodeWithContentDescription("Show password").performClick()
        composeRule.onNodeWithContentDescription("Hide password").assertExists()
        composeRule.onNodeWithTag("other").performClick()
        composeRule.onNodeWithContentDescription("Show password").assertExists()
    }

    @Test
    fun tooltipRespondsToNativeLongPress() {
        composeRule.setContent {
            LumenTheme {
                LumenTooltip("Save this project") {
                    LumenIconButton(LumenIconName.Bookmark, "Save", onClick = {}, size = LumenControlSize.Lg)
                }
            }
        }
        composeRule.onNodeWithContentDescription("Save").performTouchInput { longClick() }
        composeRule.onNodeWithText("Save this project").assertExists()
    }

    @Test
    fun comparisonSupportsTouchAndKeyboardAdjustment() {
        val value = mutableStateOf(0.5f)
        composeRule.setContent {
            LumenTheme {
                LumenImageComparison("Compare", ColorPainter(Color.Gray), ColorPainter(Color.White), value.value, { value.value = it })
            }
        }
        composeRule.onNodeWithContentDescription("Compare").performTouchInput { click(Offset(width * 0.75f, height / 2f)) }
        var touched = 0f
        composeRule.runOnIdle { touched = value.value; assertTrue(touched > 0.5f && touched < 1f) }
        composeRule.onNodeWithContentDescription("Compare").performSemanticsAction(SemanticsActions.RequestFocus) { it() }
        composeRule.onNodeWithContentDescription("Compare").performKeyInput { pressKey(Key.DirectionRight) }
        composeRule.runOnIdle { assertTrue(value.value > touched) }
    }

    @OptIn(ExperimentalTestApi::class)
    @Test
    fun compactLocalizedControlsPassAccessibilityChecks() {
        composeRule.enableAccessibilityChecks()
        composeRule.setContent {
            LumenTheme {
                Column(Modifier.width(320.dp)) {
                    LumenPasswordField("Contraseña", "", {}, errorMessage = "Revisa la contraseña", showLabel = "Mostrar contraseña", hideLabel = "Ocultar contraseña")
                    LumenInputOTP("Código", "", {}, description = "Introduce seis dígitos", errorMessage = "Revisa el código")
                    LumenImageComparison("Comparar imágenes", ColorPainter(Color.Gray), ColorPainter(Color.White), 0.5f, {}, beforeLabel = "Antes", afterLabel = "Después")
                }
            }
        }
        composeRule.onRoot().tryPerformAccessibilityChecks()
    }
}
