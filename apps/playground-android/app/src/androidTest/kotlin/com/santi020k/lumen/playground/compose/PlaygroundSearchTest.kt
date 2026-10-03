package com.santi020k.lumen.playground.compose

import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class PlaygroundSearchTest {
    @Test
    fun acceptsComponentIdsAndPreservesExactCaptureFilters() {
        assertTrue(matchesComponentQuery("Date range field", "  DATE-range_field  "))
        assertTrue(matchesComponentQuery("Icon button", "IconButton"))
        assertTrue(matchesComponentQuery("Button group", "button"))
        assertFalse(matchesComponentQuery("Button group", "button", exact = true))
        assertTrue(matchesComponentQuery("Button", " BUTTON ", exact = true))
        assertTrue(matchesComponentQuery("Button", "  "))
        assertFalse(matchesComponentQuery("Button", "missing"))
    }
}
