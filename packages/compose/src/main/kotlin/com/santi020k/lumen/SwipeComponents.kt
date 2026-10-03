package com.santi020k.lumen

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.SwipeToDismissBox
import androidx.compose.material3.SwipeToDismissBoxDefaults
import androidx.compose.material3.SwipeToDismissBoxState
import androidx.compose.material3.SwipeToDismissBoxValue
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.CustomAccessibilityAction
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.customActions
import androidx.compose.ui.semantics.semantics

/** A named application-owned action; destructive actions should request confirmation in the host. */
data class LumenSwipeAction(
    val label: String,
    val onClick: () -> Unit,
    val enabled: Boolean = true,
    val destructive: Boolean = false
) {
    init { require(label.isNotBlank()) { "Swipe actions require a readable label." } }
}

/** Logical start/end gestures respect RTL. Every action also has a visible keyboard-usable button. */
@Composable
fun LumenSwipeActions(
    modifier: Modifier = Modifier,
    startAction: LumenSwipeAction? = null,
    endAction: LumenSwipeAction? = null,
    enabled: Boolean = true,
    content: @Composable () -> Unit
) {
    val threshold = SwipeToDismissBoxDefaults.positionalThreshold
    // Gesture position is transient: restoring a dismissed state must never replay an action.
    val state = remember { SwipeToDismissBoxState(initialValue = SwipeToDismissBoxValue.Settled, positionalThreshold = threshold) }
    val latestStart = rememberUpdatedState(startAction)
    val latestEnd = rememberUpdatedState(endAction)
    val latestEnabled = rememberUpdatedState(enabled)
    LaunchedEffect(state.settledValue) {
        val direction = state.settledValue
        if (direction != SwipeToDismissBoxValue.Settled) {
            val action = if (direction == SwipeToDismissBoxValue.StartToEnd) latestStart.value else latestEnd.value
            state.snapTo(SwipeToDismissBoxValue.Settled)
            if (latestEnabled.value && action?.enabled == true) action.onClick()
        }
    }
    LaunchedEffect(enabled, startAction?.enabled, endAction?.enabled) {
        if (!enabled || (startAction?.enabled != true && endAction?.enabled != true)) {
            state.snapTo(SwipeToDismissBoxValue.Settled)
        }
    }
    val actions = listOfNotNull(startAction, endAction)
    Column(modifier, verticalArrangement = Arrangement.spacedBy(LumenSpacing.Xs)) {
        SwipeToDismissBox(
            state = state,
            gesturesEnabled = enabled,
            enableDismissFromStartToEnd = enabled && startAction?.enabled == true,
            enableDismissFromEndToStart = enabled && endAction?.enabled == true,
            modifier = Modifier.semantics {
                customActions = actions.filter { enabled && it.enabled }.map { action ->
                    CustomAccessibilityAction(action.label) { action.onClick(); true }
                }
            },
            backgroundContent = {
                val fromStart = state.dismissDirection == SwipeToDismissBoxValue.StartToEnd
                val action = if (fromStart) startAction else endAction
                val colors = LocalLumenTheme.current.colors
                Box(Modifier.fillMaxSize().clearAndSetSemantics {}.background(
                    if (state.dismissDirection == SwipeToDismissBoxValue.Settled) colors.surface
                    else if (action?.destructive == true) colors.danger else colors.brandSoft
                ).padding(LumenSpacing.Md), contentAlignment = if (fromStart) Alignment.CenterStart else Alignment.CenterEnd) {
                    if (action != null) Text(action.label, color = if (action.destructive) colors.onDanger else colors.brand)
                }
            }
        ) {
            LumenSurface(modifier = Modifier.fillMaxWidth()) { content() }
        }
        FlowRow(horizontalArrangement = Arrangement.spacedBy(LumenSpacing.Sm)) {
            actions.forEach { action ->
                LumenButton(onClick = action.onClick, enabled = enabled && action.enabled,
                    intent = if (action.destructive) LumenButtonIntent.Danger else LumenButtonIntent.Quiet) {
                    Text(action.label)
                }
            }
        }
    }
}
