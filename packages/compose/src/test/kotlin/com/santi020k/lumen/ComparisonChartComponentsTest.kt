package com.santi020k.lumen

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class ComparisonChartComponentsTest {
    @Test fun keepsSignedAndMissingValuesOnOneScale() {
        val data = listOf(LumenComparisonDatum("a", "A", -10.0, 80.0), LumenComparisonDatum("b", "B", null))
        val model = lumenComparisonModel(data, true, null)
        assertTrue(model.valid)
        assertEquals(-10.0..80.0, model.domain)
        assertEquals(0f, model.position(-10.0), 0f)
        assertEquals(1f, model.position(80.0), 0f)
        assertEquals(-10.0..0.0, lumenComparisonModel(data, false, null).domain)
    }
    @Test fun rejectsInvalidInputAndKeepsExtremeFiniteValues() {
        val row = LumenComparisonDatum("a", "A", 20.0)
        assertFalse(lumenComparisonModel(listOf(row, row), true, null).valid)
        assertFalse(lumenComparisonModel(listOf(row), false, 1.0..20.0).valid)
        assertFalse(lumenComparisonModel(listOf(row.copy(label = " ")), false, null).valid)
        assertFalse(lumenComparisonModel(listOf(row.copy(value = Double.NaN)), false, null).valid)
        val model = lumenComparisonModel(listOf(row.copy(value = Double.MAX_VALUE, reference = -Double.MAX_VALUE)), true, null)
        assertTrue(model.valid)
        assertEquals(0.5f, model.position(0.0), 0f)
    }
}
