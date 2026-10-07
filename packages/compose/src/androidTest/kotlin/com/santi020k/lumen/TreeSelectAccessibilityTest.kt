package com.santi020k.lumen

import androidx.activity.ComponentActivity
import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.test.assertIsNotEnabled
import androidx.compose.ui.test.junit4.v2.createAndroidComposeRule
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

class TreeSelectAccessibilityTest {
    @get:Rule val rule = createAndroidComposeRule<ComponentActivity>()

    @Test fun disclosureSelectsHierarchyAndReadOnlyDisabledGuardsRemainAccessible() {
        val value = mutableStateOf<String?>("unknown")
        val readOnly = mutableStateOf(false)
        val enabled = mutableStateOf(true)
        var changes = 0
        val nodes = listOf(LumenTreeNode("r", "Root"), LumenTreeNode("l", "Leaf", "r"),
            LumenTreeNode("d", "Disabled", disabled = true), LumenTreeNode("c", "Child", "d"))
        rule.setContent { LumenTheme {
            LumenTreeSelect("Team", nodes, value.value, { changes++; value.value = it },
                enabled = enabled.value, readOnly = readOnly.value, unknownSelectionLabel = "Unknown")
        } }
        rule.runOnIdle { assertEquals("unknown", value.value); assertEquals(0, changes) }
        rule.onNodeWithContentDescription("Team: Unknown").performClick()
        rule.onNodeWithContentDescription("Disabled / Child, level 2").assertIsNotEnabled()
        rule.onNodeWithContentDescription("Root / Leaf, level 2").performClick()
        rule.runOnIdle { assertEquals("l", value.value); assertEquals(1, changes); readOnly.value = true }
        rule.onNodeWithContentDescription("Root / Leaf, level 2").assertDoesNotExist()
        rule.onNodeWithContentDescription("Team: Leaf").performClick()
        rule.onNodeWithContentDescription("Root, level 1").assertIsNotEnabled()
        rule.runOnIdle { enabled.value = false }
        rule.onNodeWithContentDescription("Team: Leaf").assertIsNotEnabled()
        rule.runOnIdle { assertEquals(1, changes) }
    }

    @Test fun emptyLoadingAndInvalidOptionsRetainUnknownHostValueAndHideStaleControls() {
        val nodes = mutableStateOf<List<LumenTreeNode>>(emptyList())
        val loading = mutableStateOf(false)
        var changes = 0
        rule.setContent { LumenTheme {
            LumenTreeSelect("Team", nodes.value, "unknown", { changes++ }, loading = loading.value,
                unknownSelectionLabel = "Unknown", emptyLabel = "Nothing here", loadingLabel = "Waiting")
        } }
        rule.onNodeWithContentDescription("Team: Unknown").performClick()
        rule.onNodeWithText("Nothing here").assertExists()
        rule.runOnIdle { loading.value = true }
        rule.onNodeWithText("Waiting").assertExists()
        rule.onNodeWithContentDescription("Team: Unknown").assertDoesNotExist()
        rule.runOnIdle { loading.value = false; nodes.value = listOf(LumenTreeNode("a", "", "a")) }
        rule.onNodeWithText("Invalid options").assertExists()
        rule.onNodeWithContentDescription("Team: Unknown").assertDoesNotExist()
        rule.runOnIdle { assertEquals(0, changes) }
    }
}
