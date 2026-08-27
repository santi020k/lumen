package com.santi020k.lumen

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.IconButtonDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.Immutable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.draw.clip
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp

enum class LumenTextTone {
    Danger,
    Default,
    Muted,
    Soft,
    Success,
    Warning
}

enum class LumenTextVariant {
    Body,
    Caption,
    Label,
    Title
}

@Composable
fun LumenText(
    text: String,
    modifier: Modifier = Modifier,
    variant: LumenTextVariant = LumenTextVariant.Body,
    tone: LumenTextTone = LumenTextTone.Default
) {
    val theme = LocalLumenTheme.current
    val color = when (tone) {
        LumenTextTone.Danger -> theme.colors.danger
        LumenTextTone.Default -> theme.colors.ink
        LumenTextTone.Muted -> theme.colors.inkMuted
        LumenTextTone.Soft -> theme.colors.inkSoft
        LumenTextTone.Success -> theme.colors.success
        LumenTextTone.Warning -> theme.colors.warning
    }
    val style = when (variant) {
        LumenTextVariant.Body -> MaterialTheme.typography.bodyLarge
        LumenTextVariant.Caption -> MaterialTheme.typography.bodySmall
        LumenTextVariant.Label -> MaterialTheme.typography.labelLarge.copy(fontWeight = FontWeight.SemiBold)
        LumenTextVariant.Title -> MaterialTheme.typography.headlineSmall.copy(fontWeight = FontWeight.Bold)
    }

    Text(text = text, modifier = modifier, color = color, style = style)
}

enum class LumenSurfacePadding(val value: Dp) {
    None(0.dp),
    Sm(LumenSpacing.Sm),
    Md(LumenSpacing.Md),
    Lg(LumenSpacing.Lg),
    Xl(LumenSpacing.Xl)
}

enum class LumenSurfaceRadius(val value: Dp) {
    None(0.dp),
    Sm(LumenRadius.Sm),
    Md(LumenRadius.Md),
    Lg(LumenRadius.Lg),
    Xl(LumenRadius.Xl),
    Size2xl(LumenRadius.Size2xl),
    Size3xl(LumenRadius.Size3xl)
}

enum class LumenSurfaceTone {
    Canvas,
    Muted,
    Strong,
    Surface
}

@Composable
fun LumenSurface(
    modifier: Modifier = Modifier,
    tone: LumenSurfaceTone = LumenSurfaceTone.Surface,
    padding: LumenSurfacePadding = LumenSurfacePadding.Md,
    radius: LumenSurfaceRadius = LumenSurfaceRadius.Md,
    content: @Composable () -> Unit
) {
    val colors = LocalLumenTheme.current.colors
    val color = when (tone) {
        LumenSurfaceTone.Canvas -> colors.canvas
        LumenSurfaceTone.Muted -> colors.surfaceMuted
        LumenSurfaceTone.Strong -> colors.surfaceStrong
        LumenSurfaceTone.Surface -> colors.surface
    }

    Surface(
        modifier = modifier,
        color = color,
        shape = RoundedCornerShape(radius.value)
    ) {
        androidx.compose.foundation.layout.Box(
            modifier = Modifier.padding(padding.value),
            contentAlignment = Alignment.TopStart
        ) {
            content()
        }
    }
}

enum class LumenButtonIntent {
    Danger,
    Primary,
    Quiet,
    Secondary
}

enum class LumenControlSize {
    Lg,
    Md,
    Sm
}

enum class LumenIconSize(val dimension: Dp) {
    Sm(16.dp),
    Md(20.dp),
    Lg(24.dp)
}

@Composable
fun LumenIcon(
    imageVector: ImageVector,
    modifier: Modifier = Modifier,
    contentDescription: String? = null,
    size: LumenIconSize = LumenIconSize.Md,
    tint: Color = LocalLumenTheme.current.colors.ink
) {
    Icon(
        imageVector = imageVector,
        contentDescription = contentDescription,
        modifier = modifier.size(size.dimension),
        tint = tint
    )
}

@Composable
fun LumenIcon(
    name: LumenIconName,
    modifier: Modifier = Modifier,
    contentDescription: String? = null,
    size: LumenIconSize = LumenIconSize.Md,
    tint: Color = LocalLumenTheme.current.colors.ink
) {
    Icon(
        painter = painterResource(name.resourceId),
        contentDescription = contentDescription,
        modifier = modifier.size(size.dimension),
        tint = tint
    )
}

@Immutable
data class LumenIconButtonMetrics(
    val iconSize: LumenIconSize,
    val touchTarget: Dp
) {
    companion object {
        fun resolve(size: LumenControlSize): LumenIconButtonMetrics = when (size) {
            LumenControlSize.Lg -> LumenIconButtonMetrics(LumenIconSize.Lg, 52.dp)
            LumenControlSize.Md -> LumenIconButtonMetrics(LumenIconSize.Md, 44.dp)
            LumenControlSize.Sm -> LumenIconButtonMetrics(LumenIconSize.Sm, 44.dp)
        }
    }
}

@Composable
fun LumenIconButton(
    imageVector: ImageVector,
    contentDescription: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    intent: LumenButtonIntent = LumenButtonIntent.Quiet,
    size: LumenControlSize = LumenControlSize.Md,
    enabled: Boolean = true
) {
    val palette = buttonPalette(LocalLumenTheme.current.colors, intent)
    val metrics = LumenIconButtonMetrics.resolve(size)
    val shape = RoundedCornerShape(LumenRadius.Sm)

    IconButton(
        onClick = onClick,
        modifier = modifier
            .size(metrics.touchTarget)
            .clip(shape)
            .border(1.dp, palette.border, shape),
        enabled = enabled,
        colors = IconButtonDefaults.iconButtonColors(
            containerColor = palette.background,
            contentColor = palette.foreground,
            disabledContainerColor = palette.background.copy(alpha = 0.52f),
            disabledContentColor = palette.foreground.copy(alpha = 0.52f)
        )
    ) {
        LumenIcon(
            imageVector = imageVector,
            contentDescription = contentDescription,
            size = metrics.iconSize,
            tint = palette.foreground.copy(alpha = if (enabled) 1f else 0.52f)
        )
    }
}

@Composable
fun LumenIconButton(
    name: LumenIconName,
    contentDescription: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    intent: LumenButtonIntent = LumenButtonIntent.Quiet,
    size: LumenControlSize = LumenControlSize.Md,
    enabled: Boolean = true
) {
    val palette = buttonPalette(LocalLumenTheme.current.colors, intent)
    val metrics = LumenIconButtonMetrics.resolve(size)
    val shape = RoundedCornerShape(LumenRadius.Sm)

    IconButton(
        onClick = onClick,
        modifier = modifier
            .size(metrics.touchTarget)
            .clip(shape)
            .border(1.dp, palette.border, shape),
        enabled = enabled,
        colors = IconButtonDefaults.iconButtonColors(
            containerColor = palette.background,
            contentColor = palette.foreground,
            disabledContainerColor = palette.background.copy(alpha = 0.52f),
            disabledContentColor = palette.foreground.copy(alpha = 0.52f)
        )
    ) {
        LumenIcon(
            name = name,
            contentDescription = contentDescription,
            size = metrics.iconSize,
            tint = palette.foreground.copy(alpha = if (enabled) 1f else 0.52f)
        )
    }
}

@Immutable
data class LumenButtonMetrics(
    val horizontalPadding: Dp,
    val minHeight: Dp
) {
    companion object {
        fun resolve(size: LumenControlSize): LumenButtonMetrics = when (size) {
            LumenControlSize.Lg -> LumenButtonMetrics(LumenSpacing.Xl, 52.dp)
            LumenControlSize.Md -> LumenButtonMetrics(LumenSpacing.Lg, 44.dp)
            LumenControlSize.Sm -> LumenButtonMetrics(LumenSpacing.Md, 36.dp)
        }
    }
}

private data class LumenButtonPalette(
    val background: Color,
    val border: Color,
    val foreground: Color
)

private fun buttonPalette(
    colors: LumenColorPalette,
    intent: LumenButtonIntent
): LumenButtonPalette = when (intent) {
    LumenButtonIntent.Danger -> LumenButtonPalette(colors.danger, colors.danger, colors.onDanger)
    LumenButtonIntent.Primary -> LumenButtonPalette(colors.brandSolid, colors.brandSolid, colors.onBrand)
    LumenButtonIntent.Quiet -> LumenButtonPalette(Color.Transparent, Color.Transparent, colors.inkSoft)
    LumenButtonIntent.Secondary -> LumenButtonPalette(colors.surfaceMuted, colors.line, colors.ink)
}

@Composable
fun LumenButton(
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    intent: LumenButtonIntent = LumenButtonIntent.Primary,
    size: LumenControlSize = LumenControlSize.Md,
    loading: Boolean = false,
    enabled: Boolean = true,
    content: @Composable RowScope.() -> Unit
) {
    val palette = buttonPalette(LocalLumenTheme.current.colors, intent)
    val metrics = LumenButtonMetrics.resolve(size)
    val semanticsModifier = if (loading) {
        Modifier.semantics { stateDescription = "Loading" }
    } else {
        Modifier
    }

    Button(
        onClick = onClick,
        modifier = modifier
            .then(semanticsModifier)
            .defaultMinSize(minHeight = metrics.minHeight),
        enabled = enabled && !loading,
        shape = RoundedCornerShape(LumenRadius.Sm),
        border = BorderStroke(1.dp, palette.border),
        colors = ButtonDefaults.buttonColors(
            containerColor = palette.background,
            contentColor = palette.foreground,
            disabledContainerColor = palette.background.copy(alpha = 0.52f),
            disabledContentColor = palette.foreground.copy(alpha = 0.52f)
        ),
        contentPadding = PaddingValues(
            horizontal = metrics.horizontalPadding,
            vertical = LumenSpacing.Sm
        )
    ) {
        Row(
            horizontalArrangement = Arrangement.Center,
            verticalAlignment = Alignment.CenterVertically
        ) {
            if (loading) {
                CircularProgressIndicator(
                    modifier = Modifier.size(16.dp),
                    color = palette.foreground,
                    strokeWidth = 2.dp
                )
                Spacer(modifier = Modifier.width(LumenSpacing.Sm))
            }
            content()
        }
    }
}

@Composable
fun LumenTextField(
    value: String,
    onValueChange: (String) -> Unit,
    label: String,
    modifier: Modifier = Modifier,
    size: LumenControlSize = LumenControlSize.Md,
    error: Boolean = false,
    errorMessage: String? = null,
    enabled: Boolean = true,
    visualTransformation: VisualTransformation = VisualTransformation.None
) {
    val colors = LocalLumenTheme.current.colors
    val metrics = LumenButtonMetrics.resolve(size)

    OutlinedTextField(
        value = value,
        onValueChange = onValueChange,
        modifier = modifier.defaultMinSize(minHeight = metrics.minHeight),
        enabled = enabled,
        isError = error,
        singleLine = true,
        label = { Text(label) },
        supportingText = errorMessage?.let { message -> ({ Text(message) }) },
        visualTransformation = visualTransformation,
        shape = RoundedCornerShape(LumenRadius.Sm),
        colors = OutlinedTextFieldDefaults.colors(
            focusedContainerColor = colors.surface,
            unfocusedContainerColor = colors.surface,
            disabledContainerColor = colors.surface,
            focusedTextColor = colors.ink,
            unfocusedTextColor = colors.ink,
            focusedBorderColor = colors.brand,
            unfocusedBorderColor = colors.line,
            errorBorderColor = colors.danger,
            cursorColor = colors.brand
        )
    )
}

enum class LumenBadgeTone {
    Accent,
    Danger,
    Neutral,
    Success,
    Warning
}

@Composable
fun LumenBadge(
    text: String,
    modifier: Modifier = Modifier,
    tone: LumenBadgeTone = LumenBadgeTone.Neutral
) {
    val colors = LocalLumenTheme.current.colors
    val foreground = when (tone) {
        LumenBadgeTone.Accent -> colors.accent
        LumenBadgeTone.Danger -> colors.danger
        LumenBadgeTone.Neutral -> colors.inkSoft
        LumenBadgeTone.Success -> colors.success
        LumenBadgeTone.Warning -> colors.warning
    }
    val background = if (tone == LumenBadgeTone.Neutral) {
        colors.surfaceMuted
    } else {
        foreground.copy(alpha = 0.12f)
    }

    Surface(
        modifier = modifier,
        color = background,
        contentColor = foreground,
        shape = RoundedCornerShape(LumenRadius.Full)
    ) {
        Text(
            text = text,
            modifier = Modifier.padding(horizontal = LumenSpacing.Sm, vertical = LumenSpacing.Xs),
            style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.SemiBold)
        )
    }
}

@Composable
fun LumenDivider(modifier: Modifier = Modifier) {
    val colors = LocalLumenTheme.current.colors

    HorizontalDivider(modifier = modifier, color = colors.line)
}

@Composable
fun LumenSpinner(
    modifier: Modifier = Modifier,
    label: String = "Loading"
) {
    val colors = LocalLumenTheme.current.colors

    CircularProgressIndicator(
        modifier = modifier.semantics { contentDescription = label },
        color = colors.brand
    )
}
