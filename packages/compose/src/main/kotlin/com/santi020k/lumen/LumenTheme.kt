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

@Immutable
data class LumenThemeValues(
    val colors: LumenColorPalette,
    val isDark: Boolean
)

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
            background = canvas,
            onBackground = ink,
            surface = surface,
            onSurface = ink,
            surfaceVariant = surfaceMuted,
            onSurfaceVariant = inkMuted,
            surfaceContainerHigh = surfaceStrong,
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
            background = canvas,
            onBackground = ink,
            surface = surface,
            onSurface = ink,
            surfaceVariant = surfaceMuted,
            onSurfaceVariant = inkMuted,
            surfaceContainerHigh = surfaceStrong,
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
    content: @Composable () -> Unit
) {
    val defaultValues = if (darkTheme) {
        LumenThemeValues(colors = LumenColors.Dark, isDark = true)
    } else {
        LumenThemeValues(colors = LumenColors.Light, isDark = false)
    }
    val resolvedValues = values ?: materialColorScheme?.let { colorScheme ->
        LumenThemeValues(
            colors = colorScheme.toLumenColorPalette(defaultValues.colors, materialColorOverrides),
            isDark = darkTheme
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
