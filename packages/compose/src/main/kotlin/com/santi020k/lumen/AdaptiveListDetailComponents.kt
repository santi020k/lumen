package com.santi020k.lumen

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.adaptive.ExperimentalMaterial3AdaptiveApi
import androidx.compose.material3.adaptive.currentWindowAdaptiveInfo
import androidx.compose.material3.adaptive.layout.ListDetailPaneScaffold
import androidx.compose.material3.adaptive.layout.ListDetailPaneScaffoldDefaults
import androidx.compose.material3.adaptive.layout.ListDetailPaneScaffoldRole
import androidx.compose.material3.adaptive.layout.PaneAdaptedValue
import androidx.compose.material3.adaptive.layout.ThreePaneScaffoldDestinationItem
import androidx.compose.material3.adaptive.layout.calculatePaneScaffoldDirective
import androidx.compose.material3.adaptive.layout.calculateThreePaneScaffoldValue
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.paneTitle
import androidx.compose.ui.semantics.semantics

/**
 * Full-window Material list/detail layout, respecting window size and separating hinges.
 * Selection, back handling, data loading, and scroll containers belong to the host. The detail slot
 * receives whether its pane is alone, so the host can enable its system BackHandler consistently.
 */
@OptIn(ExperimentalMaterial3AdaptiveApi::class)
@Composable
fun LumenAdaptiveListDetailScaffold(
    selectedKey: String?,
    onBack: () -> Unit,
    listLabel: String,
    detailLabel: String,
    modifier: Modifier = Modifier,
    backLabel: String = "Back",
    listPane: @Composable () -> Unit,
    emptyDetail: @Composable () -> Unit,
    detailPane: @Composable (String, Boolean) -> Unit
) {
    val directive = calculatePaneScaffoldDirective(currentWindowAdaptiveInfo())
    val role = if (selectedKey == null) ListDetailPaneScaffoldRole.List else ListDetailPaneScaffoldRole.Detail
    val value = calculateThreePaneScaffoldValue(directive.maxHorizontalPartitions,
        ListDetailPaneScaffoldDefaults.adaptStrategies(), ThreePaneScaffoldDestinationItem(role, selectedKey),
        directive.maxVerticalPartitions)
    val detailOnly = value[ListDetailPaneScaffoldRole.List] != PaneAdaptedValue.Expanded
    ListDetailPaneScaffold(directive = directive, value = value, modifier = modifier,
        listPane = { Box(Modifier.fillMaxSize().semantics { paneTitle = listLabel }) { listPane() } },
        detailPane = {
            Column(Modifier.fillMaxSize().semantics { paneTitle = detailLabel }) {
                if (selectedKey == null) emptyDetail() else {
                    if (detailOnly) LumenButton(onClick = onBack, intent = LumenButtonIntent.Quiet) { Text(backLabel) }
                    Box(Modifier.weight(1f)) { detailPane(selectedKey, detailOnly) }
                }
            }
        })
}
