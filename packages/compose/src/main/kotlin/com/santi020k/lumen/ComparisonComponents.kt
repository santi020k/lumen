package com.santi020k.lumen

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Slider
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawWithContent
import androidx.compose.ui.graphics.drawscope.clipRect
import androidx.compose.ui.graphics.painter.Painter
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.stateDescription
import java.text.NumberFormat
import java.util.Locale

internal fun normalizeLumenComparisonValue(value: Float): Float =
    if (value.isFinite()) value.coerceIn(0f, 1f) else 0.5f

internal fun normalizeLumenComparisonRatio(value: Float): Float =
    value.takeIf { it.isFinite() && it in 0.1f..10f } ?: 16f / 9f

enum class LumenImageComparisonMode { Reveal, SideBySide, Before, After }

/** Painter-owned images and a native adjustable slider; value is the visible after fraction. */
@Composable
fun LumenImageComparison(
    label: String,
    before: Painter,
    after: Painter,
    value: Float,
    onValueChange: (Float) -> Unit,
    modifier: Modifier = Modifier,
    beforeLabel: String = "Before",
    afterLabel: String = "After",
    aspectRatio: Float = 16f / 9f,
    fit: LumenImageFit = LumenImageFit.Cover,
    locale: Locale = Locale.getDefault(),
    enabled: Boolean = true,
    mode: LumenImageComparisonMode = LumenImageComparisonMode.Reveal
) {
    val position = normalizeLumenComparisonValue(value)
    val ratio = normalizeLumenComparisonRatio(aspectRatio)
    val percentage = NumberFormat.getPercentInstance(locale).format(position.toDouble())
    val colors = LocalLumenTheme.current.colors
    val rtl = LocalLayoutDirection.current == LayoutDirection.Rtl
    Column(modifier = modifier, verticalArrangement = Arrangement.spacedBy(LumenSpacing.Sm)) {
        if (mode == LumenImageComparisonMode.Reveal) {
            Box(modifier = Modifier.fillMaxWidth().aspectRatio(ratio).clip(RoundedCornerShape(LumenRadius.Lg))) {
                LumenImage(before, label = null, modifier = Modifier.fillMaxSize(), fit = fit, radius = LumenImageRadius.None)
                Box(modifier = Modifier.fillMaxSize().drawWithContent {
                    clipRect(
                        left = if (rtl) size.width * (1f - position) else 0f,
                        right = if (rtl) size.width else size.width * position
                    ) { this@drawWithContent.drawContent() }
                }) {
                    LumenImage(after, label = null, modifier = Modifier.fillMaxSize(), fit = fit, radius = LumenImageRadius.None)
                }
                Canvas(modifier = Modifier.fillMaxSize()) {
                    val x = size.width * (if (rtl) 1f - position else position)
                    drawLine(colors.ink, androidx.compose.ui.geometry.Offset(x, 0f), androidx.compose.ui.geometry.Offset(x, size.height), strokeWidth = LumenSpacing.Xs.toPx())
                }
            }
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text(afterLabel)
                Text(beforeLabel)
            }
            Text(label)
            Slider(
                value = position,
                onValueChange = { if (enabled) onValueChange(normalizeLumenComparisonValue(it)) },
                enabled = enabled,
                modifier = Modifier.fillMaxWidth().semantics {
                    contentDescription = label
                    stateDescription = "$afterLabel $percentage"
                }
            )
        } else {
            Text(label)
            if (mode == LumenImageComparisonMode.SideBySide) {
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(LumenSpacing.Sm)) {
                    LumenComparisonPreview(before, beforeLabel, ratio, fit, Modifier.weight(1f))
                    LumenComparisonPreview(after, afterLabel, ratio, fit, Modifier.weight(1f))
                }
            } else if (mode == LumenImageComparisonMode.Before) {
                LumenComparisonPreview(before, beforeLabel, ratio, fit, Modifier.fillMaxWidth())
            } else {
                LumenComparisonPreview(after, afterLabel, ratio, fit, Modifier.fillMaxWidth())
            }
        }

    }
}

@Composable
private fun LumenComparisonPreview(painter: Painter, label: String, ratio: Float, fit: LumenImageFit, modifier: Modifier) {
    Column(modifier, verticalArrangement = Arrangement.spacedBy(LumenSpacing.Xs)) {
        LumenImage(painter, label = null, modifier = Modifier.fillMaxWidth().aspectRatio(ratio), fit = fit)
        Text(label)
    }
}
