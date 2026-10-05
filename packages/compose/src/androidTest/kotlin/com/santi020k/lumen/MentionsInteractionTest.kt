package com.santi020k.lumen

import android.view.inputmethod.EditorInfo
import android.view.inputmethod.InputConnection
import androidx.compose.ui.platform.InterceptPlatformTextInput
import androidx.compose.ui.platform.PlatformTextInputInterceptor
import kotlinx.coroutines.awaitCancellation
import androidx.activity.ComponentActivity
import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.layout.Column
import androidx.compose.ui.test.junit4.v2.createAndroidComposeRule
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performTextInputSelection
import androidx.compose.ui.text.TextRange
import androidx.compose.ui.input.key.Key
import androidx.compose.ui.test.performKeyInput
import androidx.compose.ui.test.pressKey
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Rule
import org.junit.Test

class MentionsInteractionTest {
    @get:Rule val rule = createAndroidComposeRule<ComponentActivity>()
    private val options = listOf(LumenMentionOption("alice", "Alice option", "alice"),
        LumenMentionOption("archived", "Archived option", "albert", true))
    @Test fun insertionPreservesSuffixAndInvalidHostRange() {
        val value = mutableStateOf(LumenMentionsValue("😀 @al!", LumenMentionsSelection(6, 6)))
        val readOnly = mutableStateOf(false)
        // Drive selection through semantics without asynchronous system-keyboard cursor updates.
        val interceptor = PlatformTextInputInterceptor { _, _ -> awaitCancellation() }
        rule.setContent { InterceptPlatformTextInput(interceptor) {
            LumenTheme { LumenMentions("Message", value.value, { value.value = it }, options, readOnly = readOnly.value) }
        } }
        rule.onNodeWithContentDescription("Message").performClick().performTextInputSelection(TextRange(6))
        rule.onNodeWithText("Archived option").performClick()
        rule.runOnIdle { assertEquals("😀 @al!", value.value.text) }
        rule.onNodeWithText("Alice option").performClick()
        rule.runOnIdle {
            assertEquals(LumenMentionsValue("😀 @alice !", LumenMentionsSelection(10, 10)), value.value)
            value.value = value.value.copy(selection = LumenMentionsSelection(-1, -1))
        }
        rule.onNodeWithText("Invalid text selection").assertIsDisplayed()
        rule.runOnIdle { assertEquals(-1, value.value.selection.start); readOnly.value = true }
        rule.onNodeWithText("Alice option").assertDoesNotExist()
    }
    @Test fun focusReturnReopensDismissedSuggestionsWithoutEditing() {
        val value = mutableStateOf(LumenMentionsValue("@al", LumenMentionsSelection(3, 3)))
        val other = mutableStateOf("Other field")
        val interceptor = PlatformTextInputInterceptor { _, _ -> awaitCancellation() }
        rule.setContent { InterceptPlatformTextInput(interceptor) {
            LumenTheme { Column {
                LumenMentions("Message", value.value, { value.value = it }, options)
                BasicTextField(other.value, { other.value = it })
            } }
        } }
        rule.onNodeWithContentDescription("Message").performClick().performTextInputSelection(TextRange(3))
        rule.onNodeWithText("Alice option").assertIsDisplayed()
        rule.onNodeWithContentDescription("Message").performKeyInput { pressKey(Key.Escape) }
        rule.onNodeWithText("Alice option").assertDoesNotExist()
        rule.onNodeWithText("Other field").performClick()
        rule.onNodeWithContentDescription("Message").performClick()
        rule.onNodeWithText("Alice option").assertIsDisplayed()
        rule.runOnIdle { assertEquals("@al", value.value.text) }
    }
    @Test fun nativeComposingTextIsNotReplacedByExternalHostValue() {
        val value = mutableStateOf(LumenMentionsValue("", LumenMentionsSelection(0, 0)))
        var connection: InputConnection? = null
        val interceptor = PlatformTextInputInterceptor { request, _ ->
            connection = request.createInputConnection(EditorInfo())
            awaitCancellation()
        }
        rule.setContent { InterceptPlatformTextInput(interceptor) {
            LumenTheme { LumenMentions("Message", value.value, { value.value = it }, options) }
        } }
        rule.onNodeWithContentDescription("Message").performClick()
        rule.waitForIdle()
        rule.runOnIdle {
            assertNotNull(connection)
            connection?.setComposingText("@al", 1)
        }
        rule.waitForIdle()
        rule.onNodeWithText("Alice option").assertDoesNotExist()
        rule.runOnIdle { value.value = LumenMentionsValue("External", LumenMentionsSelection(8, 8)) }
        rule.onNodeWithText("@al").assertIsDisplayed()
        rule.runOnIdle {
            connection?.finishComposingText()
        }
        rule.waitForIdle()
    }
    @Test fun hardwareKeyboardSkipsDisabledOptionsAndRejectedInsertionKeepsHost() {
        val value = mutableStateOf(LumenMentionsValue("@al", LumenMentionsSelection(3, 3)))
        val keyboardOptions = options + LumenMentionOption("alex", "Alex option", "alex")
        var requested: LumenMentionsValue? = null
        rule.setContent { LumenTheme {
            LumenMentions("Message", value.value, { requested = it }, keyboardOptions)
        } }
        rule.onNodeWithContentDescription("Message").performClick().performTextInputSelection(TextRange(3))
        rule.onNodeWithContentDescription("Message").performKeyInput { pressKey(Key.DirectionDown); pressKey(Key.Enter) }
        rule.runOnIdle {
            assertEquals(LumenMentionsValue("@alex ", LumenMentionsSelection(6, 6)), requested)
            assertEquals("@al", value.value.text)
        }
        rule.onNodeWithText("@al").assertIsDisplayed()
        rule.onNodeWithContentDescription("Message").performKeyInput { pressKey(Key.Escape) }
        rule.onNodeWithText("Alice option").assertDoesNotExist()
    }

}
