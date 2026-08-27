package com.santi020k.lumen

import java.util.Locale
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class PhoneComponentsTest {
    private val colombia = requireNotNull(LumenPhoneCountries.forRegion("CO", Locale.US))

    @Test
    fun countryMetadataProvidesNameFlagAndCallingCode() {
        assertEquals("CO", colombia.regionCode)
        assertEquals("+57", colombia.callingCode)
        assertEquals("Colombia", colombia.displayName)
        assertEquals("🇨🇴", colombia.flag)
        assertTrue(LumenPhoneCountries.all(Locale.US).size > 200)
    }

    @Test
    fun validNationalNumberFormatsAndResolvesToE164() {
        val number = resolveLumenPhoneNumber(colombia, "6015550123", Locale.US)

        assertTrue(number.isValid)
        assertEquals("+576015550123", number.e164)
        assertEquals("601 5550123", number.nationalNumber)
    }

    @Test
    fun incompleteNumberRemainsEditableWithoutProducingE164() {
        val number = resolveLumenPhoneNumber(colombia, "60155", Locale.US)

        assertFalse(number.isValid)
        assertNull(number.e164)
        assertEquals("60155", number.nationalNumber.filter(Char::isDigit))
    }

    @Test
    fun pastedInternationalNumberSelectsItsActualCountry() {
        val number = resolveLumenPhoneNumber(colombia, "+1 212 555 0123", Locale.US)

        assertTrue(number.isValid)
        assertEquals("US", number.country.regionCode)
        assertEquals("+1", number.country.callingCode)
        assertEquals("+12125550123", number.e164)
        assertEquals("2125550123", number.nationalNumber.filter(Char::isDigit))
    }

    @Test
    fun restrictedInputPreservesItsConfiguredCountryAllowList() {
        val number = resolveLumenPhoneInputValue(
            countries = listOf(colombia),
            country = colombia,
            input = "+1 212 555 0123",
            locale = Locale.US
        )

        assertEquals("CO", number.country.regionCode)
        assertNull(number.e164)
        assertEquals("2125550123", number.nationalNumber.filter(Char::isDigit))
    }

    @Test
    fun controlledRestrictedInputDisplaysAnAllowedCountry() {
        val unitedStates = requireNotNull(LumenPhoneCountries.forRegion("US", Locale.US))
        val externalValue = resolveLumenPhoneNumber(unitedStates, "2125550123", Locale.US)
        val number = constrainLumenPhoneInputValue(listOf(colombia), externalValue, Locale.US)

        assertEquals("CO", number.country.regionCode)
        assertNull(number.e164)
        assertEquals("2125550123", number.nationalNumber.filter(Char::isDigit))
    }

    @Test
    fun unsupportedRegionDoesNotCreateCountryMetadata() {
        assertNull(LumenPhoneCountries.forRegion("ZZ", Locale.US))
    }
}
