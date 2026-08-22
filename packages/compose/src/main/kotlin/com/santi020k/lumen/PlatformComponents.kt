package com.santi020k.lumen

import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.SmallFloatingActionButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.Immutable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp

enum class LumenFloatingActionButtonIntent {
    Accent,
    Brand,
    Danger
}

enum class LumenFloatingActionButtonSize {
    Regular,
    Small
}

@Immutable
data class LumenFloatingActionButtonMetrics(
    val dimension: Dp,
    val iconSize: LumenIconSize
) {
    companion object {
        fun resolve(size: LumenFloatingActionButtonSize): LumenFloatingActionButtonMetrics = when (size) {
            LumenFloatingActionButtonSize.Regular -> LumenFloatingActionButtonMetrics(56.dp, LumenIconSize.Lg)
            LumenFloatingActionButtonSize.Small -> LumenFloatingActionButtonMetrics(40.dp, LumenIconSize.Md)
        }
    }
}

@Immutable
internal data class LumenFloatingActionButtonPalette(
    val background: Color,
    val foreground: Color
)

internal fun lumenFloatingActionButtonPalette(
    colors: LumenColorPalette,
    intent: LumenFloatingActionButtonIntent
): LumenFloatingActionButtonPalette = when (intent) {
    LumenFloatingActionButtonIntent.Accent -> LumenFloatingActionButtonPalette(
        background = colors.accent,
        foreground = colors.canvas
    )
    LumenFloatingActionButtonIntent.Brand -> LumenFloatingActionButtonPalette(
        background = colors.brandSolid,
        foreground = colors.onBrand
    )
    LumenFloatingActionButtonIntent.Danger -> LumenFloatingActionButtonPalette(
        background = colors.danger,
        foreground = colors.onDanger
    )
}

/**
 * A Material-native floating action button using Lumen semantic colors and icon sizing.
 * The content description is required because floating actions are icon-only.
 */
@Composable
fun LumenFloatingActionButton(
    imageVector: ImageVector,
    contentDescription: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    intent: LumenFloatingActionButtonIntent = LumenFloatingActionButtonIntent.Brand,
    size: LumenFloatingActionButtonSize = LumenFloatingActionButtonSize.Regular
) {
    val palette = lumenFloatingActionButtonPalette(LocalLumenTheme.current.colors, intent)
    val metrics = LumenFloatingActionButtonMetrics.resolve(size)
    val content: @Composable () -> Unit = {
        LumenIcon(
            imageVector = imageVector,
            contentDescription = contentDescription,
            size = metrics.iconSize,
            tint = palette.foreground
        )
    }

    when (size) {
        LumenFloatingActionButtonSize.Regular -> FloatingActionButton(
            onClick = onClick,
            modifier = modifier,
            shape = RoundedCornerShape(LumenRadius.Lg),
            containerColor = palette.background,
            contentColor = palette.foreground,
            content = content
        )
        LumenFloatingActionButtonSize.Small -> SmallFloatingActionButton(
            onClick = onClick,
            modifier = modifier,
            shape = RoundedCornerShape(LumenRadius.Md),
            containerColor = palette.background,
            contentColor = palette.foreground,
            content = content
        )
    }
}
