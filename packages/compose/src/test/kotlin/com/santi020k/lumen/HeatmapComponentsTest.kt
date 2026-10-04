package com.santi020k.lumen

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class HeatmapComponentsTest {
    @Test fun preservesMissingZeroAndFirstCoordinate() {
        val model = lumenHeatmapModel(listOf(
            LumenHeatmapDatum("a", "Mon", "AM", null),
            LumenHeatmapDatum("b", "Tue", "AM", 0.0),
            LumenHeatmapDatum("duplicate", "Tue", "AM", 100.0),
            LumenHeatmapDatum("c", "Wed", "AM", -2.0)
        ), LumenHeatmapColorScale.Diverging, null, 0.0)
        assertEquals(listOf(null, 0.0, -2.0), model.cells.map { it.value })
        assertEquals(listOf("Mon", "Tue", "Wed"), model.columns)
        assertEquals(listOf("AM"), model.rows)
        assertEquals(-2.0..2.0, model.domain)
        assertEquals(0.5f, lumenChartRatio(0.0, model.domain), 0f)
        assertEquals(LumenChartColors.Light.divergingMid, lumenHeatmapColor(0.0, model, LumenHeatmapColorScale.Diverging, LumenChartColors.Light))
    }

    @Test fun honorsExplicitDomainAndRejectsInvalidDivergingExtent() {
        val data = listOf(LumenHeatmapDatum("a", "Mon", "AM", 6.0))
        val explicit = lumenHeatmapModel(data, LumenHeatmapColorScale.Diverging, -2.0..6.0, 0.0)
        assertEquals(-2.0..6.0, explicit.domain)
        assertEquals(0.25f, lumenChartRatio(explicit.midpoint, explicit.domain), 0f)
        val invalid = lumenHeatmapModel(data, LumenHeatmapColorScale.Diverging, 1.0..5.0, 0.0)
        assertEquals(-invalid.domain.start, invalid.domain.endInclusive, 0.0)
        assertEquals(0f, lumenChartRatio(-30.0, explicit.domain), 0f)
        assertEquals(1f, lumenChartRatio(30.0, explicit.domain), 0f)
    }

    @Test fun extremeAndConstantExtentsStayFinite() {
        val model = lumenHeatmapModel(listOf(LumenHeatmapDatum("a", "Mon", "AM", Double.MAX_VALUE)), LumenHeatmapColorScale.Diverging, null, 0.0)
        assertTrue(model.domain.start.isFinite())
        assertTrue(model.domain.endInclusive.isFinite())
        assertEquals(0.5f, lumenChartRatio(model.midpoint, model.domain), 0f)
        val missing = lumenHeatmapModel(emptyList(), LumenHeatmapColorScale.Sequential, null, Double.NaN)
        assertEquals(0.0..1.0, missing.domain)
        assertEquals(0.0, missing.midpoint, 0.0)
    }
}
