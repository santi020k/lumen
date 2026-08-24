package com.santi020k.lumen

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.scaleIn
import androidx.compose.animation.scaleOut
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutVertically
import androidx.compose.animation.core.animateDpAsState
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Badge
import androidx.compose.material3.BadgedBox
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.NavigationBar as MaterialNavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.SmallFloatingActionButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.adaptive.navigationsuite.NavigationSuiteScaffold
import androidx.compose.runtime.Composable
import androidx.compose.runtime.Immutable
import androidx.compose.runtime.Stable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.input.nestedscroll.NestedScrollConnection
import androidx.compose.ui.input.nestedscroll.NestedScrollSource
import androidx.compose.ui.input.nestedscroll.nestedScroll
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.platform.LocalDensity
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
    val badge: LumenNavigationBadge? = null,
    val enabled: Boolean = true
)

@Immutable
data class LumenNavigationBadge(
    val text: String? = null,
    val accessibilityLabel: String = text ?: "New activity"
) {
    companion object {
        fun dot(accessibilityLabel: String = "New activity"): LumenNavigationBadge =
            LumenNavigationBadge(accessibilityLabel = accessibilityLabel)

        fun count(value: Int): LumenNavigationBadge {
            val safeValue = value.coerceAtLeast(0)
            return LumenNavigationBadge(
                text = if (safeValue > 99) "99+" else safeValue.toString(),
                accessibilityLabel = "$safeValue new items"
            )
        }
    }
}

internal fun <Value> isLumenNavigationItemSelected(itemValue: Value, selectedValue: Value): Boolean =
    itemValue == selectedValue

internal fun <Value> dispatchLumenNavigationSelection(
    itemValue: Value,
    selectedValue: Value,
    onValueChange: (Value) -> Unit,
    onReselect: ((Value) -> Unit)?
) {
    if (itemValue == selectedValue && onReselect != null) onReselect(itemValue)
    else onValueChange(itemValue)
}

/**
 * Direction-aware visibility state for a bottom navigation bar.
 *
 * Attach [lumenNavigationBarScrollBehavior] to the parent of a vertically scrolling child, then
 * pass this state to [LumenNavigationBar]. Small direction changes are accumulated until the
 * threshold is reached so incidental finger movement does not make navigation flicker.
 */
@Stable
class LumenNavigationBarScrollState internal constructor(
    initiallyVisible: Boolean,
    private val thresholdPx: Float
) {
    var isVisible: Boolean by mutableStateOf(initiallyVisible)
        private set

    private var accumulatedDeltaY = 0f

    internal fun recordScrollDelta(deltaY: Float) {
        if (!deltaY.isFinite() || deltaY == 0f) return

        val changedDirection =
            (accumulatedDeltaY < 0f && deltaY > 0f) || (accumulatedDeltaY > 0f && deltaY < 0f)
        if (changedDirection) accumulatedDeltaY = 0f

        accumulatedDeltaY += deltaY
        when {
            accumulatedDeltaY <= -thresholdPx -> hide()
            accumulatedDeltaY >= thresholdPx -> show()
        }
    }

    internal val nestedScrollConnection = object : NestedScrollConnection {
        override fun onPreScroll(available: Offset, source: NestedScrollSource): Offset {
            recordScrollDelta(available.y)
            return Offset.Zero
        }
    }

    fun show() {
        isVisible = true
        accumulatedDeltaY = 0f
    }

    fun hide() {
        isVisible = false
        accumulatedDeltaY = 0f
    }
}

/** Remembers scroll-responsive navigation state using a density-aware movement threshold. */
@Composable
fun rememberLumenNavigationBarScrollState(
    initiallyVisible: Boolean = true,
    threshold: Dp = 16.dp
): LumenNavigationBarScrollState {
    val thresholdPx = with(LocalDensity.current) {
        if (threshold.value.isFinite() && threshold > 0.dp) threshold.toPx() else 16.dp.toPx()
    }

    return remember(initiallyVisible, thresholdPx) {
        LumenNavigationBarScrollState(initiallyVisible, thresholdPx)
    }
}

/** Connects scroll deltas from a descendant scroll container to a Lumen navigation bar state. */
fun Modifier.lumenNavigationBarScrollBehavior(
    state: LumenNavigationBarScrollState
): Modifier = nestedScroll(state.nestedScrollConnection)

/**
 * A Material-native controlled destination bar. Navigation stacks and screen content remain app-owned.
 */
@Composable
fun <Value> LumenNavigationBar(
    items: List<LumenNavigationItem<Value>>,
    selectedValue: Value,
    onValueChange: (Value) -> Unit,
    modifier: Modifier = Modifier,
    onReselect: ((Value) -> Unit)? = null,
    accessibilityLabel: String = "Primary navigation",
    scrollState: LumenNavigationBarScrollState? = null
) {
    val colors = LocalLumenTheme.current.colors

    AnimatedVisibility(
        visible = scrollState?.isVisible ?: true,
        enter = slideInVertically(initialOffsetY = { it }) + fadeIn(),
        exit = slideOutVertically(targetOffsetY = { it }) + fadeOut()
    ) {
        MaterialNavigationBar(
            modifier = modifier.semantics { contentDescription = accessibilityLabel },
            containerColor = colors.surface,
            contentColor = colors.inkMuted
        ) {
            items.forEach { item ->
                val selected = isLumenNavigationItemSelected(item.value, selectedValue)

                NavigationBarItem(
                    selected = selected,
                    onClick = {
                        dispatchLumenNavigationSelection(
                            item.value,
                            selectedValue,
                            onValueChange,
                            onReselect
                        )
                    },
                    icon = {
                        BadgedBox(
                            badge = {
                                item.badge?.let { badge ->
                                    LumenNavigationBadgeView(badge)
                                }
                            }
                        ) {
                            LumenIcon(
                                imageVector = if (selected) item.selectedIcon else item.icon,
                                contentDescription = null,
                                size = LumenIconSize.Md,
                                tint = (if (selected) colors.brand else colors.inkMuted).copy(
                                    alpha = if (item.enabled) 1f else 0.52f
                                )
                            )
                        }
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
}

@Composable
private fun LumenNavigationBadgeView(badge: LumenNavigationBadge) {
    val colors = LocalLumenTheme.current.colors

    Badge(
        modifier = Modifier.semantics { contentDescription = badge.accessibilityLabel },
        containerColor = colors.danger,
        contentColor = colors.onDanger
    ) {
        badge.text?.let { Text(it, maxLines = 1) }
    }
}

/**
 * A compact token-aware status or action surface intended directly above bottom navigation.
 */
@Composable
fun LumenNavigationBarAccessory(
    modifier: Modifier = Modifier,
    scrollState: LumenNavigationBarScrollState? = null,
    content: @Composable () -> Unit
) {
    val colors = LocalLumenTheme.current.colors

    AnimatedVisibility(
        visible = scrollState?.isVisible ?: true,
        enter = slideInVertically(initialOffsetY = { it }) + fadeIn(),
        exit = slideOutVertically(targetOffsetY = { it }) + fadeOut()
    ) {
        Surface(
            modifier = modifier.fillMaxWidth(),
            color = colors.surface,
            contentColor = colors.ink
        ) {
            Box(
                modifier = Modifier
                    .defaultMinSize(minHeight = 48.dp)
                    .padding(horizontal = LumenSpacing.Lg, vertical = LumenSpacing.Sm)
            ) {
                content()
            }
            HorizontalDivider(color = colors.line)
        }
    }
}

/**
 * Material adaptive navigation that switches between a bottom bar and navigation rail as the
 * application window and device posture change. Destination content and routing remain app-owned.
 */
@Composable
fun <Value> LumenAdaptiveNavigationScaffold(
    items: List<LumenNavigationItem<Value>>,
    selectedValue: Value,
    onValueChange: (Value) -> Unit,
    modifier: Modifier = Modifier,
    onReselect: ((Value) -> Unit)? = null,
    content: @Composable () -> Unit
) {
    val colors = LocalLumenTheme.current.colors

    NavigationSuiteScaffold(
        navigationSuiteItems = {
            items.forEach { navigationItem ->
                val selected = navigationItem.value == selectedValue

                item(
                    selected = selected,
                    onClick = {
                        dispatchLumenNavigationSelection(
                            navigationItem.value,
                            selectedValue,
                            onValueChange,
                            onReselect
                        )
                    },
                    icon = {
                        LumenIcon(
                            imageVector = if (selected) navigationItem.selectedIcon else navigationItem.icon,
                            contentDescription = null,
                            size = LumenIconSize.Md,
                            tint = if (selected) colors.brand else colors.inkMuted
                        )
                    },
                    enabled = navigationItem.enabled,
                    label = { Text(navigationItem.label, maxLines = 1) },
                    badge = navigationItem.badge?.let { badge ->
                        { LumenNavigationBadgeView(badge) }
                    }
                )
            }
        },
        modifier = modifier,
        containerColor = colors.canvas,
        contentColor = colors.ink,
        content = content
    )
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

enum class LumenFloatingActionButtonNavigationBehavior {
    AlwaysVisible,
    HideWithNavigation,
    FollowNavigation
}

internal fun lumenFloatingActionButtonVisible(
    behavior: LumenFloatingActionButtonNavigationBehavior,
    navigationVisible: Boolean
): Boolean = behavior != LumenFloatingActionButtonNavigationBehavior.HideWithNavigation || navigationVisible

internal fun lumenFloatingActionButtonOffset(
    behavior: LumenFloatingActionButtonNavigationBehavior,
    navigationVisible: Boolean
): Dp = if (
    behavior == LumenFloatingActionButtonNavigationBehavior.FollowNavigation && !navigationVisible
) {
    16.dp
} else {
    0.dp
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
    size: LumenFloatingActionButtonSize = LumenFloatingActionButtonSize.Regular,
    scrollState: LumenNavigationBarScrollState? = null,
    navigationBehavior: LumenFloatingActionButtonNavigationBehavior =
        LumenFloatingActionButtonNavigationBehavior.AlwaysVisible
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

    val navigationVisible = scrollState?.isVisible ?: true
    val visible = lumenFloatingActionButtonVisible(navigationBehavior, navigationVisible)
    val offset by animateDpAsState(
        targetValue = lumenFloatingActionButtonOffset(navigationBehavior, navigationVisible),
        label = "Lumen floating action navigation offset"
    )

    AnimatedVisibility(
        visible = visible,
        enter = scaleIn() + fadeIn(),
        exit = scaleOut() + fadeOut()
    ) {
        when (size) {
            LumenFloatingActionButtonSize.Regular -> FloatingActionButton(
                onClick = onClick,
                modifier = modifier.offset { IntOffset(0, offset.roundToPx()) },
                shape = RoundedCornerShape(LumenRadius.Lg),
                containerColor = palette.background,
                contentColor = palette.foreground,
                content = content
            )
            LumenFloatingActionButtonSize.Small -> SmallFloatingActionButton(
                onClick = onClick,
                modifier = modifier.offset { IntOffset(0, offset.roundToPx()) },
                shape = RoundedCornerShape(LumenRadius.Md),
                containerColor = palette.background,
                contentColor = palette.foreground,
                content = content
            )
        }
    }
}
