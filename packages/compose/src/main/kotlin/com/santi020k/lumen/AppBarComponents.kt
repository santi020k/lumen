package com.santi020k.lumen

import androidx.compose.foundation.layout.RowScope
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.LargeTopAppBar
import androidx.compose.material3.MediumTopAppBar
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.material3.TopAppBarScrollBehavior
import androidx.compose.runtime.Composable
import androidx.compose.runtime.Stable
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.input.nestedscroll.NestedScrollConnection
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics

/** Native scrolling policy. Attach the remembered behavior's connection to the screen container. */
enum class LumenTopAppBarScrollMode { Pinned, EnterAlways, ExitUntilCollapsed }
enum class LumenTopAppBarSize { Small, Medium, Large }

@Stable
@OptIn(ExperimentalMaterial3Api::class)
class LumenTopAppBarScrollBehavior internal constructor(internal val material: TopAppBarScrollBehavior) {
    val nestedScrollConnection: NestedScrollConnection get() = material.nestedScrollConnection
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun rememberLumenTopAppBarScrollBehavior(
    mode: LumenTopAppBarScrollMode = LumenTopAppBarScrollMode.Pinned
): LumenTopAppBarScrollBehavior {
    val material =
    when (mode) {
        LumenTopAppBarScrollMode.Pinned -> TopAppBarDefaults.pinnedScrollBehavior()
        LumenTopAppBarScrollMode.EnterAlways -> TopAppBarDefaults.enterAlwaysScrollBehavior()
        LumenTopAppBarScrollMode.ExitUntilCollapsed -> TopAppBarDefaults.exitUntilCollapsedScrollBehavior()
    }
    return remember(material) { LumenTopAppBarScrollBehavior(material) }
}

/** System-inset-aware app bar. The host owns navigation, action labels, and the screen's content insets. */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LumenTopAppBar(
    title: String,
    modifier: Modifier = Modifier,
    size: LumenTopAppBarSize = LumenTopAppBarSize.Small,
    scrollBehavior: LumenTopAppBarScrollBehavior? = null,
    navigationIcon: @Composable () -> Unit = {},
    actions: @Composable RowScope.() -> Unit = {}
) {
    val palette = LocalLumenTheme.current.colors
    val colors = TopAppBarDefaults.topAppBarColors(
        containerColor = palette.canvas,
        scrolledContainerColor = palette.surface,
        navigationIconContentColor = palette.ink,
        titleContentColor = palette.ink,
        actionIconContentColor = palette.inkSoft
    )
    val titleContent: @Composable () -> Unit = {
        LumenText(title, modifier = Modifier.semantics { heading() }, variant = LumenTextVariant.Title)
    }
    when (size) {
        LumenTopAppBarSize.Small -> TopAppBar(title = titleContent, modifier = modifier,
            navigationIcon = navigationIcon, actions = actions, colors = colors, scrollBehavior = scrollBehavior?.material)
        LumenTopAppBarSize.Medium -> MediumTopAppBar(title = titleContent, modifier = modifier,
            navigationIcon = navigationIcon, actions = actions, colors = colors, scrollBehavior = scrollBehavior?.material)
        LumenTopAppBarSize.Large -> LargeTopAppBar(title = titleContent, modifier = modifier,
            navigationIcon = navigationIcon, actions = actions, colors = colors, scrollBehavior = scrollBehavior?.material)
    }
}
