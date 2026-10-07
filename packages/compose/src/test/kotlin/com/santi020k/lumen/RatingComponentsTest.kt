package com.santi020k.lumen

import org.junit.Assert.assertEquals
import org.junit.Test

class RatingComponentsTest {
    @Test fun clampsLimitsAndValues() {
        assertEquals(1, LumenRatingModel(-1).resolvedMaximum)
        assertEquals(100, LumenRatingModel(Int.MAX_VALUE).resolvedMaximum)
        assertEquals(0, LumenRatingModel().resolved(-1))
        assertEquals(5, LumenRatingModel().resolved(8))
        assertEquals(3, LumenRatingModel().resolved(3))
    }
}
