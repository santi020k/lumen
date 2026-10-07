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
    val defaultValues = LumenThemeValues.preset(preset, darkTheme)
    val resolvedValues = values ?: materialColorScheme?.let { colorScheme ->
        LumenThemeValues(
            colors = colorScheme.toLumenColorPalette(defaultValues.colors, materialColorOverrides),
            isDark = darkTheme,
            appearance = defaultValues.appearance
        )
    } ?: defaultValues
    val resolvedColorScheme = materialColorScheme
        ?: resolvedValues.colors.toMaterialColorScheme(resolvedValues.isDark)

    CompositionLocalProvider(LocalLumenTheme provides resolvedValues) {
        MaterialTheme(
            colorScheme = resolvedColorScheme,
            typography = typography,
            shapes = shapes,
            content = content
        )
    }
}
