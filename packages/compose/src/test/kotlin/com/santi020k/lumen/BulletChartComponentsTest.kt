package com.santi020k.lumen

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class BulletChartComponentsTest {
    @Test fun rangesAreOrderedAndSignedValuesKeepZero() {
        val ranges = listOf(LumenBulletRange(100.0, "Strong"), LumenBulletRange(60.0, "Developing"))
        val model = lumenBulletModel(72.0, 85.0, ranges, null)
        assertTrue(model.valid)
        assertEquals(0.0..100.0, model.domain)
        assertEquals(listOf(0.0, 60.0), model.ranges.map { it.start })
        assertEquals(0.72f, model.position(72.0), 0f)
        assertEquals(100.0, ranges.first().end, 0.0)
        val signed = lumenBulletModel(-20.0, 40.0, emptyList(), -40.0..60.0)
        assertTrue(signed.valid)
        assertEquals(0.2f, signed.position(-20.0), 0f)
        assertEquals(0.4f, signed.position(0.0), 0f)
    }

    @Test fun rejectsInvalidValuesAmbiguousRangesAndTruncatedBaselines() {
        val models = listOf(
            lumenBulletModel(Double.NaN, 80.0, emptyList(), null),
            lumenBulletModel(20.0, Double.POSITIVE_INFINITY, emptyList(), null),
            lumenBulletModel(120.0, 80.0, emptyList(), 0.0..100.0),
            lumenBulletModel(70.0, 80.0, emptyList(), 50.0..100.0),
            lumenBulletModel(70.0, 80.0, emptyList(), 100.0..0.0),
            lumenBulletModel(70.0, 80.0, listOf(LumenBulletRange(60.0, "A"), LumenBulletRange(60.0, "B")), null),
            lumenBulletModel(70.0, 80.0, listOf(LumenBulletRange(60.0, " ")), null)
        )
        models.forEach { assertFalse(it.valid); assertTrue(it.ranges.isEmpty()) }
    }

    @Test fun preservesMissingZeroAndExtremeDomains() {
        assertTrue(lumenBulletModel(null, 80.0, emptyList(), null).valid)
        assertEquals(0.0..1.0, lumenBulletModel(0.0, 0.0, emptyList(), null).domain)
        val model = lumenBulletModel(-Double.MAX_VALUE, Double.MAX_VALUE, emptyList(), null)
        assertTrue(model.valid)
        assertEquals(0.5f, model.position(0.0), 0f)
        assertTrue(model.ticks.all(Double::isFinite))
    }
}
