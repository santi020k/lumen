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
}
