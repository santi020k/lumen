package com.santi020k.lumen

import org.junit.Assert.*
import org.junit.Test

class RatingParityTest {
    @Test fun zeroExactMaximumAndIntegerBounds() {
        for (maximum in listOf(Int.MIN_VALUE, 0, 1, 5, 10, 100, Int.MAX_VALUE)) {
            val model = LumenRatingModel(maximum)
            assertTrue(model.resolvedMaximum in 1..100)
            assertEquals(0, model.resolved(0)); assertEquals(0, model.resolved(Int.MIN_VALUE))
            assertEquals(model.resolvedMaximum, model.resolved(model.resolvedMaximum))
            assertEquals(model.resolvedMaximum, model.resolved(Int.MAX_VALUE))
        }
    }
}
