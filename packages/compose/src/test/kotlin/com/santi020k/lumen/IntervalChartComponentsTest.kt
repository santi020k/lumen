package com.santi020k.lumen

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class IntervalChartComponentsTest {
    @Test fun waterfallKeepsSignedBalancesAndExplicitResets() {
        val model = lumenWaterfallModel(listOf(
            LumenWaterfallDatum("opening", "Balance", 100.0, LumenWaterfallKind.Total),
            LumenWaterfallDatum("income", "Income", 40.0),
            LumenWaterfallDatum("cost", "Costs", -180.0),
            LumenWaterfallDatum("closing", "Balance", -40.0, LumenWaterfallKind.Total)
        ))
        assertTrue(model.valid)
        assertEquals(listOf(0.0, 100.0, 140.0, 0.0), model.marks.map { it.start })
        assertEquals(listOf(100.0, 140.0, -40.0, -40.0), model.marks.map { it.end })
        assertEquals(listOf(LumenChartTone.Series1, LumenChartTone.Series2, LumenChartTone.Series3, LumenChartTone.Series1), model.marks.map { it.tone })
    }

    @Test fun waterfallRejectsInvalidStepsWithoutPartialBalances() {
        listOf(
            listOf(LumenWaterfallDatum("a", "A", Double.NaN)),
            listOf(LumenWaterfallDatum("a", "A", Double.MAX_VALUE), LumenWaterfallDatum("b", "B", Double.MAX_VALUE)),
            listOf(LumenWaterfallDatum("a", "A", 1.0), LumenWaterfallDatum("a", "A", 2.0))
        ).forEach {
            assertFalse(lumenWaterfallModel(it).valid)
            assertTrue(lumenWaterfallModel(it).marks.isEmpty())
        }
        assertTrue(lumenWaterfallModel(emptyList()).valid)
    }

    @Test fun histogramSortsBinsPreservesGapsAndRequiresDensityForUnequalWidths() {
        val bins = listOf(LumenHistogramBin(20.0, 40.0, 10.0), LumenHistogramBin(0.0, 10.0, 5.0))
        assertFalse(lumenHistogramModel(bins, LumenHistogramFrequency.Count, LumenChartTone.Series1, Double::toString).valid)
        val model = lumenHistogramModel(bins, LumenHistogramFrequency.Density, LumenChartTone.Series2) { "$it ms" }
        assertTrue(model.valid)
        assertEquals(listOf(0.0, 20.0), model.marks.map { it.start })
        assertEquals(listOf(0.5, 0.5), model.marks.map { it.value })
        assertEquals(listOf(5.0, 10.0), model.marks.map { it.count })
        assertEquals("0.0 ms–10.0 ms", model.marks.first().label)
        assertEquals(20.0, bins.first().start, 0.0)
    }

    @Test fun histogramRejectsInvalidRangesAndCounts() {
        listOf(
            listOf(LumenHistogramBin(0.0, 10.0, 2.0), LumenHistogramBin(5.0, 15.0, 3.0)),
            listOf(LumenHistogramBin(0.0, 0.0, 2.0)),
            listOf(LumenHistogramBin(10.0, 0.0, 2.0)),
            listOf(LumenHistogramBin(0.0, 10.0, -1.0)),
            listOf(LumenHistogramBin(0.0, 10.0, Double.POSITIVE_INFINITY)),
            listOf(LumenHistogramBin(0.0, Double.POSITIVE_INFINITY, 1.0))
        ).forEach {
            val model = lumenHistogramModel(it, LumenHistogramFrequency.Density, LumenChartTone.Series1, Double::toString)
            assertFalse(model.valid)
            assertTrue(model.marks.isEmpty())
        }
        val zero = lumenHistogramModel(listOf(LumenHistogramBin(0.0, 10.0, 0.0)), LumenHistogramFrequency.Count, LumenChartTone.Series1, Double::toString)
        assertTrue(zero.valid)
        assertEquals(0.0, zero.marks.first().value, 0.0)
    }
}
