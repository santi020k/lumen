package com.santi020k.lumen

import androidx.compose.ui.unit.dp
import org.junit.Assert.assertEquals
import org.junit.Test

class WearComponentsTest {
    @Test
    fun progressValuesClampAndRejectInvalidInput() {
        assertEquals(LumenWearProgressValue(10f, 10f), LumenWearProgressValue.resolve(12f, 10f))
        assertEquals(LumenWearProgressValue(10f, 0f), LumenWearProgressValue.resolve(-2f, 10f))
        assertEquals(
            LumenWearProgressValue(1f, 0f),
            LumenWearProgressValue.resolve(Float.NaN, Float.POSITIVE_INFINITY)
        )
    }

    @Test
    fun actionMetricsKeepRoundTargetsUsable() {
        assertEquals(LumenWearActionMetrics(48.dp, 2.dp), LumenWearActionMetrics.resolve(20.dp, 1.dp))
        assertEquals(LumenWearActionMetrics(120.dp, 4.dp), LumenWearActionMetrics.resolve(120.dp, 4.dp))
        assertEquals(
            LumenWearActionMetrics(120.dp, 4.dp),
            LumenWearActionMetrics.resolve(Float.POSITIVE_INFINITY.dp, Float.NaN.dp)
        )
    }

    @Test
    fun tonesUseCanonicalSemanticColors() {
        assertEquals(LumenColors.Light.brandSolid, lumenWearColor(LumenColors.Light, LumenWearTone.Brand))
        assertEquals(LumenColors.Dark.danger, lumenWearColor(LumenColors.Dark, LumenWearTone.Danger))
        assertEquals(LumenColors.Dark.inkMuted, lumenWearColor(LumenColors.Dark, LumenWearTone.Neutral))
    }
}
