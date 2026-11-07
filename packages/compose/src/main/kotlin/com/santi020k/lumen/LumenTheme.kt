package com.santi020k.lumen

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.ColorScheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Shapes
import androidx.compose.material3.Typography
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.Immutable
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp

enum class LumenSurfaceMaterial { Solid, Glass }

@Immutable
data class LumenAppearance(
    val radiusScale: Float = 1f,
    val spacingScale: Float = 1f,
    val borderWidth: Float = 1f,
    val elevationScale: Float = 1f,
    val material: LumenSurfaceMaterial = LumenSurfaceMaterial.Solid
) {
    init {
        require(listOf(radiusScale, spacingScale, borderWidth, elevationScale).all { it.isFinite() && it >= 0 })
    }
}

@Immutable
data class LumenThemeValues(
    val colors: LumenColorPalette,
    val isDark: Boolean,
    val chartColors: LumenChartColorPalette = if (isDark) LumenChartColors.Dark else LumenChartColors.Light,
    val appearance: LumenAppearance = LumenAppearance()
) {
    companion object {
        fun preset(preset: LumenThemePreset, isDark: Boolean): LumenThemeValues =
            LumenThemeValues(colors = preset.colors(isDark), isDark = isDark, appearance = preset.appearance)
    }
}

/** Small, medium and large corner radii in density-independent pixels. */
@Immutable
data class LumenThemeRadii(val sm: Float, val md: Float, val lg: Float) {
    init {
        require(listOf(sm, md, lg).all { it.isFinite() && it >= 0 })
    }
}

/** A portable pair of palettes plus the optional treatments applied by [LumenThemeScope]. */
@Immutable
data class LumenNamedTheme(
    val light: LumenColorPalette,
    val dark: LumenColorPalette,
    val radii: LumenThemeRadii? = null,
    val serifHeadings: Boolean = false,
    val inkActions: Boolean = false,
    val lightChartBrand: Color? = null,
    val darkChartBrand: Color? = null,
    val lightOnSuccess: Color? = null,
    val darkOnSuccess: Color? = null,
    val lightStatusText: Color? = null,
    val darkStatusText: Color? = null
) {
    internal fun values(isDark: Boolean): LumenThemeValues {
        val colors = if (isDark) dark else light
        val charts = if (isDark) LumenChartColors.Dark else LumenChartColors.Light
        val chartBrand = if (isDark) darkChartBrand else lightChartBrand
        return LumenThemeValues(
            colors = colors,
            isDark = isDark,
            chartColors = if (chartBrand == null) charts else charts.copy(
                series1 = chartBrand,
                series2 = colors.accent,
                divergingPositive = chartBrand,
                divergingMid = colors.surfaceStrong,
                sequentialHigh = colors.brandSolid,
                sequentialMid = chartBrand,
                sequentialLow = colors.brandSoft
            )
        )
    }
}

private val LocalLumenParentScheme = staticCompositionLocalOf<Boolean?> { null }
internal val LocalLumenNamedTheme = staticCompositionLocalOf<LumenNamedTheme?> { null }

@Composable
internal fun lumenStatusTextColor(fallback: Color): Color {
    val named = LocalLumenNamedTheme.current
    return (if (LocalLumenTheme.current.isDark) named?.darkStatusText else named?.lightStatusText) ?: fallback
}

internal fun LumenSurfaceRadius.inTheme(radii: LumenThemeRadii?, scale: Float): Dp = when {
    radii == null -> value * scale
    this == LumenSurfaceRadius.Sm -> radii.sm.dp * scale
    this == LumenSurfaceRadius.Md -> radii.md.dp * scale
    this == LumenSurfaceRadius.Lg -> radii.lg.dp * scale
    else -> value * scale
}

@Composable
internal fun LumenSurfaceRadius.scoped(scale: Float = 1f): Dp =
    inTheme(LocalLumenNamedTheme.current?.radii, scale)

@Immutable
data class LumenMaterialColorOverrides(
    val brand: Color? = null,
    val accent: Color? = null,
    val success: Color? = null,
    val warning: Color? = null
)

val LocalLumenTheme = staticCompositionLocalOf {
    LumenThemeValues(colors = LumenColors.Light, isDark = false)
}

fun ColorScheme.toLumenColorPalette(
    fallback: LumenColorPalette,
    overrides: LumenMaterialColorOverrides = LumenMaterialColorOverrides()
): LumenColorPalette = LumenColorPalette(
    canvas = background,
    surface = surface,
    surfaceMuted = surfaceVariant,
    surfaceStrong = surfaceContainerHigh,
    line = outline,
    ink = onBackground,
    inkSoft = onSurface,
    inkMuted = onSurfaceVariant,
    brand = overrides.brand ?: primary,
    brandSolid = overrides.brand ?: primary,
    brandSoft = primaryContainer,
    onBrand = onPrimary,
    accent = overrides.accent ?: secondary,
    success = overrides.success ?: fallback.success,
    warning = overrides.warning ?: fallback.warning,
    danger = error,
    onDanger = onError
)

fun LumenColorPalette.toMaterialColorScheme(isDark: Boolean): ColorScheme {
    return if (isDark) {
        darkColorScheme(
            primary = brand,
            onPrimary = onBrand,
            primaryContainer = brandSoft,
            onPrimaryContainer = ink,
            secondary = accent,
            secondaryContainer = brandSoft,
            onSecondaryContainer = brand,
            background = canvas,
            onBackground = ink,
            surface = surface,
            onSurface = ink,
            surfaceVariant = surfaceMuted,
            onSurfaceVariant = inkMuted,
            surfaceTint = brand,
            surfaceDim = surfaceMuted,
            surfaceBright = surface,
            surfaceContainerLowest = canvas,
            surfaceContainerLow = surface,
            surfaceContainer = surface,
            surfaceContainerHigh = surfaceStrong,
            surfaceContainerHighest = surfaceStrong,
            error = danger,
            onError = onDanger,
            outline = line
        )
    } else {
        lightColorScheme(
            primary = brand,
            onPrimary = onBrand,
            primaryContainer = brandSoft,
            onPrimaryContainer = ink,
            secondary = accent,
            secondaryContainer = brandSoft,
            onSecondaryContainer = brand,
            background = canvas,
            onBackground = ink,
            surface = surface,
            onSurface = ink,
            surfaceVariant = surfaceMuted,
            onSurfaceVariant = inkMuted,
            surfaceTint = brand,
            surfaceDim = surfaceMuted,
            surfaceBright = surface,
            surfaceContainerLowest = canvas,
            surfaceContainerLow = surface,
            surfaceContainer = surface,
            surfaceContainerHigh = surfaceStrong,
            surfaceContainerHighest = surfaceStrong,
            error = danger,
            onError = onDanger,
            outline = line
        )
    }
}

@Composable
fun LumenTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    values: LumenThemeValues? = null,
    materialColorScheme: ColorScheme? = null,
    materialColorOverrides: LumenMaterialColorOverrides = LumenMaterialColorOverrides(),
    typography: Typography = Typography(),
    shapes: Shapes = Shapes(),
    preset: LumenThemePreset = LumenThemePreset.Default,
    content: @Composable () -> Unit
) {
    LumenThemeScope(
        theme = null, darkTheme = darkTheme, values = values,
        materialColorScheme = materialColorScheme, materialColorOverrides = materialColorOverrides,
        typography = typography, shapes = shapes, preset = preset, content = content
    )
}

/** Applies a named theme to an application or subtree. A nested scope follows the parent scheme. */
@Composable
fun LumenThemeScope(
    theme: LumenNamedTheme?,
    darkTheme: Boolean? = null,
    values: LumenThemeValues? = null,
    materialColorScheme: ColorScheme? = null,
    materialColorOverrides: LumenMaterialColorOverrides = LumenMaterialColorOverrides(),
    typography: Typography = MaterialTheme.typography,
    shapes: Shapes = MaterialTheme.shapes,
    preset: LumenThemePreset = LumenThemePreset.Default,
    content: @Composable () -> Unit
) {
    val scheme = darkTheme ?: LocalLumenParentScheme.current ?: isSystemInDarkTheme()
    val defaultValues = theme?.values(scheme) ?: LumenThemeValues.preset(preset, scheme)
    val resolvedValues = values ?: materialColorScheme?.let { colorScheme ->
        defaultValues.copy(colors = colorScheme.toLumenColorPalette(defaultValues.colors, materialColorOverrides))
    } ?: defaultValues
    val resolvedColorScheme = materialColorScheme ?: resolvedValues.colors.run {
        val base = toMaterialColorScheme(resolvedValues.isDark)
        if (theme == null) base else base.copy(primary = brandSolid, onPrimary = onBrand)
    }

    CompositionLocalProvider(
        LocalLumenTheme provides resolvedValues,
        LocalLumenParentScheme provides resolvedValues.isDark,
        LocalLumenNamedTheme provides theme
    ) {
        MaterialTheme(
            colorScheme = resolvedColorScheme,
            typography = typography,
            shapes = shapes,
            content = content
        )
    }
}
