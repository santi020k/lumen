package com.santi020k.lumen

import java.math.BigDecimal
import java.util.Locale
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertThrows
import org.junit.Assert.assertTrue
import org.junit.Test

class AdvancedFormComponentsTest {
    @Test
    fun localTimesValidateEveryClockBoundary() {
        assertEquals(0, LumenTimeSelection(0, 0).minutesSinceMidnight)
        assertEquals(1439, LumenTimeSelection(23, 59).minutesSinceMidnight)
        listOf(-1 to 0, 24 to 0, 0 to -1, 0 to 60).forEach { (hour, minute) ->
            assertThrows(IllegalArgumentException::class.java) { LumenTimeSelection(hour, minute) }
        }
    }

    @Test
    fun timeBoundsAreInclusiveAndDoNotReinterpretOvernightRanges() {
        val start = LumenTimeSelection(8, 30)
        val end = LumenTimeSelection(17, 15)
        assertTrue(isLumenTimeInBounds(start, start, end))
        assertTrue(isLumenTimeInBounds(end, start, end))
        assertFalse(isLumenTimeInBounds(LumenTimeSelection(8, 29), start, end))
        assertFalse(isLumenTimeInBounds(LumenTimeSelection(17, 16), start, end))
        assertTrue(isLumenTimeInBounds(LumenTimeSelection(0, 0), null, null))
        assertEquals(start, clampLumenTime(LumenTimeSelection(0, 0), start, end))
        assertEquals(end, clampLumenTime(LumenTimeSelection(23, 59), start, end))
        assertThrows(IllegalArgumentException::class.java) { validateLumenTimeBounds(end, start) }
    }

    @Test
    fun timeDisplayRespectsTwelveAndTwentyFourHourFormats() {
        assertEquals("00:05", formatLumenTime(LumenTimeSelection(0, 5), true, Locale.US))
        assertEquals("12:05 AM", formatLumenTime(LumenTimeSelection(0, 5), false, Locale.US))
        assertEquals("1:45 PM", formatLumenTime(LumenTimeSelection(13, 45), false, Locale.US))
        assertEquals("13:45", formatLumenTime(LumenTimeSelection(13, 45), true, Locale.forLanguageTag("es-CO")))
    }

    @Test
    fun numberDraftsPreserveEmptySignAndTrailingDecimalStates() {
        assertEquals(LumenNumberDraft.Empty, parseLumenNumberDraft("", Locale.US))
        listOf("-", ".", "-.", "12.").forEach {
            assertEquals(LumenNumberDraft.Incomplete, parseLumenNumberDraft(it, Locale.US))
        }
        assertEquals(LumenNumberDraft.Incomplete, parseLumenNumberDraft("12,", Locale.GERMANY))
        assertEquals(LumenNumberDraft.Valid(BigDecimal("-0.25")), parseLumenNumberDraft("-.25", Locale.US))
    }

    @Test
    fun numericEntryUsesLocalDecimalSymbolsAndUnicodeDigits() {
        assertEquals(LumenNumberDraft.Valid(BigDecimal("1234.50")), parseLumenNumberDraft("1234,50", Locale.GERMANY))
        assertEquals(LumenNumberDraft.Valid(BigDecimal("1234.50")), parseLumenNumberDraft("١٢٣٤٫٥٠", Locale.forLanguageTag("ar-u-nu-arab")))
        assertEquals("1234,5", formatLumenNumber(BigDecimal("1234.5"), Locale.GERMANY))
        val arabic = Locale.forLanguageTag("ar")
        val displayed = formatLumenNumber(BigDecimal("1234.5"), arabic)
        assertEquals(LumenNumberDraft.Valid(BigDecimal("1234.5")), parseLumenNumberDraft(displayed, arabic))
        assertEquals(LumenNumberDraft.Valid(BigDecimal("-1234.5")), parseLumenNumberDraft(formatLumenNumber(BigDecimal("-1234.5"), arabic), arabic))
    }

    @Test
    fun numberParsingRejectsGroupingExponentAndPartialGarbage() {
        listOf("1,234", "1e10", "+1", "1.2.3", "--1", "12 kg", " 12", "NaN", "Infinity", "1_000").forEach {
            assertEquals(it, LumenNumberDraft.Invalid, parseLumenNumberDraft(it, Locale.US))
        }
        assertEquals(LumenNumberDraft.Invalid, parseLumenNumberDraft("1.234", Locale.GERMANY))
        assertEquals(LumenNumberDraft.Invalid, parseLumenNumberDraft("9".repeat(100_000), Locale.US))
        assertTrue(parseLumenNumberDraft("9".repeat(128), Locale.US) is LumenNumberDraft.Valid)
    }

    @Test
    fun stepperUsesExactArithmeticAndClampsBothBounds() {
        val min = BigDecimal.ZERO
        val max = BigDecimal.ONE
        val step = BigDecimal("0.1")
        val draft = LumenNumberDraft.Valid(BigDecimal("0.2"))
        assertEquals(BigDecimal("0.3"), stepLumenNumber(draft, 1, min, max, step))
        assertEquals(BigDecimal("0.1"), stepLumenNumber(draft, -1, min, max, step))
        assertEquals(0, requireNotNull(stepLumenNumber(LumenNumberDraft.Valid(max), 1, min, max, step)).compareTo(max))
        assertEquals(0, requireNotNull(stepLumenNumber(LumenNumberDraft.Valid(min), -1, min, max, step)).compareTo(min))
        assertEquals(BigDecimal("9007199254740993"), stepLumenNumber(
            LumenNumberDraft.Valid(BigDecimal("9007199254740992")), 1, null, null, BigDecimal.ONE
        ))
    }

    @Test
    fun steppingDoesNotDestroyUnfinishedOrInvalidInput() {
        listOf(LumenNumberDraft.Incomplete, LumenNumberDraft.Invalid).forEach {
            assertEquals(null, stepLumenNumber(it, 1, null, null, BigDecimal.ONE))
        }
        assertEquals(BigDecimal.ONE, stepLumenNumber(LumenNumberDraft.Empty, 1, null, null, BigDecimal.ONE))
        assertEquals(BigDecimal("6"), stepLumenNumber(LumenNumberDraft.Empty, 1, BigDecimal("5"), null, BigDecimal.ONE))
        assertEquals(null, stepLumenNumber(LumenNumberDraft.Valid(BigDecimal("9".repeat(128))), 1, null, null, BigDecimal.ONE))
    }

    @Test
    fun invalidNumericConfigurationFailsClearly() {
        listOf(BigDecimal.ZERO, BigDecimal("-0.1")).forEach {
            assertThrows(IllegalArgumentException::class.java) { validateLumenNumberBounds(null, null, it) }
        }
        assertThrows(IllegalArgumentException::class.java) { validateLumenNumberBounds(BigDecimal.TEN, BigDecimal.ONE, BigDecimal.ONE) }
        assertThrows(IllegalArgumentException::class.java) { validateLumenNumberBounds(null, null, BigDecimal("1E+100000")) }
        assertTrue(isLumenNumberInBounds(BigDecimal.ONE, BigDecimal.ONE, BigDecimal.ONE))
        assertFalse(isLumenNumberInBounds(BigDecimal("1.01"), null, BigDecimal.ONE))
    }
}
