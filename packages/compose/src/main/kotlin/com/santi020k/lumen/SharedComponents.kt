package com.santi020k.lumen

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.Immutable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.painter.Painter
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.semantics.ProgressBarRangeInfo
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.progressBarRangeInfo
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp

enum class LumenCardVariant {
    Accent,
    Default,
    Destructive,
    Muted,
    Success,
    Warning
}

@Immutable
data class LumenCardPalette(
    val background: Color,
    val border: Color
)

fun lumenCardPalette(colors: LumenColorPalette, variant: LumenCardVariant): LumenCardPalette {
    if (variant == LumenCardVariant.Default) return LumenCardPalette(colors.surface, colors.line)

    if (variant == LumenCardVariant.Muted) return LumenCardPalette(colors.surfaceMuted, colors.line)

    val accent = when (variant) {
        LumenCardVariant.Accent -> colors.accent
        LumenCardVariant.Destructive -> colors.danger
        LumenCardVariant.Success -> colors.success
        LumenCardVariant.Warning -> colors.warning
        LumenCardVariant.Default, LumenCardVariant.Muted -> colors.line
    }

    return LumenCardPalette(
        background = accent.copy(alpha = 0.06f),
        border = accent.copy(alpha = 0.24f)
    )
}

@Composable
fun LumenCard(
    modifier: Modifier = Modifier,
    variant: LumenCardVariant = LumenCardVariant.Default,
    onClick: (() -> Unit)? = null,
    enabled: Boolean = true,
    content: @Composable () -> Unit
) {
    val colors = LocalLumenTheme.current.colors
    val palette = lumenCardPalette(colors, variant)
    val interactionModifier = if (onClick == null) {
        Modifier
    } else {
        Modifier.clickable(enabled = enabled, role = Role.Button, onClick = onClick)
    }

    Surface(
        modifier = modifier.then(interactionModifier),
        color = palette.background,
        contentColor = colors.ink,
        shape = RoundedCornerShape(LumenRadius.Lg),
        border = androidx.compose.foundation.BorderStroke(1.dp, palette.border)
    ) {
        Box(modifier = Modifier.padding(LumenSpacing.Xl)) {
            content()
        }
    }
}

enum class LumenAlertVariant {
    Default,
    Destructive,
    Success,
    Warning
}

private data class LumenAlertPalette(
    val background: Color,
    val border: Color,
    val foreground: Color
)

private fun alertPalette(
    colors: LumenColorPalette,
    variant: LumenAlertVariant
): LumenAlertPalette = when (variant) {
    LumenAlertVariant.Default -> LumenAlertPalette(colors.surface, colors.line, colors.ink)
    LumenAlertVariant.Destructive -> LumenAlertPalette(
        colors.danger.copy(alpha = 0.08f),
        colors.danger.copy(alpha = 0.36f),
        colors.danger
    )
    LumenAlertVariant.Success -> LumenAlertPalette(
        colors.success.copy(alpha = 0.08f),
        colors.success.copy(alpha = 0.36f),
        colors.success
    )
    LumenAlertVariant.Warning -> LumenAlertPalette(
        colors.warning.copy(alpha = 0.10f),
        colors.warning.copy(alpha = 0.42f),
        colors.warning
    )
}

@Composable
fun LumenAlert(
    modifier: Modifier = Modifier,
    variant: LumenAlertVariant = LumenAlertVariant.Default,
    content: @Composable () -> Unit
) {
    val palette = alertPalette(LocalLumenTheme.current.colors, variant)

    Surface(
        modifier = modifier,
        color = palette.background,
        contentColor = palette.foreground,
        shape = RoundedCornerShape(LumenRadius.Md),
        border = androidx.compose.foundation.BorderStroke(1.dp, palette.border)
    ) {
        Box(
            modifier = Modifier.padding(horizontal = LumenSpacing.Lg, vertical = LumenSpacing.Md)
        ) {
            content()
        }
    }
}

@Immutable
data class LumenProgressValue(
    val max: Float,
    val value: Float
) {
    val fraction: Float get() = value / max

    companion object {
        fun resolve(value: Float, max: Float): LumenProgressValue {
            val safeMax = if (max.isFinite() && max > 0f) max else 100f
            val finiteValue = if (value.isFinite()) value else 0f

            return LumenProgressValue(
                max = safeMax,
                value = finiteValue.coerceIn(0f, safeMax)
            )
        }
    }
}

@Composable
fun LumenProgress(
    value: Float,
    modifier: Modifier = Modifier,
    max: Float = 100f,
    label: String? = null
) {
    val colors = LocalLumenTheme.current.colors
    val progress = LumenProgressValue.resolve(value, max)
    val semanticsModifier = Modifier.semantics {
        progressBarRangeInfo = ProgressBarRangeInfo(progress.value, 0f..progress.max)
        if (label != null) contentDescription = label
    }

    Box(
        modifier = modifier
            .then(semanticsModifier)
            .fillMaxWidth()
            .height(LumenSpacing.Sm)
            .clip(RoundedCornerShape(LumenRadius.Full))
            .background(colors.surfaceStrong)
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth(progress.fraction)
                .fillMaxHeight()
                .background(colors.brandSolid)
        )
    }
}

enum class LumenAvatarSize(val dimension: Dp) {
    Sm(32.dp),
    Md(40.dp),
    Lg(56.dp)
}

@Composable
fun LumenAvatar(
    modifier: Modifier = Modifier,
    painter: Painter? = null,
    fallback: String = "?",
    size: LumenAvatarSize = LumenAvatarSize.Md,
    label: String? = null
) {
    val colors = LocalLumenTheme.current.colors

    Box(
        modifier = modifier
            .size(size.dimension)
            .clip(CircleShape)
            .background(colors.surfaceMuted)
            .border(1.dp, colors.line, CircleShape)
            .clearAndSetSemantics {
                if (label != null) contentDescription = label
            },
        contentAlignment = Alignment.Center
    ) {
        if (painter == null) {
            Text(
                text = fallback,
                color = colors.ink,
                fontWeight = FontWeight.Bold
            )
        } else {
            Image(
                painter = painter,
                contentDescription = null,
                modifier = Modifier.fillMaxWidth().fillMaxHeight(),
                contentScale = ContentScale.Crop
            )
        }
    }
}
