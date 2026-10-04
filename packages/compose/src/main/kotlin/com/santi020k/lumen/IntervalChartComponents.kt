package com.santi020k.lumen

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.Immutable
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.text.drawText
import androidx.compose.ui.text.rememberTextMeasurer
import androidx.compose.ui.unit.dp
import kotlin.math.abs
import kotlin.math.max
import kotlin.math.min

// A total replaces the running balance; a delta changes it by a signed amount.
enum class LumenWaterfallKind { Delta, Total }
enum class LumenHistogramFrequency { Count, Density }

@Immutable
data class LumenWaterfallDatum(
    val id: String,
    val label: String,
    val value: Double,
    val kind: LumenWaterfallKind = LumenWaterfallKind.Delta,
    val tone: LumenChartTone? = null
)

@Immutable
data class LumenHistogramBin(val start: Double, val end: Double, val count: Double, val label: String? = null)

internal data class LumenIntervalMark(
    val id: String, val label: String, val start: Double, val end: Double,
    val value: Double, val tone: LumenChartTone, val count: Double? = null
)

internal data class LumenIntervalModel(val marks: List<LumenIntervalMark>, val valid: Boolean)

internal fun lumenWaterfallModel(data: List<LumenWaterfallDatum>): LumenIntervalModel {
    var balance = 0.0
    val seen = mutableSetOf<String>()
    val marks = mutableListOf<LumenIntervalMark>()
    for (datum in data) {
        val start = if (datum.kind == LumenWaterfallKind.Total) 0.0 else balance
        val end = if (datum.kind == LumenWaterfallKind.Total) datum.value else balance + datum.value
        if (!datum.value.isFinite() || !end.isFinite() || !seen.add(datum.id)) {
            return LumenIntervalModel(emptyList(), false)
        }
        val tone = datum.tone ?: when {
            datum.kind == LumenWaterfallKind.Total -> LumenChartTone.Series1
            datum.value < 0 -> LumenChartTone.Series3
            else -> LumenChartTone.Series2
        }
        marks += LumenIntervalMark(datum.id, datum.label, start, end, datum.value, tone)
        balance = end
    }
    return LumenIntervalModel(marks, true)
}

internal fun lumenHistogramModel(
    data: List<LumenHistogramBin>, frequency: LumenHistogramFrequency,
    tone: LumenChartTone, formatBoundary: (Double) -> String
): LumenIntervalModel {
    val bins = data.sortedBy { it.start }
    val firstWidth = bins.firstOrNull()?.let { it.end - it.start } ?: 0.0
    var previousEnd: Double? = null
    val marks = mutableListOf<LumenIntervalMark>()
    for (bin in bins) {
        val width = bin.end - bin.start
        val value = if (frequency == LumenHistogramFrequency.Density) bin.count / width else bin.count
        if (!listOf(bin.start, bin.end, bin.count, width, value).all(Double::isFinite) ||
            width <= 0 || bin.count < 0 || previousEnd?.let { bin.start < it } == true ||
            (frequency == LumenHistogramFrequency.Count && abs(width - firstWidth) > abs(firstWidth) * 1e-9)
        ) return LumenIntervalModel(emptyList(), false)
        marks += LumenIntervalMark(bin.start.toString(), bin.label ?: "${formatBoundary(bin.start)}–${formatBoundary(bin.end)}", bin.start, bin.end, value, tone, bin.count)
        previousEnd = bin.end
    }
    return LumenIntervalModel(marks, true)
}

@Composable
fun LumenWaterfallChart(
    data: List<LumenWaterfallDatum>, label: String, modifier: Modifier = Modifier,
    heading: String? = null, description: String? = null, labels: LumenChartLabels = LumenChartLabels(),
    showData: Boolean = true, valueLabel: String = labels.value
) {
    LumenIntervalChart(lumenWaterfallModel(data), label, modifier, heading, description, labels, showData, valueLabel, labels.formatValue, false, false)
}

@Composable
fun LumenHistogram(
    data: List<LumenHistogramBin>, label: String, modifier: Modifier = Modifier,
    heading: String? = null, description: String? = null, labels: LumenChartLabels = LumenChartLabels(),
    frequency: LumenHistogramFrequency = LumenHistogramFrequency.Count,
    tone: LumenChartTone = LumenChartTone.Series1, showData: Boolean = true,
    formatBoundary: (Double) -> String = labels.formatValue
) {
    val density = frequency == LumenHistogramFrequency.Density
    LumenIntervalChart(lumenHistogramModel(data, frequency, tone, formatBoundary), label, modifier, heading, description, labels, showData, if (density) labels.density else labels.count, formatBoundary, true, density)
}

@Composable
private fun LumenIntervalChart(
    model: LumenIntervalModel, label: String, modifier: Modifier, heading: String?, description: String?,
    labels: LumenChartLabels, showData: Boolean, valueLabel: String, formatBoundary: (Double) -> String,
    histogram: Boolean, density: Boolean
) {
    val theme = LocalLumenTheme.current
    val summary = if (model.valid) labels.formatSummary(LumenChartSummary.resolve(listOf(LumenChartSeries(
        "values", valueLabel, model.marks.map { LumenChartDatum(it.id, LumenChartX.Category(it.label), it.value) }
    )))) else labels.invalidData
    val textMeasurer = rememberTextMeasurer()
    val textStyle = MaterialTheme.typography.labelSmall.copy(color = theme.colors.inkSoft)
    val values = model.marks.flatMap { if (histogram) listOf(0.0, it.value) else listOf(it.start, it.end, 0.0) }
    val minimum = min(0.0, values.minOrNull() ?: 0.0)
    val maximum = max(0.0, values.maxOrNull() ?: 1.0).let { if (it == minimum) it + 1 else it }
    val ticks = (0..4).map { index -> minimum * (1 - index / 4.0) + maximum * (index / 4.0) }
    val tickLabels = ticks.map { textMeasurer.measure(labels.formatValue(it), textStyle) }
    val categoryValues = if (histogram) model.marks.flatMap { listOf(it.start, it.end) }.distinct().sorted() else emptyList()
    val categoryLabels = if (histogram) categoryValues.map { textMeasurer.measure(formatBoundary(it), textStyle) }
        else model.marks.map { textMeasurer.measure(it.label, textStyle) }

    LumenChartFrame(label, summary, modifier, heading, description) {
        if (model.marks.isEmpty()) {
            Text(if (model.valid) labels.empty else labels.invalidData, color = theme.colors.inkSoft)
        } else {
            Text(valueLabel, color = theme.colors.inkSoft, style = MaterialTheme.typography.labelMedium)
            Canvas(Modifier.fillMaxWidth().height(260.dp).clearAndSetSemantics {}) {
                val left = max(48.dp.toPx(), (tickLabels.maxOfOrNull { it.size.width } ?: 0) + 12.dp.toPx())
                val right = size.width - 16.dp.toPx()
                val top = 12.dp.toPx()
                val bottom = size.height - 44.dp.toPx()
                // Halving first avoids overflowing a valid domain spanning opposite extremes.
                fun y(value: Double): Float = bottom - ((value / 2 - minimum / 2) / (maximum / 2 - minimum / 2)).toFloat() * (bottom - top)
                val xMin = model.marks.first().start
                val xMax = model.marks.last().end
                fun x(value: Double): Float = left + ((value / 2 - xMin / 2) / (xMax / 2 - xMin / 2)).toFloat() * (right - left)
                ticks.forEachIndexed { index, value ->
                    drawLine(theme.chartColors.grid, Offset(left, y(value)), Offset(right, y(value)), pathEffect = PathEffect.dashPathEffect(floatArrayOf(3.dp.toPx(), 5.dp.toPx())))
                    drawText(tickLabels[index], topLeft = Offset(left - tickLabels[index].size.width - 8.dp.toPx(), y(value) - tickLabels[index].size.height / 2))
                }
                val band = (right - left) / model.marks.size
                model.marks.forEachIndexed { index, mark ->
                    val markLeft = if (histogram) x(mark.start) else left + band * (index + 0.15f)
                    val markRight = if (histogram) x(mark.end) else left + band * (index + 0.85f)
                    val from = y(if (histogram) 0.0 else mark.start)
                    val to = y(if (histogram) mark.value else mark.end)
                    drawRect(theme.chartColor(mark.tone), Offset(markLeft, min(from, to)), Size(max(0f, markRight - markLeft - if (histogram) 1.dp.toPx() else 0f), abs(to - from)))
                    if (!histogram && index < model.marks.lastIndex) {
                        drawLine(theme.colors.inkSoft, Offset(markRight, to), Offset(left + band * (index + 1.15f), to), pathEffect = PathEffect.dashPathEffect(floatArrayOf(4.dp.toPx(), 4.dp.toPx())))
                    }
                }
                val positions = categoryLabels.indices.map { index ->
                    if (histogram) x(categoryValues[index]) else left + band * (index + 0.5f)
                }
                val labelLefts = positions.mapIndexed { index, center ->
                    (center - categoryLabels[index].size.width / 2).coerceIn(0f, max(0f, size.width - categoryLabels[index].size.width))
                }
                var previousRight = Float.NEGATIVE_INFINITY
                categoryLabels.forEachIndexed { index, text ->
                    val labelLeft = labelLefts[index]
                    val labelRight = labelLeft + text.size.width
                    val lastLeft = labelLefts.last()
                    val last = index == categoryLabels.lastIndex
                    if (labelLeft >= previousRight + 8.dp.toPx() && (last || labelRight + 8.dp.toPx() < lastLeft)) {
                        drawText(text, topLeft = Offset(labelLeft, bottom + 8.dp.toPx()))
                        previousRight = labelRight
                    }
                }
            }
            if (showData) {
                LumenStructuredChartDataList(model.marks.map { mark ->
                    val count = if (density) mark.count?.let { ", ${labels.count}: ${labels.formatValue(it)}" } ?: "" else ""
                    LumenStructuredChartDataRow(mark.id, "${mark.label}, ${labels.start}: ${formatBoundary(mark.start)}, ${labels.end}: ${formatBoundary(mark.end)}, $valueLabel: ${labels.formatValue(mark.value)}$count")
                }, labels)
            }
        }
    }
}
