package com.santi020k.lumen

import org.junit.Assert.assertEquals
import org.junit.Assert.assertThrows
import org.junit.Test

class V4AdditionsTest {
    @Test fun rangeClampsSortsAndRecoversNonfiniteInput() {
        assertEquals(0f..100f, normalizeLumenRange(-20f..120f, 0f..100f))
        assertEquals(20f..80f, normalizeLumenRange(80f..20f, 0f..100f))
        assertEquals(0f..100f, normalizeLumenRange(Float.NaN..Float.POSITIVE_INFINITY, 0f..100f))
        assertEquals(30f..30f, normalizeLumenRange(30f..30f, 0f..100f))
    }
    @Test fun invalidBoundsAreRejected() {
        for (bounds in listOf(1f..1f, 2f..1f, Float.NaN..1f, 0f..Float.POSITIVE_INFINITY, -Float.MAX_VALUE..Float.MAX_VALUE)) {
            assertThrows(IllegalArgumentException::class.java) { normalizeLumenRange(0f..1f, bounds) }
        }
    }
    @Test fun multiSelectionPreservesOtherAndUnavailableValues() {
        val values = setOf("hidden", "first")
        assertEquals(setOf("hidden"), toggleLumenMultiSelection(values, "first"))
        assertEquals(setOf("hidden", "first", "next"), toggleLumenMultiSelection(values, "next"))
        assertEquals(setOf("hidden", "first"), values)
    }
    @Test fun optionIdentityMustBeUniqueAndReadable() {
        validateLumenMultiSelectOptions(emptyList())
        validateLumenMultiSelectOptions(listOf(LumenSelectionOption("one", "One")))
        assertThrows(IllegalArgumentException::class.java) {
            validateLumenMultiSelectOptions(listOf(LumenSelectionOption("one", "One"), LumenSelectionOption("one", "Duplicate")))
        }
        assertThrows(IllegalArgumentException::class.java) {
            validateLumenMultiSelectOptions(listOf(LumenSelectionOption("", "Empty")))
        }
        assertThrows(IllegalArgumentException::class.java) { LumenSwipeAction(" ", {}) }
    }
}
