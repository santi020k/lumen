package com.santi020k.lumen

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.Immutable
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme

@Immutable
data class LumenThemeValues(
    val colors: LumenColorPalette,
    val isDark: Boolean
)

val LocalLumenTheme = staticCompositionLocalOf {
    LumenThemeValues(colors = LumenColors.Light, isDark = false)
}

@Composable
fun LumenTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val values = if (darkTheme) {
        LumenThemeValues(colors = LumenColors.Dark, isDark = true)
    } else {
        LumenThemeValues(colors = LumenColors.Light, isDark = false)
    }

    val colorScheme = if (darkTheme) {
        darkColorScheme(
            primary = values.colors.brand,
            onPrimary = values.colors.onBrand,
            secondary = values.colors.accent,
            background = values.colors.canvas,
            onBackground = values.colors.ink,
            surface = values.colors.surface,
            onSurface = values.colors.ink,
            error = values.colors.danger,
            onError = values.colors.onDanger,
            outline = values.colors.line
        )
    } else {
        lightColorScheme(
            primary = values.colors.brand,
            onPrimary = values.colors.onBrand,
            secondary = values.colors.accent,
            background = values.colors.canvas,
            onBackground = values.colors.ink,
            surface = values.colors.surface,
            onSurface = values.colors.ink,
            error = values.colors.danger,
            onError = values.colors.onDanger,
            outline = values.colors.line
        )
    }

    androidx.compose.runtime.CompositionLocalProvider(LocalLumenTheme provides values) {
        MaterialTheme(colorScheme = colorScheme, content = content)
    }
}
