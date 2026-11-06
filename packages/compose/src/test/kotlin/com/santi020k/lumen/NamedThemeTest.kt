package com.santi020k.lumen

import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import org.junit.Assert.assertEquals
import org.junit.Assert.assertThrows
import org.junit.Test

class NamedThemeTest {
    @Test
    fun customThemesOverrideOneRoleAndKeepTheirChartChoices() {
        val base = LumenNamedThemes.Santi020k
        val harbor = base.copy(light = base.light.copy(accent = Color.Blue))
        assertEquals(Color.Blue, harbor.values(false).colors.accent)
        assertEquals(Color.Blue, harbor.values(false).chartColors.series2)
        assertEquals(base.lightChartBrand, harbor.values(false).chartColors.series1)
        assertEquals(base.dark, harbor.values(true).colors)
        assertEquals(LumenChartColors.Light, LumenNamedThemes.Field.values(false).chartColors)
    }

    @Test
    fun namedSurfaceRadiiRetainExplicitSquareSurfaces() {
        val radii = LumenThemeRadii(3f, 5f, 7f)
        assertEquals(0.dp, LumenSurfaceRadius.None.inTheme(radii, 1f))
        assertEquals(10.dp, LumenSurfaceRadius.Md.inTheme(radii, 2f))
        assertThrows(IllegalArgumentException::class.java) { LumenThemeRadii(1f, Float.NaN, 2f) }
    }
}
