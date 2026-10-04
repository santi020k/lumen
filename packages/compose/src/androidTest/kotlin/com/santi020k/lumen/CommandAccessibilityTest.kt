package com.santi020k.lumen

import androidx.activity.ComponentActivity
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.Modifier
import androidx.compose.ui.input.InputMode
import androidx.compose.ui.input.InputModeManager
import androidx.compose.ui.platform.LocalInputModeManager
import androidx.compose.ui.input.key.Key
import androidx.compose.ui.semantics.SemanticsActions
import androidx.compose.ui.test.assertIsFocused
import androidx.compose.ui.test.assertIsNotEnabled
import androidx.compose.ui.test.junit4.v2.createAndroidComposeRule
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performKeyInput
import androidx.compose.ui.test.pressKey
import androidx.compose.ui.test.performSemanticsAction
import androidx.compose.ui.test.performTextInput
import org.junit.Assert.*
import org.junit.Rule
import org.junit.Test

class CommandAccessibilityTest {
    @get:Rule val rule = createAndroidComposeRule<ComponentActivity>()
    private val groups = listOf(LumenCommandGroup("main", "Navigation", listOf(
        LumenCommandItem("docs", "Documentation", keywords = listOf("manual")),
        LumenCommandItem("blocked", "Disabled", disabled = true), LumenCommandItem("theme", "Toggle theme")
    )))
    @Test fun filteredHardwareNavigationActivationAndNativeCloseRemainControlled() {
        val open = mutableStateOf(true)
        val query = mutableStateOf("")
        val activeId = mutableStateOf<String?>("docs")
        var selections = 0
        var selected = ""
        var inputMode: InputModeManager? = null
        rule.setContent { LumenTheme {
            inputMode = LocalInputModeManager.current
            Column(Modifier.verticalScroll(rememberScrollState())) {
                LumenCommand("Commands", groups, open.value, { open.value = it }, query.value,
                    { query.value = it; activeId.value = null }, activeId.value, { activeId.value = it },
                    onSelect = { selections++; selected = it.id })
            }
        } }
        val search = rule.onNodeWithContentDescription("Search commands")
        search.assertIsFocused().performTextInput("theme")
        rule.onNodeWithContentDescription("Documentation").assertDoesNotExist()
        search.performKeyInput { pressKey(Key.DirectionDown) }
        rule.runOnIdle { assertEquals("theme", activeId.value) }
        search.performKeyInput { pressKey(Key.Enter) }
        rule.runOnIdle { assertEquals("theme", selected); assertEquals(1, selections); assertTrue(open.value) }
        rule.runOnIdle { assertTrue(requireNotNull(inputMode).requestInputMode(InputMode.Keyboard)) }
        rule.onNodeWithText("Close commands").performSemanticsAction(SemanticsActions.RequestFocus) { it() }
        rule.onNodeWithText("Close commands").assertIsFocused().performKeyInput { pressKey(Key.Enter) }
        rule.runOnIdle { assertFalse(open.value); assertEquals("theme", query.value); assertEquals(1, selections) }
        rule.onNodeWithContentDescription("Toggle theme").assertDoesNotExist()
    }
    @Test fun readOnlyLoadingAndInvalidStatesBlockStaleActionsAndRetainClose() {
        val loading = mutableStateOf(false)
        val readOnly = mutableStateOf(true)
        val data = mutableStateOf(groups)
        val open = mutableStateOf(true)
        rule.setContent { LumenTheme {
            LumenCommand("Commands", data.value, open.value, { open.value = it }, "", {}, "docs", {}, {},
                readOnly = readOnly.value, loading = loading.value, loadingLabel = "Waiting", autoFocus = false)
        } }
        rule.onNodeWithContentDescription("Documentation").assertIsNotEnabled()
        rule.onNodeWithText("Run highlighted command").assertIsNotEnabled()
        rule.runOnIdle { readOnly.value = false; loading.value = true }
        rule.onNodeWithText("Waiting").assertExists()
        rule.onNodeWithContentDescription("Search commands").assertDoesNotExist()
        rule.onNodeWithText("Close commands").assertExists()
        rule.runOnIdle { loading.value = false; data.value = groups + groups }
        rule.onNodeWithText("Invalid commands").assertExists()
        rule.onNodeWithText("Close commands").assertExists()
        rule.onNodeWithText("Run highlighted command").assertDoesNotExist()
    }
}
