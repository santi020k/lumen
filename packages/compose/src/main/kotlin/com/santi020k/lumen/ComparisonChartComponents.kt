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
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import kotlin.math.abs
import kotlin.math.max
import kotlin.math.min

@Immutable
data class LumenComparisonDatum(val id: String, val label: String, val value: Double?, val reference: Double? = null, val tone: LumenChartTone? = null)
internal data class LumenComparisonModel(val domain: ClosedFloatingPointRange<Double>, val valid: Boolean) {
    fun position(value: Double): Float = lumenChartRatio(value, domain)
    val ticks: List<Double> get() = listOf(domain.start, domain.start / 2 + domain.endInclusive / 2, domain.endInclusive)
}
internal fun lumenComparisonModel(data: List<LumenComparisonDatum>, paired: Boolean, domain: ClosedFloatingPointRange<Double>?): LumenComparisonModel {
    val invalid = LumenComparisonModel(0.0..1.0, false)
    val ids = mutableSetOf<String>()
    var minimum = 0.0
    var maximum = 0.0
    for (row in data) {
        if (row.id.isBlank() || row.label.isBlank() || !ids.add(row.id) || row.value?.isFinite() == false || row.reference?.isFinite() == false) return invalid
        for (value in listOfNotNull(row.value, if (paired) row.reference else null)) {
            minimum = min(minimum, value); maximum = max(maximum, value)
        }
    }
    val resolved = domain ?: minimum..(if (maximum == minimum) maximum + 1 else maximum)
    if (!resolved.start.isFinite() || !resolved.endInclusive.isFinite() || resolved.start >= resolved.endInclusive || resolved.start > minimum || resolved.endInclusive < maximum) return invalid
    return LumenComparisonModel(resolved, true)
}

@Composable
fun LumenLollipopChart(data: List<LumenComparisonDatum>, label: String, modifier: Modifier = Modifier, domain: ClosedFloatingPointRange<Double>? = null, heading: String? = null, description: String? = null, labels: LumenChartLabels = LumenChartLabels(), valueLabel: String = labels.value, showData: Boolean = true) {
    LumenComparisonChart(data, label, false, modifier, domain, heading, description, labels, "", valueLabel, showData)
}
@Composable
fun LumenDumbbellChart(data: List<LumenComparisonDatum>, label: String, modifier: Modifier = Modifier, domain: ClosedFloatingPointRange<Double>? = null, heading: String? = null, description: String? = null, labels: LumenChartLabels = LumenChartLabels(), referenceLabel: String = "Before", valueLabel: String = labels.value, showData: Boolean = true) {
    LumenComparisonChart(data, label, true, modifier, domain, heading, description, labels, referenceLabel, valueLabel, showData)
}
@Composable
private fun LumenComparisonChart(data: List<LumenComparisonDatum>, label: String, paired: Boolean, modifier: Modifier, domain: ClosedFloatingPointRange<Double>?, heading: String?, description: String?, labels: LumenChartLabels, referenceLabel: String, valueLabel: String, showData: Boolean) {
    val theme = LocalLumenTheme.current
    val model = lumenComparisonModel(data, paired, domain)
    fun format(value: Double?) = value?.let(labels.formatValue) ?: labels.notAvailable
    LumenChartFrame(label, if (model.valid) "${labels.count}: ${data.size}." else labels.invalidData, modifier, heading, description) {
        if (!model.valid || data.isEmpty()) Text(if (model.valid) labels.empty else labels.invalidData, color = theme.colors.inkSoft)
        else {
            Text(if (paired) "$referenceLabel → $valueLabel" else valueLabel, color = theme.colors.inkSoft, style = MaterialTheme.typography.labelSmall)
            data.forEachIndexed { index, row ->
                Column(verticalArrangement = Arrangement.spacedBy(LumenSpacing.Xs)) {
                    FlowRow(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text(row.label, color = theme.colors.ink, style = MaterialTheme.typography.bodyMedium)
                        Text((if (paired) "${format(row.reference)} → " else "") + format(row.value), color = theme.colors.ink, style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.Medium)
                    }
                    val color = theme.chartColor(row.tone ?: listOf(LumenChartTone.Series1, LumenChartTone.Series2, LumenChartTone.Series3, LumenChartTone.Series4, LumenChartTone.Series5, LumenChartTone.Series6, LumenChartTone.Series7, LumenChartTone.Series8)[index % 8])
                    Canvas(Modifier.fillMaxWidth().height(24.dp).clearAndSetSemantics {}) {
                        val inset = 8.dp.toPx()
                        val width = max(0f, size.width - inset * 2)
                        val center = size.height / 2
                        val value = row.value?.let { inset + model.position(it) * width }
                        val reference = (if (paired) row.reference else 0.0)?.let { inset + model.position(it) * width }
                        drawRect(theme.colors.line, Offset(inset, center), Size(width, 1.dp.toPx()))
                        if (value != null && reference != null) drawRect(color.copy(alpha = 0.5f), Offset(min(value, reference), center - 2.dp.toPx()), Size(abs(value - reference), 4.dp.toPx()))
                        if (paired && reference != null) {
                            drawCircle(theme.colors.surface, 5.dp.toPx(), Offset(reference, center))
                            drawCircle(color, 5.dp.toPx(), Offset(reference, center), style = Stroke(2.dp.toPx()))
                        }
                        if (value != null) {
                            drawCircle(color, 7.dp.toPx(), Offset(value, center))
                            drawCircle(theme.colors.surface, 7.dp.toPx(), Offset(value, center), style = Stroke(2.dp.toPx()))
                        }
                    }
                }
            }
            Row(Modifier.fillMaxWidth()) {
                model.ticks.forEachIndexed { index, tick -> Text(labels.formatValue(tick), Modifier.weight(1f), color = theme.colors.inkSoft, style = MaterialTheme.typography.labelSmall, textAlign = when(index) { 0 -> TextAlign.Start; 2 -> TextAlign.End; else -> TextAlign.Center }) }
            }
            if (showData) LumenStructuredChartDataList(data.map { row -> LumenStructuredChartDataRow(row.id, "${row.label}. " + (if (paired) "$referenceLabel: ${format(row.reference)}. " else "") + "$valueLabel: ${format(row.value)}.") }, labels)
        }
    }
}
