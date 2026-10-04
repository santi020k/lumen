package com.santi020k.lumen

import androidx.activity.ComponentActivity
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.Modifier
import androidx.compose.ui.test.assertIsNotEnabled
import androidx.compose.ui.test.assertIsOn
import androidx.compose.ui.test.junit4.v2.createAndroidComposeRule
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import org.junit.Assert.*
import org.junit.Rule
import org.junit.Test

class TransferAccessibilityTest {
    @get:Rule val rule = createAndroidComposeRule<ComponentActivity>()
    @Test fun controlledStagingAndMovesKeepUnknownIdsAndDisabledMembership() {
        val value = mutableStateOf(LumenTransferValue(listOf("missing", "b"), listOf("unknown-check", "b")))
        val readOnly = mutableStateOf(false)
        val items = listOf(LumenTransferItem("a", "Alpha"), LumenTransferItem("b", "Beta", disabled = true))
        rule.setContent { LumenTheme {
            Column(Modifier.verticalScroll(rememberScrollState())) {
                LumenTransfer("Projects", items, value.value, { value.value = it }, readOnly = readOnly.value)
            }
        } }
        rule.onNodeWithContentDescription("Beta").assertIsNotEnabled().assertIsOn()
        rule.onNodeWithContentDescription("Alpha").performScrollTo().performClick()
        rule.runOnIdle { assertEquals(listOf("missing", "b"), value.value.selectedIds); assertEquals(listOf("unknown-check", "b", "a"), value.value.checkedIds) }
        rule.onNodeWithText("Move to selected").performScrollTo().performClick()
        rule.runOnIdle { assertEquals(listOf("missing", "b", "a"), value.value.selectedIds); assertEquals(listOf("unknown-check", "b"), value.value.checkedIds) }
        rule.onNodeWithContentDescription("Alpha").performScrollTo().performClick()
        rule.onNodeWithText("Move to available").performScrollTo().performClick()
        rule.runOnIdle { assertEquals(listOf("missing", "b"), value.value.selectedIds); readOnly.value = true }
        rule.onNodeWithContentDescription("Alpha").assertIsNotEnabled()
        rule.onNodeWithText("Move to selected").assertIsNotEnabled()
    }
    @Test fun statusAndInvalidDataHideControlsWithoutResettingHostState() {
        val loading = mutableStateOf(false)
        val item = LumenTransferItem("a", "Alpha")
        val items = mutableStateOf(listOf(item))
        val value = mutableStateOf(LumenTransferValue(listOf("missing"), listOf("unknown-check")))
        rule.setContent { LumenTheme {
            LumenTransfer("Projects", items.value, value.value, { value.value = it }, loading = loading.value, loadingLabel = "Waiting")
        } }
        rule.onNodeWithText("Move to selected").assertIsNotEnabled()
        rule.runOnIdle { loading.value = true }
        rule.onNodeWithText("Waiting").assertExists()
        rule.onNodeWithContentDescription("Alpha").assertDoesNotExist()
        rule.runOnIdle { loading.value = false; items.value = listOf(item, item) }
        rule.onNodeWithText("Invalid transfer").assertExists()
        rule.onNodeWithText("Move to selected").assertDoesNotExist()
        rule.runOnIdle { assertEquals(listOf("missing"), value.value.selectedIds); assertEquals(listOf("unknown-check"), value.value.checkedIds) }
    }
}
