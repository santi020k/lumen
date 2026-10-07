package com.santi020k.lumen

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class ExpandedChartComponentsTest {
    @Test fun calendarKeepsUtcLeapDaysAndMissingDates() {
        val model = lumenCalendarModel(listOf(LumenCalendarHeatmapDatum("2024-02-29", 0.0)), "2024-02-28", "2024-03-01", 1, null)
        assertTrue(model.valid)
        assertEquals(listOf("2024-02-28", "2024-02-29", "2024-03-01"), model.cells.map { it.date })
        assertNull(model.cells.first().value)
        assertEquals(0.0, model.cells[1].value)
        assertEquals(2, model.cells.first().day)
        assertNull(lumenParseCalendarDate("2023-02-29"))
        assertNull(lumenParseCalendarDate("0000-01-01"))
        assertNotNull(lumenParseCalendarDate("1500-02-28"))
        assertNull(lumenParseCalendarDate("1500-02-29"))
    }
    @Test fun calendarRejectsDuplicateOutOfRangeAndTooLongRanges() {
        val row = LumenCalendarHeatmapDatum("2024-01-01", 1.0)
        assertFalse(lumenCalendarModel(listOf(row, row), row.date, row.date, 0, null).valid)
        assertFalse(lumenCalendarModel(listOf(row), "2024-02-01", "2024-02-02", 0, null).valid)
        assertFalse(lumenCalendarModel(listOf(row.copy(value = Double.NaN)), row.date, row.date, 0, null).valid)
        assertFalse(lumenCalendarModel(emptyList(), "2020-01-01", "2031-01-01", 0, null).valid)
        assertFalse(lumenCalendarModel(emptyList(), row.date, row.date, 2, null).valid)
    }
    @Test fun funnelPreservesZeroMissingAndOrderedStages() {
        val row = LumenFunnelDatum("a", "A", 0.0)
        assertTrue(lumenFunnelValid(listOf(row, row.copy(id = "b", value = null), row.copy(id = "c", value = 10.0))))
        assertFalse(lumenFunnelValid(listOf(row, row)))
        assertFalse(lumenFunnelValid(listOf(row.copy(value = -1.0))))
        assertFalse(lumenFunnelValid(listOf(row.copy(value = Double.POSITIVE_INFINITY))))
    }
    @Test fun boxesValidateOrderedStatisticsAndEncloseOutliers() {
        val row = LumenBoxPlotDatum("a", "A", -10.0, -2.0, 0.0, 4.0, 10.0, listOf(-20.0, 30.0))
        assertEquals(-20.0..30.0, lumenBoxPlotModel(listOf(row), null).domain)
        assertFalse(lumenBoxPlotModel(listOf(row.copy(q1 = 8.0)), null).valid)
        assertFalse(lumenBoxPlotModel(listOf(row.copy(median = null)), null).valid)
        assertFalse(lumenBoxPlotModel(listOf(row), -10.0..20.0).valid)
        val missing = LumenBoxPlotDatum("b", "B", null, null, null, null, null)
        assertTrue(lumenBoxPlotModel(listOf(missing), null).valid)
        assertFalse(lumenBoxPlotModel(listOf(missing.copy(outliers = listOf(1.0))), null).valid)
        assertFalse(lumenBoxPlotModel(listOf(row, row), null).valid)
    }
    @Test fun domainsKeepExtremeFiniteAndConstantValuesSafe() {
        val model = lumenExpandedDomain(listOf(-Double.MAX_VALUE, Double.MAX_VALUE), null)
        assertTrue(model.valid)
        assertEquals(0.5f, lumenChartRatio(0.0, model.domain), 0f)
        assertTrue(lumenExpandedDomain(listOf(Double.MAX_VALUE), null).valid)
        assertTrue(lumenExpandedDomain(listOf(0.0), null).valid)
    }
}
