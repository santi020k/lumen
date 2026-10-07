package com.santi020k.lumen

import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.RangeSlider
import androidx.compose.material3.SliderDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.stateDescription

internal fun normalizeLumenRange(
    value: ClosedFloatingPointRange<Float>,
    bounds: ClosedFloatingPointRange<Float>
): ClosedFloatingPointRange<Float> {
    require(bounds.start.isFinite() && bounds.endInclusive.isFinite() && bounds.start < bounds.endInclusive &&
        (bounds.endInclusive - bounds.start).isFinite()) { "Range bounds must be finite, increasing, and have a finite span." }
    val start = if (value.start.isFinite()) value.start.coerceIn(bounds) else bounds.start
    val end = if (value.endInclusive.isFinite()) value.endInclusive.coerceIn(bounds) else bounds.endInclusive
    return minOf(start, end)..maxOf(start, end)
}

/** Two separately labeled native thumbs; the application owns units, formatting, and persistence. */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LumenRangeSlider(
    label: String,
    value: ClosedFloatingPointRange<Float>,
    onValueChange: (ClosedFloatingPointRange<Float>) -> Unit,
    modifier: Modifier = Modifier,
    valueRange: ClosedFloatingPointRange<Float> = 0f..1f,
    steps: Int = 0,
    enabled: Boolean = true,
    readOnly: Boolean = false,
    startLabel: String = "Minimum",
    endLabel: String = "Maximum",
    formatValue: (Float) -> String = { it.toString() },
    onValueChangeFinished: (() -> Unit)? = null
) {
    require(steps in 0..10000) { "steps must be between 0 and 10000." }
    val normalized = normalizeLumenRange(value, valueRange)
    val start = remember { MutableInteractionSource() }
    val end = remember { MutableInteractionSource() }
    val colors = LocalLumenTheme.current.colors
    val sliderColors = SliderDefaults.colors(thumbColor = colors.brandSolid,
        activeTrackColor = colors.brandSolid, inactiveTrackColor = colors.surfaceStrong)
    val editable = enabled && !readOnly
    Column(modifier, verticalArrangement = Arrangement.spacedBy(LumenSpacing.Xs)) {
        LumenText(label, variant = LumenTextVariant.Label)
        LumenText("${formatValue(normalized.start)} – ${formatValue(normalized.endInclusive)}", tone = LumenTextTone.Muted)
        RangeSlider(value = normalized, onValueChange = { if (editable) onValueChange(it) },
            valueRange = valueRange, steps = steps, enabled = editable,
            onValueChangeFinished = onValueChangeFinished?.let { finished -> { if (editable) finished() } },
            startInteractionSource = start, endInteractionSource = end,
            colors = sliderColors,
            startThumb = {
                SliderDefaults.Thumb(interactionSource = start, enabled = editable, colors = sliderColors,
                    modifier = Modifier.semantics {
                        contentDescription = "$label · $startLabel"
                        stateDescription = formatValue(normalized.start)
                    })
            },
            endThumb = {
                SliderDefaults.Thumb(interactionSource = end, enabled = editable, colors = sliderColors,
                    modifier = Modifier.semantics {
                        contentDescription = "$label · $endLabel"
                        stateDescription = formatValue(normalized.endInclusive)
                    })
            })
    }
}
