// cspell:words tnum
package com.santi020k.lumen

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.Immutable
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import kotlin.math.abs
import kotlin.math.max
import kotlin.math.min

@Immutable
data class LumenBulletRange(val end: Double, val label: String, val tone: LumenChartTone? = null)

internal data class LumenBulletBand(val start: Double, val range: LumenBulletRange)
internal data class LumenBulletModel(
    val domain: ClosedFloatingPointRange<Double>, val ranges: List<LumenBulletBand>, val valid: Boolean
) {
    fun position(value: Double): Float = lumenChartRatio(value, domain)
    val ticks: List<Double> get() = listOf(domain.start, domain.start / 2 + domain.endInclusive / 2, domain.endInclusive)
}

internal fun lumenBulletModel(
    value: Double?, target: Double, ranges: List<LumenBulletRange>, domain: ClosedFloatingPointRange<Double>?
): LumenBulletModel {
    val invalid = LumenBulletModel(0.0..1.0, emptyList(), false)
    val values = listOf(0.0, target) + ranges.map { it.end } + listOfNotNull(value)
    if (!values.all(Double::isFinite)) return invalid
    val minimum = values.minOrNull() ?: 0.0
    val maximum = values.maxOrNull() ?: 1.0
    val resolved = domain ?: minimum..(if (minimum == maximum) minimum + 1 else maximum)
    if (!resolved.start.isFinite() || !resolved.endInclusive.isFinite() || resolved.start >= resolved.endInclusive ||
        0.0 !in resolved || values.any { it !in resolved }) return invalid
    var previous = resolved.start
    val bands = mutableListOf<LumenBulletBand>()
    for (range in ranges.sortedBy { it.end }) {
        if (range.label.isBlank() || range.end <= previous) return invalid
        bands += LumenBulletBand(previous, range)
        previous = range.end
    }
    return LumenBulletModel(resolved, bands, true)
}

@Composable
fun LumenBulletChart(
    value: Double?, target: Double, label: String, modifier: Modifier = Modifier,
    ranges: List<LumenBulletRange> = emptyList(), domain: ClosedFloatingPointRange<Double>? = null,
    heading: String? = null, description: String? = null, labels: LumenChartLabels = LumenChartLabels(),
    targetLabel: String = "Target", valueLabel: String = labels.value,
    tone: LumenChartTone = LumenChartTone.Series1, showData: Boolean = true
) {
    val theme = LocalLumenTheme.current
    val model = lumenBulletModel(value, target, ranges, domain)
    val actual = value?.let(labels.formatValue) ?: labels.notAvailable
    val summary = if (model.valid) "$valueLabel: $actual. $targetLabel: ${labels.formatValue(target)}." else labels.invalidData
    LumenChartFrame(label, summary, modifier, heading, description) {
        if (!model.valid) {
            Text(labels.invalidData, color = theme.colors.inkSoft)
        } else {
            FlowRow(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalArrangement = Arrangement.spacedBy(LumenSpacing.Sm)) {
                Column(verticalArrangement = Arrangement.spacedBy(LumenSpacing.Xs)) {
                    Text(valueLabel, color = theme.colors.inkSoft, style = MaterialTheme.typography.labelMedium)
                    Text(actual, color = theme.colors.ink, style = MaterialTheme.typography.displaySmall.copy(fontFeatureSettings = "tnum"), fontWeight = FontWeight.Bold)
                }
                Text("$targetLabel: ${labels.formatValue(target)}", color = theme.colors.inkSoft, style = MaterialTheme.typography.bodyMedium)
            }
            LumenBulletPlot(model, value, target, tone, labels)
            FlowRow(horizontalArrangement = Arrangement.spacedBy(LumenSpacing.Lg), verticalArrangement = Arrangement.spacedBy(LumenSpacing.Sm)) {
                model.ranges.forEach { band ->
                    Column(verticalArrangement = Arrangement.spacedBy(LumenSpacing.Xs)) {
                        Text(band.range.label, color = theme.colors.ink, style = MaterialTheme.typography.labelMedium)
                        Text("${labels.formatValue(band.start)}–${labels.formatValue(band.range.end)}", color = theme.colors.inkSoft, style = MaterialTheme.typography.labelSmall)
                    }
                }
            }
            if (showData) LumenStructuredChartDataList(listOf(
                LumenStructuredChartDataRow("actual", "$valueLabel: $actual"),
                LumenStructuredChartDataRow("target", "$targetLabel: ${labels.formatValue(target)}")
            ) + model.ranges.map { LumenStructuredChartDataRow("range:${it.range.end}", "${it.range.label}: ${labels.formatValue(it.start)}–${labels.formatValue(it.range.end)}") }, labels)
        }
    }
}

@Composable
private fun LumenBulletPlot(model: LumenBulletModel, value: Double?, target: Double, tone: LumenChartTone, labels: LumenChartLabels) {
    val theme = LocalLumenTheme.current
    Column(verticalArrangement = Arrangement.spacedBy(LumenSpacing.Md), modifier = Modifier.clearAndSetSemantics {}) {
        Canvas(Modifier.fillMaxWidth().height(52.dp)) {
            val top = 6.dp.toPx()
            val height = 40.dp.toPx()
            drawRect(theme.colors.surfaceMuted, Offset(0f, top), Size(size.width, height))
            model.ranges.forEachIndexed { index, band ->
                val left = model.position(band.start) * size.width
                val width = (model.position(band.range.end) - model.position(band.start)) * size.width
                val opacity = 0.08f + index.toFloat() / max(1, model.ranges.size - 1) * 0.14f
                drawRect(theme.chartColor(band.range.tone ?: LumenChartTone.Neutral).copy(alpha = opacity), Offset(left, top), Size(max(0f, width - 1.dp.toPx()), height))
            }
            if (value != null) {
                val zero = model.position(0.0) * size.width
                val actual = model.position(value) * size.width
                drawRect(theme.chartColor(tone), Offset(min(zero, actual), 18.dp.toPx()), Size(abs(actual - zero), 16.dp.toPx()))
            }
            val marker = model.position(target) * size.width
            drawRect(theme.colors.surface, Offset(marker - 2.5.dp.toPx(), 0f), Size(5.dp.toPx(), size.height))
            drawRect(theme.colors.ink, Offset(marker - 1.5.dp.toPx(), 0f), Size(3.dp.toPx(), size.height))
            drawRect(theme.colors.ink, Offset(marker - 4.5.dp.toPx(), 0f), Size(9.dp.toPx(), 3.dp.toPx()))
            drawRect(theme.colors.ink, Offset(marker - 4.5.dp.toPx(), size.height - 3.dp.toPx()), Size(9.dp.toPx(), 3.dp.toPx()))
        }
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(LumenSpacing.Sm)) {
            model.ticks.forEachIndexed { index, tick ->
                Text(labels.formatValue(tick), Modifier.weight(1f), color = theme.colors.inkSoft, style = MaterialTheme.typography.labelSmall, textAlign = when(index) { 0 -> TextAlign.Start; 2 -> TextAlign.End; else -> TextAlign.Center })
            }
        }
    }
}
