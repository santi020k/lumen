package com.santi020k.lumen

import androidx.activity.ComponentActivity
import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.semantics.SemanticsActions
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.assertIsNotEnabled
import androidx.compose.ui.test.hasSetTextAction
import androidx.compose.ui.test.hasAnyAncestor
import androidx.compose.ui.test.hasContentDescription
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.junit4.v2.createAndroidComposeRule
import androidx.compose.ui.test.performSemanticsAction
import androidx.compose.ui.test.performTextReplacement
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

class ColorPickerInteractionTest {
    @get:Rule val rule = createAndroidComposeRule<ComponentActivity>()
    @Test fun controlledDraftsAndLatentHue() {
        val value = mutableStateOf("#80808000")
        val readOnly = mutableStateOf(false)
        rule.setContent { LumenTheme { LumenColorPicker("Color", value.value, { value.value = it }, allowAlpha = true, readOnly = readOnly.value) } }
        rule.onNode(hasSetTextAction()).performTextReplacement("bad")
        rule.runOnIdle { assertEquals("#80808000", value.value) }
        change("Hue", 240f)
        change("Saturation", 1f)
        rule.runOnIdle { assertEquals("#00008000", value.value) }
        change("Brightness", 0f)
        change("Hue", 120f)
        change("Brightness", 1f)
        rule.runOnIdle { assertEquals("#00ff0000", value.value); value.value = "#ff0000ff" }
        rule.waitForIdle()
        rule.runOnIdle { value.value = "#00ff0000" }
        rule.waitForIdle()
        rule.onNode(hasSetTextAction()).performTextReplacement("rgba(255,128,0,.5)")
        rule.runOnIdle { assertEquals("#ff800080", value.value); readOnly.value = true }
        slider("Hue").assertIsNotEnabled()
    }
    private fun slider(label: String) = rule.onNode(hasAnyAncestor(hasContentDescription(label)) and
        SemanticsMatcher.keyIsDefined(SemanticsProperties.ProgressBarRangeInfo), useUnmergedTree = true)
    private fun change(label: String, value: Float) {
        slider(label).performSemanticsAction(SemanticsActions.SetProgress) { it(value) }
        rule.waitForIdle()
    }
}
