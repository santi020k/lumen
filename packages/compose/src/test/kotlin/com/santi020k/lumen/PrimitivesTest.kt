package com.santi020k.lumen

import androidx.compose.ui.unit.dp
import org.junit.Assert.assertEquals
import org.junit.Test

class PrimitivesTest {
    @Test
    fun buttonMetricsPreserveNativeTouchTargets() {
        assertEquals(36.dp, LumenButtonMetrics.resolve(LumenControlSize.Sm).minHeight)
        assertEquals(44.dp, LumenButtonMetrics.resolve(LumenControlSize.Md).minHeight)
        assertEquals(52.dp, LumenButtonMetrics.resolve(LumenControlSize.Lg).minHeight)
    }
}
