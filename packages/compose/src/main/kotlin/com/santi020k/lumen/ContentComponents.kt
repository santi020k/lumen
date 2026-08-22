package com.santi020k.lumen

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
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
