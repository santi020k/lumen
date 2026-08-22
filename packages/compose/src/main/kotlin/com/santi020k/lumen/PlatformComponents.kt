package com.santi020k.lumen

import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.NavigationBar as MaterialNavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.SmallFloatingActionButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.Immutable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp

@Immutable
data class LumenNavigationItem<Value>(
    val value: Value,
    val label: String,
    val icon: ImageVector,
    val selectedIcon: ImageVector = icon,
    val enabled: Boolean = true
)

internal fun <Value> isLumenNavigationItemSelected(itemValue: Value, selectedValue: Value): Boolean =
    itemValue == selectedValue

/**
 * A Material-native controlled destination bar. Navigation stacks and screen content remain app-owned.
 */
@Composable
fun <Value> LumenNavigationBar(
    items: List<LumenNavigationItem<Value>>,
    selectedValue: Value,
    onValueChange: (Value) -> Unit,
    modifier: Modifier = Modifier,
    accessibilityLabel: String = "Primary navigation"
) {
    val colors = LocalLumenTheme.current.colors

    MaterialNavigationBar(
        modifier = modifier.semantics { contentDescription = accessibilityLabel },
        containerColor = colors.surface,
        contentColor = colors.inkMuted
    ) {
        items.forEach { item ->
            val selected = isLumenNavigationItemSelected(item.value, selectedValue)

            NavigationBarItem(
                selected = selected,
                onClick = { onValueChange(item.value) },
                icon = {
                    LumenIcon(
                        imageVector = if (selected) item.selectedIcon else item.icon,
                        contentDescription = null,
                        size = LumenIconSize.Md,
                        tint = (if (selected) colors.brand else colors.inkMuted).copy(
                            alpha = if (item.enabled) 1f else 0.52f
                        )
                    )
                },
                enabled = item.enabled,
                label = { Text(item.label, maxLines = 1) },
                colors = NavigationBarItemDefaults.colors(
                    selectedIconColor = colors.brand,
                    selectedTextColor = colors.brand,
                    indicatorColor = colors.brandSoft,
                    unselectedIconColor = colors.inkMuted,
                    unselectedTextColor = colors.inkMuted,
                    disabledIconColor = colors.inkMuted.copy(alpha = 0.52f),
                    disabledTextColor = colors.inkMuted.copy(alpha = 0.52f)
                )
            )
        }
    }
}

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
