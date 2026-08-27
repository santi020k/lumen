package com.santi020k.lumen

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class ChartComponentsTest {
    @Test
    fun chartFoundationsMatchSharedLightAndDarkTokens() {
        assertEquals(LumenChartColors.Light.series1, LumenThemeValues(LumenColors.Light, false).chartColors.series1)
        assertEquals(LumenChartColors.Dark.series1, LumenThemeValues(LumenColors.Dark, true).chartColors.series1)
        assertTrue(LumenChartMetrics.SeriesStrokeWidth > LumenChartMetrics.GridStrokeWidth)
    }

    @Test
    fun chartSummariesReportAvailableAndMissingValues() {
        val summary = LumenChartSummary.resolve(
            listOf(
                LumenChartSeries(
                    id = "revenue",
                    label = "Revenue",
                    data = listOf(
                        LumenChartDatum("jan", LumenChartX.Category("January"), 10.0),
                        LumenChartDatum("feb", LumenChartX.Category("February"), null),
                        LumenChartDatum("mar", LumenChartX.Category("March"), 30.0)
                    )
                )
            )
        )

        assertEquals(2, summary.availablePointCount)
        assertEquals(1, summary.missingPointCount)
        assertEquals(10.0, summary.minimum)
        assertEquals(30.0, summary.maximum)
        assertTrue(summary.spokenDescription.contains("1 missing value"))
    }

    @Test
    fun chartSummariesTreatNonfiniteAndEmptyValuesAsMissing() {
        val summary = LumenChartSummary.resolve(
            listOf(
                LumenChartSeries(
                    id = "quality",
                    label = "Quality",
                    data = listOf(
                        LumenChartDatum("negative", LumenChartX.Number(-1.0), -8.0),
                        LumenChartDatum("nan", LumenChartX.Number(0.0), Double.NaN),
                        LumenChartDatum("infinite", LumenChartX.Number(1.0), Double.POSITIVE_INFINITY)
                    )
                )
            )
        )
        val empty = LumenChartSummary.resolve(emptyList())

        assertEquals(1, summary.availablePointCount)
        assertEquals(2, summary.missingPointCount)
        assertEquals(-8.0, summary.minimum)
        assertEquals(-8.0, summary.maximum)
        assertEquals("No chart data available.", empty.spokenDescription)
    }

    @Test
    fun chartCategoriesAndValuesAlignByIdentityInsteadOfSeriesPosition() {
        val january = LumenChartX.Category("January")
        val february = LumenChartX.Category("February")
        val revenue = LumenChartSeries(
            id = "revenue",
            label = "Revenue",
            data = listOf(
                LumenChartDatum("jan-revenue", january, 10.0),
                LumenChartDatum("feb-revenue", february, 20.0)
            ),
            mark = LumenComboMark.Bar
        )
        val margin = LumenChartSeries(
            id = "margin",
            label = "Margin",
            data = listOf(LumenChartDatum("feb-margin", february, 5.0)),
            mark = LumenComboMark.Bar
        )
        val categories = lumenChartCategories(listOf(revenue, margin))

        assertEquals(listOf(january, february), categories)
        assertEquals(null, lumenChartValue(margin, january))
        assertEquals(5.0, lumenChartValue(margin, february))
    }

    @Test
    fun lineAndRangeGeometrySplitAtMissingObservations() {
        val categories = listOf("Monday", "Tuesday", "Wednesday").map(LumenChartX::Category)
        val series = LumenChartSeries(
            id = "temperature",
            label = "Temperature",
            data = listOf(
                LumenChartDatum("mon", categories[0], 4.0),
                LumenChartDatum("tue", categories[1], null),
                LumenChartDatum("wed", categories[2], 8.0)
            )
        )
        val ranges = listOf(
            LumenRangeDatum("mon", categories[0], 2.0, 6.0),
            LumenRangeDatum("tue", categories[1], null, 7.0),
            LumenRangeDatum("wed", categories[2], 5.0, 10.0)
        )

        assertEquals(
            listOf(listOf(0), listOf(2)),
            lumenLineValueSegments(series, categories).map { segment ->
                segment.map(LumenIndexedChartValue::categoryIndex)
            }
        )
        assertEquals(
            listOf(listOf(0), listOf(2)),
            lumenRangeValueSegments(ranges).map { segment ->
                segment.map(LumenIndexedRangeValue::categoryIndex)
            }
        )
    }

    @Test
    fun heatmapsOmitUnavailableCellsAndComboPositionsUseBandCenters() {
        val heatmap = listOf(
            LumenHeatmapDatum("finite", "Mon", "AM", 8.0),
            LumenHeatmapDatum("missing", "Tue", "AM", null),
            LumenHeatmapDatum("infinite", "Wed", "AM", Double.POSITIVE_INFINITY)
        )

        assertEquals(listOf("finite"), lumenAvailableHeatmapData(heatmap).map(LumenHeatmapDatum::id))
        assertEquals("1 heatmap cell.", lumenHeatmapSummary(heatmap))
        assertEquals("No chart data available.", lumenHeatmapSummary(heatmap.drop(1)))
        assertEquals(1f / 6f, lumenChartCategoryPosition(0, 3, centerInBand = true))
        assertEquals(0.5f, lumenChartCategoryPosition(1, 3, centerInBand = true))
        assertEquals(5f / 6f, lumenChartCategoryPosition(2, 3, centerInBand = true))
    }

    @Test
    fun scatterDataLabelsExposeBubbleSize() {
        val series = LumenChartSeries(
            id = "quality",
            label = "Quality",
            data = emptyList()
        )
        val datum = LumenChartDatum("aug", LumenChartX.Number(1.0), 98.0, size = 64.0)

        assertEquals("1.0, Quality: 98.0, Size: 64.0", lumenChartDataLabel(series, datum, includeSize = true))
    }

    @Test
    fun scatterChartsExcludeInvalidPointsAndNegativeBubbleSizes() {
        val series = listOf(
            LumenChartSeries(
                id = "quality",
                label = "Quality",
                data = listOf(
                    LumenChartDatum("valid", LumenChartX.Number(0.0), 1.0, size = 1.0),
                    LumenChartDatum("invalid-x", LumenChartX.Number(Double.NaN), 1_000.0, size = 1_000.0),
                    LumenChartDatum("negative-size", LumenChartX.Number(1.0), 2.0, size = -1_000.0),
                    LumenChartDatum("large", LumenChartX.Number(2.0), 3.0, size = 2.0)
                )
            )
        )
        val available = lumenAvailableScatterSeries(series)

        assertEquals(listOf("valid", "negative-size", "large"), available.single().data.map(LumenChartDatum::id))
        assertEquals(listOf(1.0, 2.0), lumenScatterSizeValues(available))
        assertTrue(lumenScatterSummary(series).contains("Values range from 1.0 to 3.0"))
        assertTrue(
            lumenChartDataLabel(series.single(), series.single().data[2], includeSize = true)
                .endsWith("Size: Not available")
        )
    }

    @Test
    fun pieAndRangeSummariesCountOnlyAvailableMarks() {
        val pie = LumenChartSeries(
            id = "share",
            label = "Share",
            data = listOf(
                LumenChartDatum("positive", LumenChartX.Category("Positive"), 8.0),
                LumenChartDatum("zero", LumenChartX.Category("Zero"), 0.0),
                LumenChartDatum("negative", LumenChartX.Category("Negative"), -2.0)
            )
        )
        val ranges = listOf(
            LumenRangeDatum("available", LumenChartX.Category("Available"), 2.0, 8.0),
            LumenRangeDatum("missing", LumenChartX.Category("Missing"), null, 4.0)
        )

        assertEquals(listOf("positive"), lumenAvailablePieData(pie.data).map(LumenChartDatum::id))
        assertTrue(lumenPieSummary(pie).contains("1 point"))
        assertEquals("1 range.", lumenRangeSummary(ranges))
        assertEquals("No chart data available.", lumenRangeSummary(ranges.drop(1)))
        assertEquals(listOf(2.0, 8.0), lumenRangeDomainValues(ranges))
    }
}
