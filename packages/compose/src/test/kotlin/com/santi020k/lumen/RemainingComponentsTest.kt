package com.santi020k.lumen

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class RemainingComponentsTest {
    @Test
    fun otpNormalizesLocalizedDigitsAndPastedSeparators() {
        assertEquals("123456", normalizeLumenOtp("١٢٣ ٤٥٦", 6))
        assertEquals("123456", normalizeLumenOtp("123-456", 6))
        assertEquals("", normalizeLumenOtp(" ", 6))
        assertEquals("12", normalizeLumenOtp("１２", 6))
    }

    @Test
    fun otpRejectsInvalidOversizedAndExcessDigitsWithoutTruncation() {
        assertNull(normalizeLumenOtp("1234567", 6))
        assertNull(normalizeLumenOtp("code 123456", 6))
        assertNull(normalizeLumenOtp("12.34", 6))
        assertNull(normalizeLumenOtp("9".repeat(100_000), 6))
    }

    @Test(expected = IllegalArgumentException::class)
    fun otpRejectsZeroLength() { normalizeLumenOtp("", 0) }

    @Test(expected = IllegalArgumentException::class)
    fun otpRejectsUnboundedLength() { normalizeLumenOtp("", 13) }

    @Test
    fun comparisonNormalizesBoundsAndNonfinitePositions() {
        assertEquals(0f, normalizeLumenComparisonValue(-1f))
        assertEquals(1f, normalizeLumenComparisonValue(2f))
        assertEquals(0.5f, normalizeLumenComparisonValue(Float.NaN))
        assertEquals(0.5f, normalizeLumenComparisonValue(Float.POSITIVE_INFINITY))
        assertEquals(0.25f, normalizeLumenComparisonValue(0.25f))
    }

    @Test
    fun comparisonRejectsPathologicalAspectRatios() {
        for (value in listOf(0f, -1f, Float.NaN, Float.MAX_VALUE, Float.MIN_VALUE)) {
            assertEquals(16f / 9f, normalizeLumenComparisonRatio(value))
        }
        assertEquals(1f, normalizeLumenComparisonRatio(1f))
    }
}
