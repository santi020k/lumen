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

    @Test
    fun iconMetricsStayConsistentAndAccessible() {
        assertEquals(LumenIconSize.Sm, LumenIconButtonMetrics.resolve(LumenControlSize.Sm).iconSize)
        assertEquals(44.dp, LumenIconButtonMetrics.resolve(LumenControlSize.Sm).touchTarget)
        assertEquals(44.dp, LumenIconButtonMetrics.resolve(LumenControlSize.Md).touchTarget)
        assertEquals(52.dp, LumenIconButtonMetrics.resolve(LumenControlSize.Lg).touchTarget)
    }

    @Test
    fun progressValuesAreFiniteAndClamped() {
        assertEquals(LumenProgressValue(100f, 100f), LumenProgressValue.resolve(120f, 100f))
        assertEquals(LumenProgressValue(100f, 0f), LumenProgressValue.resolve(-10f, 0f))
        assertEquals(LumenProgressValue(100f, 0f), LumenProgressValue.resolve(Float.NaN, Float.NaN))
    }

    @Test
    fun avatarDimensionsMatchTheSharedContract() {
        assertEquals(32.dp, LumenAvatarSize.Sm.dimension)
        assertEquals(40.dp, LumenAvatarSize.Md.dimension)
        assertEquals(56.dp, LumenAvatarSize.Lg.dimension)
    }

    @Test
    fun structuredComponentsUseSemanticToneColors() {
        assertEquals(LumenColors.Light.accent, lumenMetricColor(LumenColors.Light, LumenMetricTone.Accent))
        assertEquals(LumenColors.Dark.inkMuted, lumenMetricColor(LumenColors.Dark, LumenMetricTone.Neutral))
        assertEquals(
            LumenColors.Light.brand,
            lumenBannerPalette(LumenColors.Light, LumenBannerVariant.Default).accent
        )
        assertEquals(
            LumenColors.Dark.success,
            lumenBannerPalette(LumenColors.Dark, LumenBannerVariant.Success).accent
        )
    }

    @Test
    fun searchFieldOnlyClearsEditableQueries() {
        assertEquals(true, LumenSearchFieldState.resolve("lumen", true).showClearAction)
        assertEquals(false, LumenSearchFieldState.resolve("", true).showClearAction)
        assertEquals(false, LumenSearchFieldState.resolve("lumen", false).showClearAction)
    }

    @Test
    fun cardVariantsUseSemanticSurfaces() {
        assertEquals(
            LumenCardPalette(LumenColors.Light.surfaceMuted, LumenColors.Light.line),
            lumenCardPalette(LumenColors.Light, LumenCardVariant.Muted)
        )
        assertEquals(
            LumenColors.Dark.warning.copy(alpha = 0.24f),
            lumenCardPalette(LumenColors.Dark, LumenCardVariant.Warning).border
        )
    }
}
