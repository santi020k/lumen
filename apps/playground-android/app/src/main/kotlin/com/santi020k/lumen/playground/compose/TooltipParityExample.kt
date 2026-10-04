package com.santi020k.lumen.playground.compose

import androidx.compose.foundation.layout.Column
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import com.santi020k.lumen.LumenButton
import com.santi020k.lumen.LumenCheckbox
import com.santi020k.lumen.LumenText
import com.santi020k.lumen.LumenTooltip
import com.santi020k.lumen.rememberLumenTooltipState
import kotlinx.coroutines.launch

@Composable
fun TooltipParityExample() {
    var disabled by remember { mutableStateOf(false) }
    val state = rememberLumenTooltipState(isPersistent = true)
    val scope = rememberCoroutineScope()
    Column {
        LumenCheckbox("Disable help", disabled, { disabled = it })
        LumenTooltip("This playground uses synthetic project information.", state = state, enabled = !disabled) {
            LumenButton(enabled = !disabled, onClick = { if (!disabled) scope.launch { state.show() } }) {
                LumenText("Project privacy help")
            }
        }
        LumenText("Host visibility: ${if (state.isVisible) "shown" else "hidden"}")
        LumenButton(enabled = !disabled, onClick = { if (!disabled) scope.launch { state.show() } }) {
            LumenText("Show help explicitly")
        }
        LumenButton(onClick = { state.dismiss() }) { LumenText("Dismiss help explicitly") }
    }
}
