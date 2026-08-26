package com.santi020k.lumen

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.Immutable
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.selected
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import java.text.DateFormat
import java.util.Date
import kotlin.math.abs
import kotlin.math.max
import kotlin.math.min

sealed interface LumenChartX {
    val label: String

    @Immutable
    data class Category(val value: String) : LumenChartX {
        override val label: String = value
    }

    @Immutable
    data class Number(val value: Double) : LumenChartX {
        override val label: String = value.toString()
    }

    @Immutable
    data class Time(val epochMillis: Long) : LumenChartX {
        override val label: String = DateFormat.getDateInstance(DateFormat.MEDIUM).format(Date(epochMillis))
    }
}

enum class LumenChartTone {
    Accent,
    Brand,
    Danger,
    Neutral,
    Series1,
    Series2,
    Series3,
    Series4,
    Series5,
    Series6,
    Series7,
    Series8,
    Success,
    Warning
}

enum class LumenComboMark {
    Area,
    Bar,
    Line
}

@Immutable
data class LumenChartDatum(
    val id: String,
    val x: LumenChartX,
    val y: Double?,
    val label: String? = null,
    val size: Double? = null
)

@Immutable
data class LumenChartSeries(
    val id: String,
    val label: String,
    val data: List<LumenChartDatum>,
    val tone: LumenChartTone? = null,
    val mark: LumenComboMark = LumenComboMark.Line
)

@Immutable
data class LumenChartSelection(val seriesId: String, val x: LumenChartX)

@Immutable
data class LumenRangeDatum(
    val id: String,
    val x: LumenChartX,
    val low: Double?,
    val high: Double?,
    val label: String? = null
)

@Immutable
data class LumenHeatmapDatum(
    val id: String,
    val column: String,
    val row: String,
    val value: Double?,
    val label: String? = null
)

@Immutable
data class LumenChartSummary(
    val availablePointCount: Int,
    val maximum: Double?,
    val minimum: Double?,
    val missingPointCount: Int,
    val seriesCount: Int
) {
    val spokenDescription: String
        get() {
            val minimumValue = minimum ?: return "No chart data available."
            val maximumValue = maximum ?: return "No chart data available."
            val pointLabel = if (availablePointCount == 1) "point" else "points"
            val missing = when (missingPointCount) {
                0 -> ""
                1 -> " 1 missing value."
                else -> " $missingPointCount missing values."
            }

            return "$seriesCount series, $availablePointCount $pointLabel. " +
                "Values range from $minimumValue to $maximumValue.$missing"
        }

    companion object {
        fun resolve(series: List<LumenChartSeries>): LumenChartSummary {
            val values = series.flatMap { item ->
                item.data.mapNotNull { datum -> datum.y?.takeIf { value -> value.isFinite() } }
            }
            val pointCount = series.sumOf { it.data.size }

            return LumenChartSummary(
                availablePointCount = values.size,
                maximum = values.maxOrNull(),
                minimum = values.minOrNull(),
                missingPointCount = pointCount - values.size,
                seriesCount = series.size
            )
        }
    }
}

private data class LumenChartDomain(val minimum: Double, val maximum: Double)

internal data class LumenIndexedChartValue(val categoryIndex: Int, val value: Double)

internal data class LumenIndexedRangeValue(
    val categoryIndex: Int,
    val low: Double,
    val high: Double
)

internal fun lumenChartCategories(series: List<LumenChartSeries>): List<LumenChartX> = buildList {
    series.forEach { item ->
        item.data.forEach { datum ->
            if (datum.x !in this) add(datum.x)
        }
    }
}

internal fun lumenChartValue(series: LumenChartSeries, category: LumenChartX): Double? =
    series.data.firstOrNull { datum -> datum.x == category }?.y?.takeIf(Double::isFinite)

internal fun lumenLineValueSegments(
    series: LumenChartSeries,
    categories: List<LumenChartX>
): List<List<LumenIndexedChartValue>> {
    val segments = mutableListOf<List<LumenIndexedChartValue>>()
    var current = mutableListOf<LumenIndexedChartValue>()

    categories.forEachIndexed { categoryIndex, category ->
        val value = lumenChartValue(series, category)

        if (value == null) {
            if (current.isNotEmpty()) segments.add(current)
            current = mutableListOf()
        } else {
            current.add(LumenIndexedChartValue(categoryIndex, value))
        }
    }

    if (current.isNotEmpty()) segments.add(current)

    return segments
}

internal fun lumenRangeValueSegments(data: List<LumenRangeDatum>): List<List<LumenIndexedRangeValue>> {
    val segments = mutableListOf<List<LumenIndexedRangeValue>>()
    var current = mutableListOf<LumenIndexedRangeValue>()

    data.forEachIndexed { categoryIndex, datum ->
        val low = datum.low?.takeIf(Double::isFinite)
        val high = datum.high?.takeIf(Double::isFinite)

        if (low == null || high == null) {
            if (current.isNotEmpty()) segments.add(current)
            current = mutableListOf()
        } else {
            current.add(LumenIndexedRangeValue(categoryIndex, low, high))
        }
    }

    if (current.isNotEmpty()) segments.add(current)

    return segments
}

internal fun lumenAvailableHeatmapData(data: List<LumenHeatmapDatum>): List<LumenHeatmapDatum> =
    data.filter { datum -> datum.value?.isFinite() == true }

internal fun lumenChartCategoryPosition(
    categoryIndex: Int,
    categoryCount: Int,
    centerInBand: Boolean
): Float {
    if (categoryCount <= 0) return 0f
    if (centerInBand) return (categoryIndex + 0.5f) / categoryCount

    return categoryIndex.toFloat() / max(1, categoryCount - 1).toFloat()
}

private fun lumenChartDomain(values: List<Double?>, includeZero: Boolean = false): LumenChartDomain {
    val available = values.mapNotNull { it?.takeIf(Double::isFinite) }

    if (available.isEmpty()) return LumenChartDomain(0.0, 1.0)

    var minimum = available.min()
    var maximum = available.max()

    if (includeZero) {
        minimum = min(0.0, minimum)
        maximum = max(0.0, maximum)
    }

    if (minimum == maximum) {
        val offset = abs(minimum.takeUnless { it == 0.0 } ?: 1.0) * 0.1

        minimum -= offset
        maximum += offset
    }

    return LumenChartDomain(minimum, maximum)
}

private fun lumenChartScale(
    value: Double,
    domain: LumenChartDomain,
    start: Float,
    end: Float
): Float {
    val span = domain.maximum - domain.minimum

    if (!value.isFinite() || span == 0.0) return start

    return start + (((value - domain.minimum) / span) * (end - start)).toFloat()
}

private fun resolvedLumenChartTone(tone: LumenChartTone?, index: Int): LumenChartTone {
    if (tone != null) return tone

    val tones = listOf(
        LumenChartTone.Series1,
        LumenChartTone.Series2,
        LumenChartTone.Series3,
        LumenChartTone.Series4,
        LumenChartTone.Series5,
        LumenChartTone.Series6,
        LumenChartTone.Series7,
        LumenChartTone.Series8
    )

    return tones[index % tones.size]
}

private fun LumenThemeValues.chartColor(tone: LumenChartTone): Color = when (tone) {
    LumenChartTone.Accent -> colors.accent
    LumenChartTone.Brand -> colors.brand
    LumenChartTone.Danger -> colors.danger
    LumenChartTone.Neutral -> colors.inkMuted
    LumenChartTone.Series1 -> chartColors.series1
    LumenChartTone.Series2 -> chartColors.series2
    LumenChartTone.Series3 -> chartColors.series3
    LumenChartTone.Series4 -> chartColors.series4
    LumenChartTone.Series5 -> chartColors.series5
    LumenChartTone.Series6 -> chartColors.series6
    LumenChartTone.Series7 -> chartColors.series7
    LumenChartTone.Series8 -> chartColors.series8
    LumenChartTone.Success -> colors.success
    LumenChartTone.Warning -> colors.warning
}

@Composable
private fun LumenChartFrame(
    label: String,
    summary: String,
    modifier: Modifier,
    heading: String? = null,
    description: String? = null,
    content: @Composable () -> Unit
) {
    val theme = LocalLumenTheme.current

    LumenSurface(
        modifier = modifier,
        padding = LumenSurfacePadding.Lg,
        radius = LumenSurfaceRadius.Lg,
        tone = LumenSurfaceTone.Surface
    ) {
        Column(verticalArrangement = Arrangement.spacedBy(LumenSpacing.Md)) {
            if (heading != null) {
                Text(
                    text = heading,
                    color = theme.colors.ink,
                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
                )
            }

            if (description != null) {
                Text(
                    text = description,
                    color = theme.colors.inkMuted,
                    style = MaterialTheme.typography.bodyMedium
                )
            }

            Canvas(
                modifier = Modifier
                    .size(1.dp)
                    .clearAndSetSemantics { contentDescription = "$label. $summary" }
            ) {}

            content()
        }
    }
}

@Composable
private fun LumenChartDataList(
    series: List<LumenChartSeries>,
    selection: LumenChartSelection?,
    onSelectionChange: ((LumenChartSelection) -> Unit)?,
    includeSize: Boolean = false
) {
    val colors = LocalLumenTheme.current.colors

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .heightIn(max = 240.dp)
            .verticalScroll(rememberScrollState()),
        verticalArrangement = Arrangement.spacedBy(LumenSpacing.Xs)
    ) {
        Text("Chart data", color = colors.ink, fontWeight = FontWeight.Bold)

        for (item in series) {
            for (datum in item.data) {
                val label = lumenChartDataLabel(item, datum, includeSize)
                val next = LumenChartSelection(item.id, datum.x)

                if (onSelectionChange == null || datum.y?.isFinite() != true) {
                    Text(label, color = colors.inkSoft, style = MaterialTheme.typography.bodySmall)
                } else {
                    TextButton(
                        onClick = { onSelectionChange(next) },
                        modifier = Modifier
                            .fillMaxWidth()
                            .heightIn(min = 44.dp)
                            .semantics { selected = selection == next }
                    ) {
                        Text(label, modifier = Modifier.fillMaxWidth(), color = colors.inkSoft)
                    }
                }
            }
        }
    }
}

internal fun lumenChartDataLabel(
    series: LumenChartSeries,
    datum: LumenChartDatum,
    includeSize: Boolean = false
): String {
    val value = datum.y?.takeIf(Double::isFinite)?.toString() ?: "Not available"
    val base = "${datum.x.label}, ${series.label}: ${datum.label ?: value}"
    val size = datum.size?.takeIf(Double::isFinite)?.toString() ?: "Not available"

    return if (includeSize) "$base, Size: $size" else base
}

private data class LumenStructuredChartDataRow(val id: String, val label: String)

@Composable
private fun LumenStructuredChartDataList(rows: List<LumenStructuredChartDataRow>) {
    val colors = LocalLumenTheme.current.colors

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .heightIn(max = 240.dp)
            .verticalScroll(rememberScrollState()),
        verticalArrangement = Arrangement.spacedBy(LumenSpacing.Xs)
    ) {
        Text("Chart data", color = colors.ink, fontWeight = FontWeight.Bold)
        rows.forEach { row ->
            Text(
                row.label,
                color = colors.inkSoft,
                modifier = Modifier.semantics { contentDescription = row.label },
                style = MaterialTheme.typography.bodySmall
            )
        }
    }
}

private fun DrawScope.drawLumenChartGrid(domain: LumenChartDomain, padding: Float, color: Color) {
    repeat(5) { index ->
        val value = domain.minimum + (domain.maximum - domain.minimum) * index / 4
        val y = lumenChartScale(value, domain, size.height - padding, padding)

        drawLine(
            color = color.copy(alpha = LumenChartMetrics.GridOpacity),
            start = Offset(padding, y),
            end = Offset(size.width - padding, y),
            strokeWidth = LumenChartMetrics.GridStrokeWidth.toPx()
        )
    }
}

private fun DrawScope.drawLumenLineSeries(
    series: LumenChartSeries,
    domain: LumenChartDomain,
    color: Color,
    area: Boolean,
    padding: Float,
    categories: List<LumenChartX> = lumenChartCategories(listOf(series)),
    centerInBands: Boolean = false
) {
    val plotWidth = size.width - padding * 2

    lumenLineValueSegments(series, categories).forEach { segment ->
        val available = segment.map { point ->
            val x = padding + lumenChartCategoryPosition(
                point.categoryIndex,
                categories.size,
                centerInBands
            ) * plotWidth
            val y = lumenChartScale(point.value, domain, size.height - padding, padding)

            Offset(x, y)
        }
        val path = Path().apply {
            moveTo(available.first().x, available.first().y)
            available.drop(1).forEach { lineTo(it.x, it.y) }
        }

        if (area) {
            val areaPath = Path().apply {
                addPath(path)
                lineTo(available.last().x, size.height - padding)
                lineTo(available.first().x, size.height - padding)
                close()
            }

            drawPath(areaPath, color.copy(alpha = LumenChartMetrics.AreaOpacity))
        }

        drawPath(
            path,
            color,
            style = Stroke(
                width = LumenChartMetrics.SeriesStrokeWidth.toPx(),
                cap = StrokeCap.Round
            )
        )
    }
}

@Composable
fun LumenSparkline(
    values: List<Double>,
    label: String,
    modifier: Modifier = Modifier,
    tone: LumenChartTone = LumenChartTone.Series1,
    area: Boolean = false
) {
    val theme = LocalLumenTheme.current
    val series = LumenChartSeries(
        id = "sparkline",
        label = label,
        data = values.mapIndexed { index, value ->
            LumenChartDatum(index.toString(), LumenChartX.Number(index.toDouble()), value)
        },
        tone = tone
    )
    val domain = lumenChartDomain(values)

    Canvas(
        modifier = modifier
            .width(120.dp)
            .height(40.dp)
            .clearAndSetSemantics { contentDescription = label }
    ) {
        drawLumenLineSeries(series, domain, theme.chartColor(tone), area, 3.dp.toPx())
    }
}

@Composable
fun LumenLineChart(
    series: List<LumenChartSeries>,
    label: String,
    modifier: Modifier = Modifier,
    heading: String? = null,
    description: String? = null,
    summary: String = LumenChartSummary.resolve(series).spokenDescription,
    area: Boolean = false,
    showData: Boolean = true,
    selection: LumenChartSelection? = null,
    onSelectionChange: ((LumenChartSelection) -> Unit)? = null
) {
    val theme = LocalLumenTheme.current
    val domain = lumenChartDomain(series.flatMap { item -> item.data.map { it.y } })
    val categories = lumenChartCategories(series)

    LumenChartFrame(label, summary, modifier, heading, description) {
        Canvas(
            Modifier
                .fillMaxWidth()
                .height(240.dp)
                .clearAndSetSemantics { contentDescription = "$label. $summary" }
        ) {
            val padding = 20.dp.toPx()

            drawLumenChartGrid(domain, padding, theme.chartColors.grid)
            series.forEachIndexed { index, item ->
                drawLumenLineSeries(
                    item,
                    domain,
                    theme.chartColor(resolvedLumenChartTone(item.tone, index)),
                    area || item.mark == LumenComboMark.Area,
                    padding,
                    categories
                )
            }
        }

        if (showData) LumenChartDataList(series, selection, onSelectionChange, includeSize = true)
    }
}

enum class LumenBarChartLayout {
    Grouped,
    Stacked
}

private fun DrawScope.drawLumenBars(
    series: List<LumenChartSeries>,
    domain: LumenChartDomain,
    theme: LumenThemeValues,
    layout: LumenBarChartLayout,
    padding: Float,
    categories: List<LumenChartX> = lumenChartCategories(series)
) {
    val categoryCount = categories.size

    if (categoryCount == 0) return

    val plotWidth = size.width - padding * 2
    val categoryWidth = plotWidth / categoryCount
    val barWidth = categoryWidth * 0.72f / if (layout == LumenBarChartLayout.Grouped) max(1, series.size) else 1
    val baseline = lumenChartScale(0.0, domain, size.height - padding, padding)

    categories.forEachIndexed { categoryIndex, category ->
        var positive = 0.0
        var negative = 0.0

        series.forEachIndexed { seriesIndex, item ->
            val value = lumenChartValue(item, category) ?: return@forEachIndexed
            val startValue = if (layout == LumenBarChartLayout.Stacked) {
                if (value >= 0) positive else negative
            } else {
                0.0
            }
            val endValue = startValue + value
            val start = if (layout == LumenBarChartLayout.Stacked) {
                lumenChartScale(startValue, domain, size.height - padding, padding)
            } else {
                baseline
            }
            val end = lumenChartScale(endValue, domain, size.height - padding, padding)
            val categoryCenter = padding +
                lumenChartCategoryPosition(categoryIndex, categoryCount, centerInBand = true) * plotWidth
            val categoryStart = categoryCenter - categoryWidth / 2
            val x = categoryStart + categoryWidth * 0.14f +
                if (layout == LumenBarChartLayout.Grouped) seriesIndex * barWidth else 0f

            drawRect(
                color = theme.chartColor(resolvedLumenChartTone(item.tone, seriesIndex)),
                topLeft = Offset(x, min(start, end)),
                size = Size(barWidth, abs(end - start))
            )

            if (layout == LumenBarChartLayout.Stacked) {
                if (value >= 0) positive += value else negative += value
            }
        }
    }
}

@Composable
fun LumenBarChart(
    series: List<LumenChartSeries>,
    label: String,
    modifier: Modifier = Modifier,
    layout: LumenBarChartLayout = LumenBarChartLayout.Grouped,
    summary: String = LumenChartSummary.resolve(series).spokenDescription,
    showData: Boolean = true,
    selection: LumenChartSelection? = null,
    onSelectionChange: ((LumenChartSelection) -> Unit)? = null
) {
    val theme = LocalLumenTheme.current
    val values = series.flatMap { item -> item.data.map { it.y } }
    val domain = lumenChartDomain(values, includeZero = true)

    LumenChartFrame(label, summary, modifier) {
        Canvas(
            Modifier
                .fillMaxWidth()
                .height(240.dp)
                .clearAndSetSemantics { contentDescription = "$label. $summary" }
        ) {
            val padding = 20.dp.toPx()

            drawLumenChartGrid(domain, padding, theme.chartColors.grid)
            drawLumenBars(series, domain, theme, layout, padding)
        }

        if (showData) LumenChartDataList(series, selection, onSelectionChange)
    }
}

enum class LumenPieChartVariant {
    Donut,
    Pie
}

@Composable
fun LumenPieChart(
    series: LumenChartSeries,
    label: String,
    modifier: Modifier = Modifier,
    variant: LumenPieChartVariant = LumenPieChartVariant.Donut,
    summary: String = LumenChartSummary.resolve(listOf(series)).spokenDescription,
    showData: Boolean = true,
    selection: LumenChartSelection? = null,
    onSelectionChange: ((LumenChartSelection) -> Unit)? = null
) {
    val theme = LocalLumenTheme.current
    val available = series.data.mapNotNull { datum ->
        val value = datum.y?.takeIf { it.isFinite() && it > 0 } ?: return@mapNotNull null

        datum to value
    }
    val total = available.sumOf { it.second }

    LumenChartFrame(label, summary, modifier) {
        Canvas(
            Modifier
                .fillMaxWidth()
                .height(240.dp)
                .clearAndSetSemantics { contentDescription = "$label. $summary" }
        ) {
            var startAngle = -90f
            val strokeWidth = min(size.width, size.height) * 0.21f
            val inset = if (variant == LumenPieChartVariant.Donut) strokeWidth / 2 else 0f
            val chartSize = Size(size.width - inset * 2, size.height - inset * 2)

            available.forEachIndexed { index, (datum, value) ->
                val sweep = if (total == 0.0) 0f else (value / total * 360).toFloat()
                val color = theme.chartColor(resolvedLumenChartTone(series.tone, index))

                if (variant == LumenPieChartVariant.Donut) {
                    drawArc(
                        color = color,
                        startAngle = startAngle,
                        sweepAngle = sweep,
                        useCenter = false,
                        topLeft = Offset(inset, inset),
                        size = chartSize,
                        style = Stroke(width = strokeWidth)
                    )
                } else {
                    drawArc(
                        color = color,
                        startAngle = startAngle,
                        sweepAngle = sweep,
                        useCenter = true,
                        size = size
                    )
                }

                startAngle += sweep
            }
        }

        if (showData) LumenChartDataList(listOf(series), selection, onSelectionChange)
    }
}

@Composable
fun LumenScatterChart(
    series: List<LumenChartSeries>,
    label: String,
    modifier: Modifier = Modifier,
    summary: String = LumenChartSummary.resolve(series).spokenDescription,
    showData: Boolean = true,
    selection: LumenChartSelection? = null,
    onSelectionChange: ((LumenChartSelection) -> Unit)? = null
) {
    val theme = LocalLumenTheme.current
    val points = series.flatMap { it.data }
    val xDomain = lumenChartDomain(points.map { (it.x as? LumenChartX.Number)?.value })
    val yDomain = lumenChartDomain(points.map { it.y })
    val sizeDomain = lumenChartDomain(points.map { it.size })

    LumenChartFrame(label, summary, modifier) {
        Canvas(Modifier.fillMaxWidth().height(240.dp)) {
            val padding = 20.dp.toPx()

            drawLumenChartGrid(yDomain, padding, theme.chartColors.grid)
            series.forEachIndexed { index, item ->
                item.data.forEach { datum ->
                    val x = (datum.x as? LumenChartX.Number)?.value ?: return@forEach
                    val y = datum.y?.takeIf(Double::isFinite) ?: return@forEach
                    val radius = datum.size?.takeIf(Double::isFinite)?.let {
                        lumenChartScale(it, sizeDomain, 4.dp.toPx(), 18.dp.toPx())
                    } ?: 4.dp.toPx()

                    drawCircle(
                        color = theme.chartColor(resolvedLumenChartTone(item.tone, index)),
                        radius = radius,
                        center = Offset(
                            lumenChartScale(x, xDomain, padding, size.width - padding),
                            lumenChartScale(y, yDomain, size.height - padding, padding)
                        )
                    )
                }
            }
        }

        if (showData) LumenChartDataList(series, selection, onSelectionChange)
    }
}

@Composable
fun LumenRangeChart(
    data: List<LumenRangeDatum>,
    label: String,
    modifier: Modifier = Modifier,
    summary: String = "${data.size} ranges.",
    tone: LumenChartTone = LumenChartTone.Series1,
    showData: Boolean = true
) {
    val theme = LocalLumenTheme.current
    val domain = lumenChartDomain(data.flatMap { listOf(it.low, it.high) })

    LumenChartFrame(label, summary, modifier) {
        Canvas(Modifier.fillMaxWidth().height(240.dp)) {
            val padding = 20.dp.toPx()
            val denominator = max(1, data.lastIndex)
            lumenRangeValueSegments(data).forEach { segment ->
                val available = segment.map { point ->
                    val x = padding + point.categoryIndex.toFloat() / denominator.toFloat() *
                        (size.width - padding * 2)

                    Triple(
                        x,
                        lumenChartScale(point.low, domain, size.height - padding, padding),
                        lumenChartScale(point.high, domain, size.height - padding, padding)
                    )
                }
                val path = Path().apply {
                    moveTo(available.first().first, available.first().third)
                    available.drop(1).forEach { lineTo(it.first, it.third) }
                    available.reversed().forEach { lineTo(it.first, it.second) }
                    close()
                }

                drawPath(
                    path,
                    theme.chartColor(tone).copy(alpha = LumenChartMetrics.AreaOpacity)
                )
            }
        }

        if (showData) {
            LumenStructuredChartDataList(
                data.map { datum ->
                    val low = datum.low?.takeIf(Double::isFinite)?.toString() ?: "Not available"
                    val high = datum.high?.takeIf(Double::isFinite)?.toString() ?: "Not available"

                    LumenStructuredChartDataRow(
                        datum.id,
                        "${datum.label ?: datum.x.label}: $low to $high"
                    )
                }
            )
        }
    }
}

@Composable
fun LumenHeatmap(
    data: List<LumenHeatmapDatum>,
    label: String,
    modifier: Modifier = Modifier,
    summary: String = "${data.size} heatmap cells.",
    showData: Boolean = true
) {
    val theme = LocalLumenTheme.current
    val columns = data.map { it.column }.distinct()
    val rows = data.map { it.row }.distinct()
    val domain = lumenChartDomain(data.map { it.value })
    val availableData = lumenAvailableHeatmapData(data)

    LumenChartFrame(label, summary, modifier) {
        Canvas(Modifier.fillMaxWidth().height(240.dp)) {
            val cellWidth = size.width / max(1, columns.size)
            val cellHeight = size.height / max(1, rows.size)

            availableData.forEach { datum ->
                val column = columns.indexOf(datum.column)
                val row = rows.indexOf(datum.row)
                val ratio = datum.value?.let {
                    lumenChartScale(it, domain, 0.12f, 1f)
                } ?: return@forEach

                if (column >= 0 && row >= 0) {
                    drawRect(
                        color = theme.chartColors.sequentialHigh.copy(alpha = ratio),
                        topLeft = Offset(column * cellWidth + 1, row * cellHeight + 1),
                        size = Size(max(0f, cellWidth - 2), max(0f, cellHeight - 2))
                    )
                }
            }
        }


        if (showData) {
            LumenStructuredChartDataList(
                data.map { datum ->
                    val value = datum.value?.takeIf(Double::isFinite)?.toString() ?: "Not available"

                    LumenStructuredChartDataRow(
                        datum.id,
                        "${datum.label ?: "${datum.column}, ${datum.row}"}: $value"
                    )
                }
            )
        }
    }
}

@Composable
fun LumenComboChart(
    series: List<LumenChartSeries>,
    label: String,
    modifier: Modifier = Modifier,
    summary: String = LumenChartSummary.resolve(series).spokenDescription,
    showData: Boolean = true,
    selection: LumenChartSelection? = null,
    onSelectionChange: ((LumenChartSelection) -> Unit)? = null
) {
    val lineSeries = series.filter { it.mark != LumenComboMark.Bar }
    val barSeries = series.filter { it.mark == LumenComboMark.Bar }
    val theme = LocalLumenTheme.current
    val domain = lumenChartDomain(series.flatMap { item -> item.data.map { it.y } }, includeZero = true)
    val categories = lumenChartCategories(series)

    LumenChartFrame(label, summary, modifier) {
        Canvas(Modifier.fillMaxWidth().height(240.dp)) {
            val padding = 20.dp.toPx()

            drawLumenChartGrid(domain, padding, theme.chartColors.grid)
            drawLumenBars(barSeries, domain, theme, LumenBarChartLayout.Grouped, padding, categories)
            lineSeries.forEachIndexed { index, item ->
                drawLumenLineSeries(
                    item,
                    domain,
                    theme.chartColor(resolvedLumenChartTone(item.tone, index + barSeries.size)),
                    item.mark == LumenComboMark.Area,
                    padding,
                    categories,
                    centerInBands = barSeries.isNotEmpty()
                )
            }
        }


        if (showData) LumenChartDataList(series, selection, onSelectionChange)
    }
}
