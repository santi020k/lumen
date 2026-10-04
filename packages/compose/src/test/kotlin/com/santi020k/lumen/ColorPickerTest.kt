package com.santi020k.lumen

import org.junit.Assert.*
import org.junit.Test

class ColorPickerTest {
    @Test fun parsingAndOpacity() {
        listOf("#123" to "#112233ff", "#1234" to "#11223344", "#ABCDEF" to "#abcdefff",
            "#11223300" to "#11223300", "rgba(255, 128, 0, .5)" to "#ff800080").forEach { (input, expected) ->
            assertEquals(expected, parseLumenColor(input)?.let { formatLumenColor(it, true) })
        }
        assertNull(formatLumenColor(LumenRGBA(0, 0, 0, 0.0)))
    }
    @Test fun malformedAndBounds() {
        listOf("", "#12", "#gg0000", "red", "rgba(1,2,3,NaN)", "rgba(1.2,2,3,1)", "rgba(256,2,3,1)",
            "rgba(1,2,3,1e0)", "rgba(1,2,3,-1)", "rgba(1,2,3,2)", "#".repeat(1000000)).forEach { assertNull(parseLumenColor(it)) }
        assertNull(formatLumenColor(LumenRGBA(0, 0, 0, Double.NaN)))
        assertNull(lumenHSVAToRGBA(LumenHSVA(Double.POSITIVE_INFINITY, 1.0, 1.0)))
    }
    @Test fun roundTripAndLatentChannels() {
        for (r in listOf(0,51,128,255)) for (g in listOf(0,51,128,255)) for (b in listOf(0,51,128,255)) {
            val color = LumenRGBA(r, g, b, 0.0)
            assertEquals(color, lumenRGBAToHSVA(color)?.let(::lumenHSVAToRGBA))
        }
        val latent = LumenHSVA(240.0, 1.0, 0.0, 0.0)
        assertEquals(LumenRGBA(0, 0, 0, 0.0), lumenHSVAToRGBA(latent))
        assertEquals(LumenRGBA(0, 0, 255, 0.0), lumenHSVAToRGBA(latent.copy(value = 1.0)))
    }
}
