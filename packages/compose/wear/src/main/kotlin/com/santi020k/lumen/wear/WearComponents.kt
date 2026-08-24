package com.santi020k.lumen

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxScope
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicText
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.semantics.ProgressBarRangeInfo
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.disabled
import androidx.compose.ui.semantics.progressBarRangeInfo
import androidx.compose.ui.semantics.role
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

enum class LumenWearTone {
    Accent,
    Brand,
    Danger,
    Neutral,
    Success,
    Warning
}

data class LumenWearProgressValue(
    val maximum: Float,
    val value: Float
) {
    val fraction: Float
        get() = value / maximum

    companion object {
        fun resolve(value: Float, maximum: Float): LumenWearProgressValue {
            val safeMaximum = if (maximum.isFinite() && maximum > 0f) maximum else 1f
            val safeValue = if (value.isFinite()) value.coerceIn(0f, safeMaximum) else 0f
            return LumenWearProgressValue(maximum = safeMaximum, value = safeValue)
        }
    }
}

data class LumenWearActionMetrics(
    val dimension: Dp,
    val ringWidth: Dp
) {
    companion object {
        fun resolve(dimension: Dp, ringWidth: Dp): LumenWearActionMetrics {
            val safeDimension = if (dimension.value.isFinite()) {
                dimension.value.coerceIn(48f, 180f).dp
            } else {
                120.dp
            }
            val safeRingWidth = if (ringWidth.value.isFinite()) {
                ringWidth.value.coerceIn(2f, 12f).dp
            } else {
                4.dp
            }
            return LumenWearActionMetrics(safeDimension, safeRingWidth)
        }
    }
}

fun lumenWearColor(palette: LumenColorPalette, tone: LumenWearTone): Color = when (tone) {
    LumenWearTone.Accent -> palette.accent
    LumenWearTone.Brand -> palette.brandSolid
    LumenWearTone.Danger -> palette.danger
    LumenWearTone.Neutral -> palette.inkMuted
    LumenWearTone.Success -> palette.success
    LumenWearTone.Warning -> palette.warning
}

@Composable
fun LumenWearTheme(
    darkTheme: Boolean = true,
    values: LumenThemeValues? = null,
    content: @Composable () -> Unit
) {
    val resolvedValues = values ?: LumenThemeValues(
        colors = if (darkTheme) LumenColors.Dark else LumenColors.Light,
        isDark = darkTheme
    )
    CompositionLocalProvider(LocalLumenTheme provides resolvedValues, content = content)
}

@Composable
fun LumenWearActionButton(
    accessibilityLabel: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    tone: LumenWearTone = LumenWearTone.Brand,
    dimension: Dp = 120.dp,
    enabled: Boolean = true,
    content: @Composable BoxScope.() -> Unit
) {
    val colors = LocalLumenTheme.current.colors
    val metrics = LumenWearActionMetrics.resolve(dimension, 4.dp)
    val color = lumenWearColor(colors, tone)

    Box(
        modifier = modifier
            .size(metrics.dimension)
            .clip(CircleShape)
            .background(color)
            .alpha(if (enabled) 1f else 0.48f)
            .clickable(enabled = enabled, role = Role.Button, onClick = onClick)
            .semantics {
                role = Role.Button
                contentDescription = accessibilityLabel
                if (!enabled) disabled()
            },
        contentAlignment = Alignment.Center,
        content = content
    )
}

@Composable
fun LumenWearProgressRing(
    value: Float,
    modifier: Modifier = Modifier,
    maximum: Float = 1f,
    tone: LumenWearTone = LumenWearTone.Brand,
    lineWidth: Dp = 4.dp,
    content: @Composable BoxScope.() -> Unit
) {
    val colors = LocalLumenTheme.current.colors
    val progress = LumenWearProgressValue.resolve(value, maximum)
    val metrics = LumenWearActionMetrics.resolve(120.dp, lineWidth)

    Box(
        modifier = modifier.semantics {
            progressBarRangeInfo = ProgressBarRangeInfo(progress.value, 0f..progress.maximum)
        },
        contentAlignment = Alignment.Center
    ) {
        Canvas(modifier = Modifier.matchParentSize()) {
            val strokeWidth = metrics.ringWidth.toPx()
            val radius = (size.minDimension - strokeWidth) / 2
            drawCircle(
                color = colors.line.copy(alpha = 0.5f),
                radius = radius,
                style = Stroke(width = strokeWidth)
            )
            drawArc(
                color = lumenWearColor(colors, tone),
                startAngle = -90f,
                sweepAngle = 360f * progress.fraction,
                useCenter = false,
                topLeft = Offset(center.x - radius, center.y - radius),
                size = androidx.compose.ui.geometry.Size(radius * 2, radius * 2),
                style = Stroke(width = strokeWidth, cap = StrokeCap.Round)
            )
        }
        content()
    }
}

@Composable
fun LumenWearStatus(
    text: String,
    modifier: Modifier = Modifier,
    tone: LumenWearTone = LumenWearTone.Neutral,
    leading: (@Composable RowScope.() -> Unit)? = null
) {
    val colors = LocalLumenTheme.current.colors
    val color = lumenWearColor(colors, tone)
    Row(
        modifier = modifier
            .clip(CircleShape)
            .background(color.copy(alpha = 0.24f))
            .padding(horizontal = LumenSpacing.Sm, vertical = LumenSpacing.Xs),
        horizontalArrangement = Arrangement.spacedBy(LumenSpacing.Xs),
        verticalAlignment = Alignment.CenterVertically
    ) {
        leading?.invoke(this)
        BasicText(
            text = text,
            style = TextStyle(
                color = if (tone == LumenWearTone.Neutral) colors.inkSoft else color,
                fontSize = 12.sp,
                fontWeight = FontWeight.SemiBold
            )
        )
    }
}

@Composable
fun LumenWearMetric(
    label: String,
    value: String,
    modifier: Modifier = Modifier,
    detail: String? = null,
    tone: LumenWearTone = LumenWearTone.Neutral
) {
    val colors = LocalLumenTheme.current.colors
    Column(
        modifier = modifier
            .clip(RoundedCornerShape(LumenRadius.Md))
            .background(colors.surfaceMuted.copy(alpha = 0.84f))
            .padding(LumenSpacing.Sm),
        verticalArrangement = Arrangement.spacedBy(2.dp)
    ) {
        BasicText(label, style = TextStyle(color = colors.inkMuted, fontSize = 12.sp))
        BasicText(
            value,
            style = TextStyle(
                color = lumenWearColor(colors, tone),
                fontSize = 18.sp,
                fontWeight = FontWeight.Bold
            )
        )
        if (detail != null) {
            BasicText(detail, style = TextStyle(color = colors.inkSoft, fontSize = 12.sp))
        }
    }
}

@Composable
fun LumenWearListRow(
    modifier: Modifier = Modifier,
    leading: (@Composable RowScope.() -> Unit)? = null,
    trailing: (@Composable RowScope.() -> Unit)? = null,
    content: @Composable RowScope.() -> Unit
) {
    val colors = LocalLumenTheme.current.colors
    Row(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(LumenRadius.Md))
            .background(colors.surfaceMuted.copy(alpha = 0.84f))
            .padding(LumenSpacing.Sm),
        horizontalArrangement = Arrangement.spacedBy(LumenSpacing.Sm),
        verticalAlignment = Alignment.CenterVertically
    ) {
        leading?.invoke(this)
        content()
        trailing?.invoke(this)
    }
}
