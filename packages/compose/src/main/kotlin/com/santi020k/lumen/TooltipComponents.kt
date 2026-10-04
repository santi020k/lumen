package com.santi020k.lumen

import androidx.compose.foundation.layout.Box
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.PlainTooltip
import androidx.compose.material3.Text
import androidx.compose.material3.TooltipAnchorPosition
import androidx.compose.material3.TooltipBox
import androidx.compose.material3.TooltipDefaults
import androidx.compose.material3.TooltipState
import androidx.compose.material3.rememberTooltipState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier

/** Stable Lumen visibility controls backed by Material tooltip state. */
@OptIn(ExperimentalMaterial3Api::class)
class LumenTooltipState internal constructor(internal val nativeState: TooltipState) {
    val isVisible: Boolean get() = nativeState.isVisible
    suspend fun show() { nativeState.show() }
    fun dismiss() { nativeState.dismiss() }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun rememberLumenTooltipState(isPersistent: Boolean = false): LumenTooltipState {
    val nativeState = rememberTooltipState(isPersistent = isPersistent)
    return remember(nativeState) { LumenTooltipState(nativeState) }
}

/** Native long-press, pointer, and focus help. The anchor still needs its own accessible name. */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LumenTooltip(
    text: String,
    modifier: Modifier = Modifier,
    state: LumenTooltipState = rememberLumenTooltipState(),
    enabled: Boolean = true,
    content: @Composable () -> Unit
) {
    require(text.isNotBlank()) { "Tooltip text must not be blank." }
    LaunchedEffect(enabled) { if (!enabled) state.dismiss() }
    if (!enabled) {
        Box(modifier = modifier) { content() }
        return
    }
    val colors = LocalLumenTheme.current.colors
    TooltipBox(
        positionProvider = TooltipDefaults.rememberTooltipPositionProvider(TooltipAnchorPosition.Above),
        tooltip = { PlainTooltip(containerColor = colors.surface, contentColor = colors.ink) { Text(text) } },
        state = state.nativeState,
        modifier = modifier,
        focusable = true,
        enableUserInput = enabled,
        content = content
    )
}
