// cspell:ignore drawscope
package com.santi020k.lumen

import androidx.compose.foundation.background
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxScope
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.RectangleShape
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.semantics.ProgressBarRangeInfo
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.progressBarRangeInfo
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import kotlin.math.cos
import kotlin.math.hypot
import kotlin.math.sin

enum class LumenSkeletonShape {
    Circle,
    Rectangle,
    Text
}

fun resolveLumenSkeletonHeight(height: Dp): Dp = if (height.value.isFinite() && height > 0.dp) {
    height
} else {
    16.dp
}

@Composable
fun LumenSkeleton(
    modifier: Modifier = Modifier,
    width: Dp? = null,
    height: Dp = 16.dp,
    shape: LumenSkeletonShape = LumenSkeletonShape.Text,
    label: String? = null
) {
    val colors = LocalLumenTheme.current.colors
    val safeHeight = resolveLumenSkeletonHeight(height)
    val shapeModifier = when {
        shape == LumenSkeletonShape.Circle -> Modifier.size(safeHeight).clip(CircleShape)
        width != null -> Modifier.width(width).height(safeHeight)
        else -> Modifier.fillMaxWidth().height(safeHeight)
    }
    val cornerShape = when (shape) {
        LumenSkeletonShape.Circle -> CircleShape
        LumenSkeletonShape.Rectangle -> RoundedCornerShape(LumenRadius.Md)
        LumenSkeletonShape.Text -> RoundedCornerShape(LumenRadius.Sm)
    }
    val semanticsModifier = if (label == null) {
        Modifier.clearAndSetSemantics {}
    } else {
        Modifier.semantics {
            contentDescription = label
            progressBarRangeInfo = ProgressBarRangeInfo.Indeterminate
        }
    }

    Box(
        modifier = modifier
            .then(shapeModifier)
            .then(semanticsModifier)
            .clip(cornerShape)
            .background(colors.surfaceStrong.copy(alpha = 0.72f))
    )
}

enum class LumenGraphicSize(val dimension: Dp) {
    Sm(160.dp),
    Md(240.dp),
    Lg(320.dp)
}

enum class LumenGraphicTone {
    Accent,
    Brand,
    Neutral
}

enum class LumenGraphicVariant {
    Glow,
    Grid,
    Orbit
}

@Composable
fun LumenGraphic(
    modifier: Modifier = Modifier,
    label: String? = null,
    size: LumenGraphicSize = LumenGraphicSize.Md,
    tone: LumenGraphicTone = LumenGraphicTone.Brand,
    variant: LumenGraphicVariant = LumenGraphicVariant.Orbit,
    content: @Composable BoxScope.() -> Unit
) {
    val colors = LocalLumenTheme.current.colors
    val color = when (tone) {
        LumenGraphicTone.Accent -> colors.accent
        LumenGraphicTone.Brand -> colors.brand
        LumenGraphicTone.Neutral -> colors.inkMuted
    }
    val semanticsModifier = Modifier.clearAndSetSemantics {
        if (label != null) {
            contentDescription = label
        }
    }

    Box(
        modifier = modifier
            .size(size.dimension)
            .then(semanticsModifier),
        contentAlignment = Alignment.Center
    ) {
        Canvas(modifier = Modifier.matchParentSize()) {
            when (variant) {
                LumenGraphicVariant.Glow -> drawCircle(
                    brush = Brush.radialGradient(
                        colors = listOf(color.copy(alpha = 0.3f), color.copy(alpha = 0f)),
                        center = center,
                        radius = this.size.minDimension * 0.42f
                    ),
                    radius = this.size.minDimension * 0.42f
                )
                LumenGraphicVariant.Grid -> {
                    for (index in 0..6) {
                        val position = this.size.minDimension * (0.12f + (index * 0.76f / 6))
                        drawLine(
                            color = color.copy(alpha = 0.18f),
                            start = Offset(position, this.size.height * 0.12f),
                            end = Offset(position, this.size.height * 0.88f),
                            strokeWidth = 1.dp.toPx()
                        )
                        drawLine(
                            color = color.copy(alpha = 0.18f),
                            start = Offset(this.size.width * 0.12f, position),
                            end = Offset(this.size.width * 0.88f, position),
                            strokeWidth = 1.dp.toPx()
                        )
                    }
                }
                LumenGraphicVariant.Orbit -> {
                    for (ratio in listOf(0.9f, 0.62f, 0.34f)) {
                        drawCircle(
                            color = color.copy(alpha = 0.24f),
                            radius = this.size.minDimension * ratio / 2,
                            style = Stroke(width = 1.dp.toPx())
                        )
                    }
                    drawLine(
                        color = color.copy(alpha = 0.18f),
                        start = Offset(this.size.width * 0.14f, center.y),
                        end = Offset(this.size.width * 0.86f, center.y),
                        strokeWidth = 1.dp.toPx()
                    )
                    drawLine(
                        color = color.copy(alpha = 0.18f),
                        start = Offset(center.x, this.size.height * 0.14f),
                        end = Offset(center.x, this.size.height * 0.86f),
                        strokeWidth = 1.dp.toPx()
                    )
                }
            }
        }
        content()
    }
}

enum class LumenBackdropIntensity(val opacity: Float) {
    Subtle(0.4f),
    Medium(0.68f),
    Strong(1f)
}

enum class LumenBackdropTone {
    Accent,
    Brand,
    Neutral
}

enum class LumenBackdropVariant {
    Aurora,
    Dots,
    Grid,
    Rays
}

@Composable
fun LumenBackdrop(
    modifier: Modifier = Modifier,
    intensity: LumenBackdropIntensity = LumenBackdropIntensity.Medium,
    tone: LumenBackdropTone = LumenBackdropTone.Brand,
    variant: LumenBackdropVariant = LumenBackdropVariant.Aurora,
    content: @Composable BoxScope.() -> Unit
) {
    val colors = LocalLumenTheme.current.colors
    val color = when (tone) {
        LumenBackdropTone.Accent -> colors.accent
        LumenBackdropTone.Brand -> colors.brand
        LumenBackdropTone.Neutral -> colors.inkMuted
    }
    val secondaryColor = if (tone == LumenBackdropTone.Neutral) colors.surfaceStrong else colors.accent

    Box(modifier = modifier.heightIn(min = 160.dp).clip(RectangleShape)) {
        Canvas(modifier = Modifier.matchParentSize()) {
            when (variant) {
                LumenBackdropVariant.Aurora -> {
                    drawCircle(
                        color = color.copy(alpha = 0.22f * intensity.opacity),
                        radius = size.width * 0.36f,
                        center = Offset(size.width * 0.12f, size.height * 0.04f)
                    )
                    drawCircle(
                        color = secondaryColor.copy(alpha = 0.18f * intensity.opacity),
                        radius = size.width * 0.31f,
                        center = Offset(size.width * 0.9f, size.height * 0.92f)
                    )
                }
                LumenBackdropVariant.Dots -> {
                    for (row in 0 until 6) {
                        for (column in 0 until 8) {
                            drawCircle(
                                color = color.copy(alpha = 0.28f * intensity.opacity),
                                radius = 1.5.dp.toPx(),
                                center = Offset(
                                    (column + 0.5f) * size.width / 8,
                                    (row + 0.5f) * size.height / 6
                                )
                            )
                        }
                    }
                }
                LumenBackdropVariant.Grid -> {
                    for (index in 0..6) {
                        val x = index * size.width / 6
                        val y = index * size.height / 6
                        val lineColor = color.copy(alpha = 0.18f * intensity.opacity)
                        drawLine(lineColor, Offset(x, 0f), Offset(x, size.height), 1.dp.toPx())
                        drawLine(lineColor, Offset(0f, y), Offset(size.width, y), 1.dp.toPx())
                    }
                }
                LumenBackdropVariant.Rays -> {
                    val radius = hypot(size.width, size.height)
                    for (index in 0 until 12) {
                        val angle = index * Math.PI.toFloat() / 6
                        drawLine(
                            color = color.copy(alpha = 0.2f * intensity.opacity),
                            start = center,
                            end = Offset(
                                center.x + cos(angle) * radius,
                                center.y + sin(angle) * radius
                            ),
                            strokeWidth = 1.dp.toPx()
                        )
                    }
                }
            }
        }
        content()
    }
}

enum class LumenIllustrationSize(val dimension: Dp) {
    Sm(96.dp),
    Md(128.dp),
    Lg(176.dp)
}

enum class LumenIllustrationTone {
    Accent,
    Auto,
    Brand,
    Neutral
}

enum class LumenIllustrationVariant {
    Empty,
    Error,
    Offline,
    Success
}

internal fun lumenIllustrationColor(
    colors: LumenColorPalette,
    tone: LumenIllustrationTone,
    variant: LumenIllustrationVariant
): Color = when (tone) {
    LumenIllustrationTone.Accent -> colors.accent
    LumenIllustrationTone.Brand -> colors.brand
    LumenIllustrationTone.Neutral -> colors.inkMuted
    LumenIllustrationTone.Auto -> when (variant) {
        LumenIllustrationVariant.Empty -> colors.brand
        LumenIllustrationVariant.Error -> colors.danger
        LumenIllustrationVariant.Offline -> colors.inkMuted
        LumenIllustrationVariant.Success -> colors.success
    }
}

@Composable
fun LumenIllustration(
    modifier: Modifier = Modifier,
    variant: LumenIllustrationVariant = LumenIllustrationVariant.Empty,
    tone: LumenIllustrationTone = LumenIllustrationTone.Auto,
    size: LumenIllustrationSize = LumenIllustrationSize.Md,
    label: String? = null
) {
    val colors = LocalLumenTheme.current.colors
    val color = lumenIllustrationColor(colors, tone, variant)
    val semanticsModifier = if (label == null) {
        Modifier.clearAndSetSemantics {}
    } else {
        Modifier.semantics { contentDescription = label }
    }

    Canvas(modifier = modifier.size(size.dimension).then(semanticsModifier)) {
        val scale = this.size.minDimension / 120f
        val strokeWidth = maxOf(2.dp.toPx(), 2.5f * scale)
        val stroke = Stroke(width = strokeWidth, cap = StrokeCap.Round, join = StrokeJoin.Round)
        drawCircle(color.copy(alpha = 0.1f), radius = this.size.minDimension * 0.41f)

        when (variant) {
            LumenIllustrationVariant.Empty -> {
                drawRoundRect(
                    color = color,
                    topLeft = Offset(29f * scale, 43f * scale),
                    size = Size(62f * scale, 40f * scale),
                    cornerRadius = CornerRadius(8f * scale),
                    style = stroke
                )
                drawLine(color, Offset(40f * scale, 60f * scale), Offset(80f * scale, 60f * scale), strokeWidth)
            }
            LumenIllustrationVariant.Error, LumenIllustrationVariant.Success -> {
                drawCircle(color, radius = 30f * scale, style = stroke)
                if (variant == LumenIllustrationVariant.Success) {
                    drawLine(color, Offset(44f * scale, 61f * scale), Offset(55f * scale, 72f * scale), strokeWidth, StrokeCap.Round)
                    drawLine(color, Offset(55f * scale, 72f * scale), Offset(77f * scale, 48f * scale), strokeWidth, StrokeCap.Round)
                } else {
                    drawLine(color, Offset(47f * scale, 47f * scale), Offset(73f * scale, 73f * scale), strokeWidth, StrokeCap.Round)
                    drawLine(color, Offset(73f * scale, 47f * scale), Offset(47f * scale, 73f * scale), strokeWidth, StrokeCap.Round)
                }
            }
            LumenIllustrationVariant.Offline -> {
                drawRoundRect(
                    color = color,
                    topLeft = Offset(24f * scale, 45f * scale),
                    size = Size(72f * scale, 35f * scale),
                    cornerRadius = CornerRadius(18f * scale),
                    style = stroke
                )
                drawLine(color, Offset(30f * scale, 30f * scale), Offset(90f * scale, 90f * scale), strokeWidth, StrokeCap.Round)
            }
        }
    }
}

@Composable
fun LumenDisclosure(
    title: String,
    expanded: Boolean,
    onExpandedChange: (Boolean) -> Unit,
    modifier: Modifier = Modifier,
    description: String? = null,
    enabled: Boolean = true,
    graphic: (@Composable () -> Unit)? = null,
    content: @Composable () -> Unit
) {
    val colors = LocalLumenTheme.current.colors

    Surface(
        modifier = modifier,
        color = colors.surface,
        contentColor = colors.ink,
        shape = RoundedCornerShape(LumenRadius.Md),
        border = androidx.compose.foundation.BorderStroke(1.dp, colors.line)
    ) {
        Column {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .heightIn(min = 48.dp)
                    .clickable(
                        enabled = enabled,
                        role = Role.Button,
                        onClick = { onExpandedChange(!expanded) }
                    )
                    .semantics(mergeDescendants = true) {
                        contentDescription = title
                        stateDescription = if (expanded) "Expanded" else "Collapsed"
                    }
                    .padding(horizontal = LumenSpacing.Lg, vertical = LumenSpacing.Md),
                horizontalArrangement = Arrangement.spacedBy(LumenSpacing.Md),
                verticalAlignment = Alignment.CenterVertically
            ) {
                graphic?.invoke()
                Column(
                    modifier = Modifier.weight(1f),
                    verticalArrangement = Arrangement.spacedBy(LumenSpacing.Xs)
                ) {
                    Text(
                        text = title,
                        color = colors.ink,
                        style = MaterialTheme.typography.labelLarge.copy(fontWeight = FontWeight.SemiBold)
                    )
                    if (description != null) {
                        Text(text = description, color = colors.inkMuted, style = MaterialTheme.typography.bodySmall)
                    }
                }
                Text(
                    text = if (expanded) "−" else "+",
                    modifier = Modifier.clearAndSetSemantics {},
                    color = colors.inkSoft,
                    style = MaterialTheme.typography.titleMedium
                )
            }
            if (expanded) {
                LumenDivider()
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(LumenSpacing.Lg)
                ) {
                    content()
                }
            }
        }
    }
}
