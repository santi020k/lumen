package com.santi020k.lumen

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxScope
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.material3.pulltorefresh.PullToRefreshDefaults
import androidx.compose.material3.pulltorefresh.rememberPullToRefreshState
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.CustomAccessibilityAction
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.customActions
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.stateDescription

/** Native refresh gestures and an accessible action; requests remain application-owned. */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LumenPullToRefresh(
    isRefreshing: Boolean,
    onRefresh: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    refreshLabel: String = "Refresh",
    refreshingLabel: String = "Refreshing",
    content: @Composable BoxScope.() -> Unit
) {
    val canRefresh = enabled && !isRefreshing
    val semantics = modifier.semantics {
        if (isRefreshing) {
            stateDescription = refreshingLabel
            liveRegion = LiveRegionMode.Polite
        }
        if (canRefresh) customActions = listOf(CustomAccessibilityAction(refreshLabel) { onRefresh(); true })
    }
    val colors = LocalLumenTheme.current.colors
    if (enabled) {
        val state = rememberPullToRefreshState()
        PullToRefreshBox(
            isRefreshing = isRefreshing,
            onRefresh = { if (canRefresh) onRefresh() },
            modifier = semantics,
            state = state,
            indicator = {
                PullToRefreshDefaults.Indicator(
                    modifier = Modifier.align(Alignment.TopCenter),
                    isRefreshing = isRefreshing,
                    state = state,
                    containerColor = colors.surface,
                    color = colors.brand
                )
            },
            content = content
        )
    } else {
        Box(modifier = semantics) {
            content()
            if (isRefreshing) LumenSpinner(
                modifier = Modifier.align(Alignment.TopCenter).padding(LumenSpacing.Sm),
                label = refreshingLabel
            )
        }
    }
}
