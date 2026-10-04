package com.santi020k.lumen

import androidx.compose.foundation.background
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.sizeIn
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.Immutable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.selected
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.unit.dp

public enum class LumenStepState { Complete, Current, Upcoming }

fun resolveLumenStepState(index: Int, currentStep: Int, count: Int): LumenStepState {
    val current = currentStep.coerceIn(0, count.coerceAtLeast(0))
    return if (index < current) LumenStepState.Complete
    else if (index == current) LumenStepState.Current else LumenStepState.Upcoming
}

@Immutable
data class LumenStepItem(val id: String, val title: String, val description: String? = null)

@Composable
fun LumenStepper(
    label: String,
    steps: List<LumenStepItem>,
    currentStep: Int,
    modifier: Modifier = Modifier,
    horizontal: Boolean = false,
    formatState: (LumenStepState) -> String = {
        when (it) {
            LumenStepState.Complete -> "Complete"
            LumenStepState.Current -> "Current"
            LumenStepState.Upcoming -> "Upcoming"
        }
    }
) {
    val content: @Composable () -> Unit = {
        steps.forEachIndexed { index, step ->
            androidx.compose.runtime.key(step.id) {
                val state = resolveLumenStepState(index, currentStep, steps.size)
                val colors = LocalLumenTheme.current.colors
                Row(
                    modifier = (if (horizontal) Modifier.width(220.dp) else Modifier)
                        .clearAndSetSemantics {
                            contentDescription = "${index + 1} / ${steps.size}, ${step.title}" +
                                (step.description?.let { ", $it" } ?: "")
                            stateDescription = formatState(state)
                            selected = state == LumenStepState.Current
                        },
                    horizontalArrangement = Arrangement.spacedBy(LumenSpacing.Sm),
                    verticalAlignment = Alignment.Top
                ) {
                    Box(Modifier.sizeIn(minWidth = 32.dp, minHeight = 32.dp)
                        .background(if (state == LumenStepState.Upcoming) colors.surfaceMuted else colors.brandSolid, CircleShape),
                        contentAlignment = Alignment.Center) {
                        androidx.compose.material3.Text("${index + 1}",
                            color = if (state == LumenStepState.Upcoming) colors.ink else colors.onBrand)
                    }
                    Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(LumenSpacing.Xs)) {
                        LumenText(step.title)
                        step.description?.let { LumenText(it) }
                        LumenText(formatState(state))
                    }
                }
            }
        }
    }
    Column(modifier, verticalArrangement = Arrangement.spacedBy(LumenSpacing.Sm)) {
        LumenText(label)
        if (horizontal) {
            Row(Modifier.horizontalScroll(rememberScrollState()),
                horizontalArrangement = Arrangement.spacedBy(LumenSpacing.Md)) { content() }
        } else {
            Column(verticalArrangement = Arrangement.spacedBy(LumenSpacing.Md)) { content() }
        }
    }
}
