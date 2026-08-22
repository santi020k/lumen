package com.santi020k.lumen

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.IntrinsicSize
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.Immutable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp

enum class LumenBannerVariant {
    Accent,
    Default,
    Destructive,
    Success,
    Warning
}

enum class LumenMetricTone {
    Accent,
    Brand,
    Danger,
    Neutral,
    Success,
    Warning
}

@Immutable
data class LumenBannerPalette(
    val accent: Color,
    val background: Color,
    val border: Color
)

fun lumenMetricColor(colors: LumenColorPalette, tone: LumenMetricTone): Color = when (tone) {
    LumenMetricTone.Accent -> colors.accent
    LumenMetricTone.Brand -> colors.brand
    LumenMetricTone.Danger -> colors.danger
    LumenMetricTone.Neutral -> colors.inkMuted
    LumenMetricTone.Success -> colors.success
    LumenMetricTone.Warning -> colors.warning
}

fun lumenBannerPalette(
    colors: LumenColorPalette,
    variant: LumenBannerVariant
): LumenBannerPalette {
    val tone = when (variant) {
        LumenBannerVariant.Accent -> LumenMetricTone.Accent
        LumenBannerVariant.Default -> LumenMetricTone.Brand
        LumenBannerVariant.Destructive -> LumenMetricTone.Danger
        LumenBannerVariant.Success -> LumenMetricTone.Success
        LumenBannerVariant.Warning -> LumenMetricTone.Warning
    }
    val accent = lumenMetricColor(colors, tone)

    return LumenBannerPalette(
        accent = accent,
        background = if (variant == LumenBannerVariant.Default) colors.surface else accent.copy(alpha = 0.08f),
        border = if (variant == LumenBannerVariant.Default) colors.line else accent.copy(alpha = 0.32f)
    )
}

@Composable
fun LumenEmptyState(
    title: String,
    modifier: Modifier = Modifier,
    description: String? = null,
    graphic: (@Composable () -> Unit)? = null,
    actions: (@Composable () -> Unit)? = null
) {
    val colors = LocalLumenTheme.current.colors

    Column(
        modifier = modifier
            .fillMaxWidth()
            .widthIn(max = 440.dp)
            .padding(LumenSpacing.Xl),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(LumenSpacing.Lg)
    ) {
        if (graphic != null) {
            Box(
                modifier = Modifier
                    .size(56.dp)
                    .clip(CircleShape)
                    .background(colors.surfaceMuted),
                contentAlignment = Alignment.Center
            ) {
                graphic()
            }
        }

        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(LumenSpacing.Sm)
        ) {
            Text(
                text = title,
                color = colors.ink,
                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.SemiBold),
                textAlign = TextAlign.Center
            )

            if (description != null) {
                Text(
                    text = description,
                    color = colors.inkMuted,
                    style = MaterialTheme.typography.bodyMedium,
                    textAlign = TextAlign.Center
                )
            }
        }

        actions?.invoke()
    }
}

@Composable
fun LumenListRow(
    modifier: Modifier = Modifier,
    leading: (@Composable () -> Unit)? = null,
    trailing: (@Composable () -> Unit)? = null,
    content: @Composable () -> Unit
) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .heightIn(min = 56.dp)
            .padding(horizontal = LumenSpacing.Lg, vertical = LumenSpacing.Md),
        horizontalArrangement = Arrangement.spacedBy(LumenSpacing.Md),
        verticalAlignment = Alignment.CenterVertically
    ) {
        leading?.invoke()

        Box(modifier = Modifier.weight(1f)) {
            content()
        }

        trailing?.invoke()
    }
}

@Composable
fun LumenBanner(
    title: String,
    modifier: Modifier = Modifier,
    description: String? = null,
    variant: LumenBannerVariant = LumenBannerVariant.Default,
    dismissLabel: String = "Dismiss",
    onDismiss: (() -> Unit)? = null,
    graphic: (@Composable () -> Unit)? = null,
    actions: (@Composable () -> Unit)? = null
) {
    val colors = LocalLumenTheme.current.colors
    val palette = lumenBannerPalette(colors, variant)
    val shape = RoundedCornerShape(LumenRadius.Md)

    Surface(
        modifier = modifier,
        color = palette.background,
        contentColor = colors.ink,
        shape = shape,
        border = BorderStroke(1.dp, palette.border)
    ) {
        Row(
            modifier = Modifier.height(IntrinsicSize.Min)
        ) {
            Box(
                modifier = Modifier
                    .width(3.dp)
                    .fillMaxHeight()
                    .background(palette.accent)
            )
            Row(
                modifier = Modifier
                    .weight(1f)
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
                        Text(
                            text = description,
                            color = colors.inkSoft,
                            style = MaterialTheme.typography.bodySmall
                        )
                    }
                }

                actions?.invoke()

                if (onDismiss != null) {
                    TextButton(onClick = onDismiss) {
                        Text(dismissLabel, color = palette.accent)
                    }
                }
            }
        }
    }
}

@Composable
fun LumenStat(
    label: String,
    value: String,
    modifier: Modifier = Modifier,
    detail: String? = null,
    tone: LumenMetricTone = LumenMetricTone.Brand,
    graphic: (@Composable () -> Unit)? = null
) {
    val colors = LocalLumenTheme.current.colors
    val accent = lumenMetricColor(colors, tone)
    val accessibleText = listOfNotNull(label, value, detail).joinToString(", ")

    Column(
        modifier = modifier
            .semantics(mergeDescendants = true) { contentDescription = accessibleText }
            .background(accent.copy(alpha = 0.06f), RoundedCornerShape(LumenRadius.Md))
            .border(1.dp, accent.copy(alpha = 0.18f), RoundedCornerShape(LumenRadius.Md))
            .padding(LumenSpacing.Lg),
        verticalArrangement = Arrangement.spacedBy(LumenSpacing.Sm)
    ) {
        graphic?.invoke()

        Text(
            text = value,
            color = colors.ink,
            style = MaterialTheme.typography.headlineSmall.copy(fontWeight = FontWeight.Bold)
        )
        Text(
            text = label,
            color = colors.inkSoft,
            style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.SemiBold)
        )

        if (detail != null) {
            Text(text = detail, color = colors.inkMuted, style = MaterialTheme.typography.bodySmall)
        }
    }
}

@Composable
fun LumenSectionHeader(
    title: String,
    modifier: Modifier = Modifier,
    subtitle: String? = null,
    count: String? = null,
    actions: (@Composable () -> Unit)? = null
) {
    val colors = LocalLumenTheme.current.colors

    Row(
        modifier = modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(LumenSpacing.Md),
        verticalAlignment = Alignment.Top
    ) {
        Column(
            modifier = Modifier.weight(1f),
            verticalArrangement = Arrangement.spacedBy(LumenSpacing.Xs)
        ) {
            Row(
                horizontalArrangement = Arrangement.spacedBy(LumenSpacing.Sm),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = title,
                    modifier = Modifier.semantics { heading() },
                    color = colors.ink,
                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.SemiBold)
                )
                if (count != null) LumenBadge(count)
            }

            if (subtitle != null) {
                Text(text = subtitle, color = colors.inkMuted, style = MaterialTheme.typography.bodySmall)
            }
        }

        actions?.invoke()
    }
}

@Composable
fun LumenStatusBar(
    message: String,
    modifier: Modifier = Modifier,
    tone: LumenMetricTone = LumenMetricTone.Neutral,
    trailing: (@Composable () -> Unit)? = null
) {
    val colors = LocalLumenTheme.current.colors

    Row(
        modifier = modifier
            .fillMaxWidth()
            .heightIn(min = 36.dp)
            .background(colors.surfaceMuted)
            .padding(horizontal = LumenSpacing.Lg),
        horizontalArrangement = Arrangement.spacedBy(LumenSpacing.Sm),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Spacer(
            modifier = Modifier
                .size(7.dp)
                .clip(CircleShape)
                .background(lumenMetricColor(colors, tone))
        )
        Text(
            text = message,
            modifier = Modifier.weight(1f),
            color = colors.inkSoft,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
            style = MaterialTheme.typography.bodySmall
        )
        trailing?.invoke()
    }
}
