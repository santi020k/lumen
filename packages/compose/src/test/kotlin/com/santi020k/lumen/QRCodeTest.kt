package com.santi020k.lumen

import com.google.zxing.common.BitMatrix
import com.google.zxing.qrcode.decoder.Decoder
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class QRCodeTest {
    @Test fun deterministicFinderPatternsAndQuietZone() {
        val result = encodeLumenQRCode("HELLO WORLD") as LumenQRCodeResult.Ready
        assertEquals(result, encodeLumenQRCode("HELLO WORLD"))
        assertEquals(29, result.modules.size)
        assertTrue(result.modules.take(4).all { row -> row.none { it } })
        assertEquals(List(7) { true }, result.modules[4].subList(4, 11))
        assertEquals(listOf(true, false, false, false, false, false, true), result.modules[5].subList(4, 11))
    }
    @Test fun interoperableUtf8AtEveryCorrectionLevel() {
        val value = "https://lumen.santi020k.com/日本語?name=Molina🌞"
        for (correction in LumenQRCodeCorrection.entries) {
            val modules = (encodeLumenQRCode(value, correction) as LumenQRCodeResult.Ready).modules
            val side = modules.size - 8
            val bits = BitMatrix(side)
            for (y in 0 until side) for (x in 0 until side) if (modules[y + 4][x + 4]) bits.set(x, y)
            assertEquals(value, Decoder().decode(bits).text)
        }
    }
    @Test fun reactNativeMatrixInteroperatesWithIndependentDecoder() {
        val side = reactNativeQRFixture.size - 8
        val bits = BitMatrix(side)
        for (y in 0 until side) for (x in 0 until side) if (reactNativeQRFixture[y + 4][x + 4] == '1') bits.set(x, y)
        assertEquals("Molina 🌞 日本語", Decoder().decode(bits).text)
    }
    @Test fun invalidInputDoesNotProduceFakeMatrix() {
        assertTrue(encodeLumenQRCode("1".repeat(3000), LumenQRCodeCorrection.Low) is LumenQRCodeResult.Ready)
        assertEquals(LumenQRCodeResult.Error.Empty, encodeLumenQRCode(""))
        assertEquals(LumenQRCodeResult.Error.Options, encodeLumenQRCode("A", quietZone = 3))
        assertEquals(LumenQRCodeResult.Error.Capacity, encodeLumenQRCode("A".repeat(100000)))
        assertEquals(LumenQRCodeResult.Error.Capacity, encodeLumenQRCode("🌞".repeat(1000)))
    }
}
