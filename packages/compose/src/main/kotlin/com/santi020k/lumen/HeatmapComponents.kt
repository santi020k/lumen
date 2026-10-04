package com.santi020k.lumen

// cspell:words lerp

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.lerp
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.text.drawText
import androidx.compose.ui.text.rememberTextMeasurer
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Constraints
import androidx.compose.ui.unit.dp
import kotlin.math.abs
import kotlin.math.max
import kotlin.math.min

enum class LumenHeatmapColorScale { Sequential, Diverging }

internal data class LumenHeatmapModel(
    val cells: List<LumenHeatmapDatum>, val columns: List<String>, val rows: List<String>,
    val domain: ClosedFloatingPointRange<Double>, val midpoint: Double
)

internal fun lumenHeatmapRatio(value: Double, domain: ClosedFloatingPointRange<Double>): Float {
    val span = domain.endInclusive - domain.start
    if (!value.isFinite() || span <= 0) return 0.5f
    val ratio = if (span.isFinite()) (value - domain.start) / span
        else (value / 2 - domain.start / 2) / (domain.endInclusive / 2 - domain.start / 2)
    return ratio.coerceIn(0.0, 1.0).toFloat()
}

internal fun lumenHeatmapModel(
    data: List<LumenHeatmapDatum>, colorScale: LumenHeatmapColorScale,
    domain: ClosedFloatingPointRange<Double>?, midpoint: Double
): LumenHeatmapModel {
    val cells = data.distinctBy { it.column to it.row }
    val values = cells.mapNotNull { it.value?.takeIf(Double::isFinite) }
    var minimum = values.minOrNull() ?: 0.0
    var maximum = values.maxOrNull() ?: 1.0
    if (minimum == maximum) {
        val offset = max(Double.MIN_VALUE, abs(if (minimum == 0.0) 1.0 else minimum) * 0.1)
        minimum = max(-Double.MAX_VALUE, minimum - offset)
        maximum = min(Double.MAX_VALUE, maximum + offset)
    }
    var center = midpoint.takeIf(Double::isFinite) ?: 0.0
    val requested = domain?.takeIf { it.start.isFinite() && it.endInclusive.isFinite() && it.start < it.endInclusive }
    if (colorScale == LumenHeatmapColorScale.Diverging) {
        if (requested != null && requested.start < center && requested.endInclusive > center) {
            minimum = requested.start
            maximum = requested.endInclusive
        } else {
            var radius = max(1.0, max(abs(minimum - center), abs(maximum - center)))
            if (!(center - radius).isFinite() || !(center + radius).isFinite()) {
                center = 0.0
                radius = max(1.0, max(abs(minimum), abs(maximum)))
            }
            minimum = center - radius
            maximum = center + radius
        }
    } else if (requested != null) {
        minimum = requested.start
        maximum = requested.endInclusive
    }
    return LumenHeatmapModel(cells, cells.map { it.column }.distinct(), cells.map { it.row }.distinct(), minimum..maximum, center)
}

internal fun lumenHeatmapColor(value: Double, model: LumenHeatmapModel, scale: LumenHeatmapColorScale, colors: LumenChartColorPalette): Color =
    if (scale == LumenHeatmapColorScale.Sequential) {
        lerp(colors.sequentialLow, colors.sequentialHigh, lumenHeatmapRatio(value, model.domain))
    } else if (value < model.midpoint) {
        lerp(colors.divergingNegative, colors.divergingMid, lumenHeatmapRatio(value, model.domain.start..model.midpoint))
    } else {
        lerp(colors.divergingMid, colors.divergingPositive, lumenHeatmapRatio(value, model.midpoint..model.domain.endInclusive))
    }

@Composable
internal fun LumenHeatmapContent(
    data: List<LumenHeatmapDatum>, label: String, modifier: Modifier, summary: String?,
    labels: LumenChartLabels, showData: Boolean, heading: String?, description: String?,
    colorScale: LumenHeatmapColorScale, domain: ClosedFloatingPointRange<Double>?, midpoint: Double
) {
    val theme = LocalLumenTheme.current
    val model = lumenHeatmapModel(data, colorScale, domain, midpoint)
    val available = model.cells.count { it.value?.isFinite() == true }
    LumenChartFrame(label, summary ?: labels.formatHeatmapSummary(available), modifier, heading, description) {
        if (available == 0) Text(labels.empty, color = theme.colors.inkSoft)
        else {
            LumenHeatmapPlot(model, colorScale)
            LumenHeatmapLegend(model, colorScale, labels)
            if (available < model.cells.size) Text("× ${labels.notAvailable}", color = theme.colors.inkSoft, style = MaterialTheme.typography.labelSmall)
        }
        if (showData) LumenStructuredChartDataList(model.cells.map { datum ->
            val value = datum.value?.takeIf(Double::isFinite)?.let(labels.formatValue) ?: labels.notAvailable
            LumenStructuredChartDataRow("${datum.column.length}:${datum.column}${datum.row}", "${datum.label ?: "${datum.column}, ${datum.row}"}: $value")
        }, labels)
    }
}

@Composable
private fun LumenHeatmapPlot(model: LumenHeatmapModel, scale: LumenHeatmapColorScale) {
    val theme = LocalLumenTheme.current
    val measurer = rememberTextMeasurer()
    val style = MaterialTheme.typography.labelSmall.copy(color = theme.colors.inkSoft)
    val rowLabels = model.rows.map { measurer.measure(it, style) }
    val columns = model.columns.withIndex().associate { it.value to it.index }
    val rows = model.rows.withIndex().associate { it.value to it.index }
    Canvas(Modifier.fillMaxWidth().height(256.dp).clearAndSetSemantics {}) {
        val left = min(size.width * 0.3f, max(48.dp.toPx(), (rowLabels.maxOfOrNull { it.size.width } ?: 0) + 12.dp.toPx()))
        val top = 8.dp.toPx()
        val bottom = size.height - 40.dp.toPx()
        val cellWidth = (size.width - left - 8.dp.toPx()) / model.columns.size
        val cellHeight = (bottom - top) / model.rows.size
        val gap = min(2.dp.toPx(), min(cellWidth, cellHeight) * 0.1f)
        model.cells.forEach { datum ->
            val column = columns[datum.column] ?: return@forEach
            val row = rows[datum.row] ?: return@forEach
            val width = max(0f, cellWidth - gap)
            val height = max(0f, cellHeight - gap)
            val origin = Offset(left + column * cellWidth + gap / 2, top + row * cellHeight + gap / 2)
            val value = datum.value?.takeIf(Double::isFinite)
            drawRoundRect(value?.let { lumenHeatmapColor(it, model, scale, theme.chartColors) } ?: theme.colors.surfaceMuted, origin, Size(width, height), CornerRadius(2.dp.toPx()))
            if (value == null) {
                val center = origin + Offset(width / 2, height / 2)
                val half = min(3.dp.toPx(), min(width, height) / 4)
                drawLine(theme.colors.inkSoft, center - Offset(half, half), center + Offset(half, half), 1.dp.toPx())
                drawLine(theme.colors.inkSoft, center + Offset(-half, half), center + Offset(half, -half), 1.dp.toPx())
            }
        }
        var previousBottom = Float.NEGATIVE_INFINITY
        model.rows.forEachIndexed { index, text ->
            val measured = measurer.measure(text, style, overflow = TextOverflow.Ellipsis, maxLines = 1, constraints = Constraints(maxWidth = max(1, (left - 12.dp.toPx()).toInt())))
            val y = top + (index + 0.5f) * cellHeight - measured.size.height / 2
            if (y >= previousBottom + 4.dp.toPx()) {
                drawText(measured, topLeft = Offset(left - measured.size.width - 8.dp.toPx(), y))
                previousBottom = y + measured.size.height
            }
        }
        val columnLabels = model.columns.map { measurer.measure(it, style, maxLines = 1) }
        var previousRight = Float.NEGATIVE_INFINITY
        columnLabels.forEachIndexed { index, text ->
            val x = (left + (index + 0.5f) * cellWidth - text.size.width / 2).coerceIn(0f, max(0f, size.width - text.size.width))
            val lastLeft = size.width - 8.dp.toPx() - cellWidth / 2 - columnLabels.last().size.width / 2
            if (x >= previousRight + 8.dp.toPx() && (index == columnLabels.lastIndex || x + text.size.width + 8.dp.toPx() < lastLeft)) {
                drawText(text, topLeft = Offset(x, bottom + 8.dp.toPx()))
                previousRight = x + text.size.width
            }
        }
    }
}

@Composable
private fun LumenHeatmapLegend(model: LumenHeatmapModel, scale: LumenHeatmapColorScale, labels: LumenChartLabels) {
    val theme = LocalLumenTheme.current
    val measurer = rememberTextMeasurer()
    val style = MaterialTheme.typography.labelSmall.copy(color = theme.colors.inkSoft)
    val diverging = scale == LumenHeatmapColorScale.Diverging
    val ratio = lumenHeatmapRatio(model.midpoint, model.domain)
    val stops = if (diverging) arrayOf(0f to theme.chartColors.divergingNegative, ratio to theme.chartColors.divergingMid, 1f to theme.chartColors.divergingPositive)
        else arrayOf(0f to theme.chartColors.sequentialLow, 1f to theme.chartColors.sequentialHigh)
    val values = if (diverging) listOf(model.domain.start, model.domain.endInclusive, model.midpoint) else listOf(model.domain.start, model.domain.endInclusive)
    val description = "${labels.start}: ${labels.formatValue(model.domain.start)}, ${labels.end}: ${labels.formatValue(model.domain.endInclusive)}" +
        if (diverging) ", ${labels.value}: ${labels.formatValue(model.midpoint)}" else ""
    Canvas(Modifier.fillMaxWidth().height(if (diverging) 60.dp else 40.dp).clearAndSetSemantics { contentDescription = description }) {
        drawRoundRect(Brush.horizontalGradient(*stops), size = Size(size.width, 8.dp.toPx()), cornerRadius = CornerRadius(4.dp.toPx()))
        values.forEachIndexed { index, value ->
            val text = measurer.measure(labels.formatValue(value), style)
            val x = when (index) { 0 -> 0f; 1 -> size.width - text.size.width; else -> size.width * ratio - text.size.width / 2 }
            drawText(text, topLeft = Offset(x.coerceIn(0f, max(0f, size.width - text.size.width)), (if (index == 2) 36.dp else 12.dp).toPx()))
        }
    }
}
