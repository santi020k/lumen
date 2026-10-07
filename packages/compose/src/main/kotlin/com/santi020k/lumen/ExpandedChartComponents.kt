package com.santi020k.lumen

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.width
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.Immutable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.unit.dp
import androidx.compose.ui.text.drawText
import androidx.compose.ui.text.rememberTextMeasurer
import java.text.DateFormatSymbols
import java.text.DateFormat
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.GregorianCalendar
import java.util.Locale
import java.util.TimeZone
import kotlin.math.abs
import kotlin.math.max
import kotlin.math.min

@Immutable
data class LumenCalendarHeatmapDatum(val date: String, val value: Double?)
@Immutable
data class LumenFunnelDatum(val id: String, val label: String, val value: Double?, val tone: LumenChartTone? = null)
@Immutable
data class LumenBoxPlotDatum(val id: String, val label: String, val min: Double?, val q1: Double?, val median: Double?, val q3: Double?, val max: Double?, val outliers: List<Double> = emptyList(), val tone: LumenChartTone? = null)
@Immutable
data class LumenBoxPlotStatisticLabels(val min: String = "Lower whisker", val q1: String = "First quartile", val median: String = "Median", val q3: String = "Third quartile", val max: String = "Upper whisker", val outliers: String = "Outliers")
internal data class LumenCalendarCell(val date: String, val value: Double?, val week: Int, val day: Int)
internal data class LumenCalendarModel(val valid: Boolean, val cells: List<LumenCalendarCell>, val domain: ClosedFloatingPointRange<Double>, val weekCount: Int)
internal data class LumenExpandedDomain(val valid: Boolean, val domain: ClosedFloatingPointRange<Double>)

internal fun lumenExpandedDomain(values: List<Double>, domain: ClosedFloatingPointRange<Double>?): LumenExpandedDomain {
    val minimum = values.minOrNull() ?: 0.0
    val maximum = values.maxOrNull() ?: 1.0
    val offset = max(1.0, abs(minimum) * 0.01)
    val resolved = domain ?: if (minimum == maximum) max(-Double.MAX_VALUE, minimum - offset)..min(Double.MAX_VALUE, maximum + offset) else minimum..maximum
    return LumenExpandedDomain(resolved.start.isFinite() && resolved.endInclusive.isFinite() && resolved.start < resolved.endInclusive && (values.isEmpty() || resolved.start <= minimum && resolved.endInclusive >= maximum), resolved)
}

private fun lumenUtcDateFormat() = SimpleDateFormat("yyyy-MM-dd", Locale.ROOT).apply {
    calendar = GregorianCalendar(TimeZone.getTimeZone("UTC"), Locale.ROOT).apply { gregorianChange = Date(Long.MIN_VALUE); isLenient = false }
    isLenient = false
}
internal fun lumenParseCalendarDate(value: String): Long? {
    if (value.length != 10 || value[4] != '-' || value[7] != '-' || value.filterIndexed { index, _ -> index != 4 && index != 7 }.any { it !in '0'..'9' } || value.startsWith("0000")) return null
    val formatter = lumenUtcDateFormat()
    return try { formatter.parse(value)?.takeIf { formatter.format(it) == value }?.time } catch (_: java.text.ParseException) { null }
}
private fun lumenFormatCalendarDate(date: String): String {
    val epoch = lumenParseCalendarDate(date) ?: return date
    return DateFormat.getDateInstance(DateFormat.MEDIUM).apply {
        calendar = GregorianCalendar(TimeZone.getTimeZone("UTC")).apply { gregorianChange = Date(Long.MIN_VALUE) }
    }.format(Date(epoch))
}
internal fun lumenCalendarModel(data: List<LumenCalendarHeatmapDatum>, startDate: String, endDate: String, weekStartsOn: Int, domain: ClosedFloatingPointRange<Double>?): LumenCalendarModel {
    val invalid = LumenCalendarModel(false, emptyList(), 0.0..1.0, 0)
    val start = lumenParseCalendarDate(startDate) ?: return invalid
    val end = lumenParseCalendarDate(endDate) ?: return invalid
    val count = (end - start) / 86_400_000 + 1
    if (end < start || count !in 1..3660 || weekStartsOn !in 0..1) return invalid
    val seen = mutableSetOf<String>()
    for (row in data) {
        val date = lumenParseCalendarDate(row.date) ?: return invalid
        if (date !in start..end || !seen.add(row.date) || row.value?.isFinite() == false) return invalid
    }
    val scale = lumenExpandedDomain(data.mapNotNull { it.value }, domain)
    if (!scale.valid) return invalid
    val firstDay = GregorianCalendar(TimeZone.getTimeZone("UTC"), Locale.ROOT).apply { gregorianChange = Date(Long.MIN_VALUE); timeInMillis = start }.get(Calendar.DAY_OF_WEEK) - 1
    val offset = (firstDay - weekStartsOn + 7) % 7
    val values = data.associate { it.date to it.value }
    val formatter = lumenUtcDateFormat()
    val cells = (0 until count.toInt()).map { index ->
        val date = formatter.format(Date(start + index * 86_400_000L))
        LumenCalendarCell(date, values[date], (index + offset) / 7, (index + offset) % 7)
    }
    return LumenCalendarModel(true, cells, scale.domain, (count.toInt() + offset + 6) / 7)
}
internal fun lumenFunnelValid(data: List<LumenFunnelDatum>): Boolean {
    val ids = mutableSetOf<String>()
    return data.all { it.id.isNotBlank() && it.label.isNotBlank() && ids.add(it.id) && (it.value == null || it.value.isFinite() && it.value >= 0) }
}
internal fun lumenBoxPlotModel(data: List<LumenBoxPlotDatum>, domain: ClosedFloatingPointRange<Double>?): LumenExpandedDomain {
    val invalid = LumenExpandedDomain(false, 0.0..1.0)
    val ids = mutableSetOf<String>()
    val values = mutableListOf<Double>()
    for (row in data) {
        val stats = listOf(row.min, row.q1, row.median, row.q3, row.max)
        if (row.id.isBlank() || row.label.isBlank() || !ids.add(row.id) || row.outliers.any { !it.isFinite() }) return invalid
        if (stats.all { it == null }) { if (row.outliers.isNotEmpty()) return invalid; continue }
        if (stats.any { it == null || !it.isFinite() }) return invalid
        val finite = stats.filterNotNull()
        if (finite.zipWithNext().any { (left, right) -> left > right }) return invalid
        values += finite; values += row.outliers
    }
    return lumenExpandedDomain(values, domain)
}

@Composable
fun LumenCalendarHeatmap(data: List<LumenCalendarHeatmapDatum>, startDate: String, endDate: String, label: String, modifier: Modifier = Modifier, weekStartsOn: Int = 0, domain: ClosedFloatingPointRange<Double>? = null, heading: String? = null, description: String? = null, labels: LumenChartLabels = LumenChartLabels(), showData: Boolean = true, formatDate: (String) -> String = ::lumenFormatCalendarDate, weekdayLabels: List<String> = DateFormatSymbols.getInstance().shortWeekdays.drop(1)) {
    val theme = LocalLumenTheme.current
    val model = lumenCalendarModel(data, startDate, endDate, weekStartsOn, domain)
    val available = model.cells.count { it.value != null }
    val measurer = rememberTextMeasurer()
    val weekdayStyle = MaterialTheme.typography.labelSmall.copy(color = theme.colors.inkSoft)
    val days = (0..6).map { measurer.measure(weekdayLabels.getOrNull((it + weekStartsOn) % 7) ?: "", weekdayStyle) }
    val labelWidth = (days.maxOfOrNull { it.size.width } ?: 0)
    val labelWidthDp = with(LocalDensity.current) { labelWidth.toDp() }
    val cellSize = with(LocalDensity.current) { max(18.dp.toPx(), (days.maxOfOrNull { it.size.height } ?: 0) + 2.dp.toPx()) }
    val cellSizeDp = with(LocalDensity.current) { cellSize.toDp() }
    LumenChartFrame(label, if (model.valid) "${labels.count}: $available." else labels.invalidData, modifier, heading, description) {
        if (!model.valid) Text(labels.invalidData, color = theme.colors.inkSoft)
        else {
            if (available == 0) Text(labels.empty, color = theme.colors.inkSoft)
            Text("${formatDate(startDate)} – ${formatDate(endDate)}", color = theme.colors.inkSoft)
            Column(Modifier.horizontalScroll(rememberScrollState())) {
                Canvas(Modifier.width(cellSizeDp * model.weekCount + 8.dp + labelWidthDp).height(cellSizeDp * 7).clearAndSetSemantics {
                    if (!showData) contentDescription = model.cells.joinToString(" ") { "${formatDate(it.date)}: ${it.value?.let(labels.formatValue) ?: labels.notAvailable}." }
                }) {
                    days.forEachIndexed { day, text -> drawText(text, topLeft = Offset(0f, day * cellSize)) }
                    model.cells.forEach { cell ->
                        val origin = Offset(labelWidth + 8.dp.toPx() + cell.week * cellSize + 1.dp.toPx(), cell.day * cellSize + 1.dp.toPx())
                        val ratio = cell.value?.let { lumenChartRatio(it, model.domain) }
                        drawRect(if (ratio == null) theme.colors.surfaceMuted else theme.chartColors.sequentialHigh.copy(alpha = 0.2f + ratio * 0.8f), origin, Size(cellSize - 3.dp.toPx(), cellSize - 3.dp.toPx()))
                        drawRect(theme.colors.line, origin, Size(cellSize - 3.dp.toPx(), cellSize - 3.dp.toPx()), style = Stroke(1.dp.toPx()))
                        if (ratio == null) {
                            drawLine(theme.colors.inkSoft, origin + Offset(4.dp.toPx(), 4.dp.toPx()), origin + Offset(11.dp.toPx(), 11.dp.toPx()))
                            drawLine(theme.colors.inkSoft, origin + Offset(4.dp.toPx(), 11.dp.toPx()), origin + Offset(11.dp.toPx(), 4.dp.toPx()))
                        }
                    }
                }
            }
            Text("${labels.formatValue(model.domain.start)} – ${labels.formatValue(model.domain.endInclusive)} · × ${labels.notAvailable}", color = theme.colors.inkSoft)
            if (showData) LumenStructuredChartDataList(model.cells.map { LumenStructuredChartDataRow(it.date, "${formatDate(it.date)}: ${it.value?.let(labels.formatValue) ?: labels.notAvailable}") }, labels)
        }
    }
}

@Composable
fun LumenFunnelChart(data: List<LumenFunnelDatum>, label: String, modifier: Modifier = Modifier, heading: String? = null, description: String? = null, labels: LumenChartLabels = LumenChartLabels(), showData: Boolean = true) {
    val theme = LocalLumenTheme.current
    val valid = lumenFunnelValid(data)
    val maximum = data.mapNotNull { it.value }.maxOrNull() ?: 0.0
    LumenChartFrame(label, if (valid) "${labels.count}: ${data.size}." else labels.invalidData, modifier, heading, description) {
        if (!valid || data.isEmpty()) Text(if (valid) labels.empty else labels.invalidData, color = theme.colors.inkSoft)
        else {
            data.forEach { row ->
                Column(verticalArrangement = Arrangement.spacedBy(LumenSpacing.Xs)) {
                    Text("${row.label}: ${row.value?.let(labels.formatValue) ?: labels.notAvailable}", color = theme.colors.ink)
                    Canvas(Modifier.fillMaxWidth().height(28.dp).clearAndSetSemantics {}) {
                        drawRect(theme.colors.surfaceMuted)
                        row.value?.let { value ->
                            val width = size.width * (if (maximum == 0.0) 0f else (value / maximum).toFloat())
                            drawRect(theme.chartColor(row.tone ?: LumenChartTone.Series1), Offset((size.width - width) / 2, 0f), Size(width, size.height))
                        } ?: run {
                            drawLine(theme.colors.inkSoft, center - Offset(4.dp.toPx(), 4.dp.toPx()), center + Offset(4.dp.toPx(), 4.dp.toPx()))
                            drawLine(theme.colors.inkSoft, center + Offset(-4.dp.toPx(), 4.dp.toPx()), center + Offset(4.dp.toPx(), -4.dp.toPx()))
                        }
                    }
                }
            }
            if (showData) LumenStructuredChartDataList(data.map { LumenStructuredChartDataRow(it.id, "${it.label}: ${it.value?.let(labels.formatValue) ?: labels.notAvailable}") }, labels)
        }
    }
}

@Composable
fun LumenBoxPlot(data: List<LumenBoxPlotDatum>, label: String, modifier: Modifier = Modifier, domain: ClosedFloatingPointRange<Double>? = null, heading: String? = null, description: String? = null, labels: LumenChartLabels = LumenChartLabels(), statisticLabels: LumenBoxPlotStatisticLabels = LumenBoxPlotStatisticLabels(), showData: Boolean = true) {
    val theme = LocalLumenTheme.current
    val model = lumenBoxPlotModel(data, domain)
    fun format(value: Double?) = value?.let(labels.formatValue) ?: labels.notAvailable
    fun rowDescription(row: LumenBoxPlotDatum) = "${row.label}. ${statisticLabels.min}: ${format(row.min)}. ${statisticLabels.q1}: ${format(row.q1)}. ${statisticLabels.median}: ${format(row.median)}. ${statisticLabels.q3}: ${format(row.q3)}. ${statisticLabels.max}: ${format(row.max)}. ${statisticLabels.outliers}: ${row.outliers.joinToString(transform = labels.formatValue).ifEmpty { labels.notAvailable }}."
    LumenChartFrame(label, if (model.valid) "${labels.count}: ${data.size}." else labels.invalidData, modifier, heading, description) {
        if (!model.valid || data.isEmpty()) Text(if (model.valid) labels.empty else labels.invalidData, color = theme.colors.inkSoft)
        else {
            data.forEach { row ->
                Text("${row.label} · ${statisticLabels.median}: ${format(row.median)}", color = theme.colors.ink, style = MaterialTheme.typography.bodyMedium)
                Canvas(Modifier.fillMaxWidth().height(44.dp).clearAndSetSemantics { if (!showData) contentDescription = rowDescription(row) }) {
                    fun x(value: Double) = 8.dp.toPx() + lumenChartRatio(value, model.domain) * max(0f, size.width - 16.dp.toPx())
                    val color = theme.chartColor(row.tone ?: LumenChartTone.Series1)
                    val minimum = row.min; val q1 = row.q1; val median = row.median; val q3 = row.q3; val maximum = row.max
                    if (minimum != null && q1 != null && median != null && q3 != null && maximum != null) {
                        drawLine(color, Offset(x(minimum), center.y), Offset(x(maximum), center.y), 2.dp.toPx())
                        val box = Size(max(1.dp.toPx(), x(q3) - x(q1)), 24.dp.toPx())
                        val origin = Offset(x(q1), center.y - 12.dp.toPx())
                        drawRect(theme.colors.surface, origin, box)
                        drawRect(color, origin, box, style = Stroke(2.dp.toPx()))
                        listOf(minimum, maximum).forEach { drawLine(color, Offset(x(it), center.y - 7.dp.toPx()), Offset(x(it), center.y + 7.dp.toPx()), 2.dp.toPx()) }
                        drawLine(theme.colors.ink, Offset(x(median), center.y - 12.dp.toPx()), Offset(x(median), center.y + 12.dp.toPx()), 3.dp.toPx())
                        row.outliers.forEach { drawCircle(theme.colors.surface, 3.dp.toPx(), Offset(x(it), center.y)); drawCircle(color, 3.dp.toPx(), Offset(x(it), center.y), style = Stroke(1.5.dp.toPx())) }
                    } else {
                        drawLine(theme.colors.inkSoft, center - Offset(4.dp.toPx(), 4.dp.toPx()), center + Offset(4.dp.toPx(), 4.dp.toPx()))
                        drawLine(theme.colors.inkSoft, center + Offset(-4.dp.toPx(), 4.dp.toPx()), center + Offset(4.dp.toPx(), -4.dp.toPx()))
                    }
                }
            }
            Text("${labels.formatValue(model.domain.start)} – ${labels.formatValue(model.domain.endInclusive)}", color = theme.colors.inkSoft)
            if (showData) LumenStructuredChartDataList(data.map { row -> LumenStructuredChartDataRow(row.id, rowDescription(row)) }, labels)
        }
    }
}
