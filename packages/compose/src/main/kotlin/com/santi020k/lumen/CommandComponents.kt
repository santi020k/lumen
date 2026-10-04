package com.santi020k.lumen

import androidx.compose.foundation.background
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.Modifier
import androidx.compose.ui.input.key.*
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.selected
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp

@Composable
fun LumenCommand(label: String, groups: List<LumenCommandGroup>, open: Boolean, onOpenChange: (Boolean) -> Unit,
    query: String, onQueryChange: (String) -> Unit, activeId: String?, onActiveIdChange: (String) -> Unit, onSelect: (LumenCommandItem) -> Unit,
    modifier: Modifier = Modifier, enabled: Boolean = true, readOnly: Boolean = false, autoFocus: Boolean = true, loading: Boolean = false, error: String? = null,
    searchLabel: String = "Search commands", closeLabel: String = "Close commands", previousLabel: String = "Previous command", nextLabel: String = "Next command",
    selectLabel: String = "Run highlighted command", noActiveLabel: String = "No command highlighted", emptyLabel: String = "No matching commands",
    loadingLabel: String = "Loading", invalidLabel: String = "Invalid commands", formatCount: (Int) -> String = { it.toString() },
    formatActive: (LumenCommandItem) -> String = { it.label.ifEmpty { it.id } }
) {
    if (!open) return
    val filtered = lumenCommandGroups(groups, query)
    val status = error ?: if (loading) loadingLabel else if (filtered == null) invalidLabel else null
    val locked = !enabled || readOnly || status != null
    val active = resolveLumenCommandActive(groups, query, activeId)
    val searchFocus = remember { FocusRequester() }
    LaunchedEffect(locked, autoFocus) { if (autoFocus && !locked) searchFocus.requestFocus() }
    fun navigate(direction: LumenCommandNavigation) { if (!locked) moveLumenCommandActive(groups, query, activeId, direction)?.let(onActiveIdChange) }
    fun select(id: String?) { if (!locked) resolveLumenCommandActive(groups, query, id)?.let { onActiveIdChange(it.id); onSelect(it) } }
    fun searchKey(event: KeyEvent): Boolean {
        if (event.type != KeyEventType.KeyDown) return false
        return when (event.key) {
            Key.DirectionDown -> { navigate(LumenCommandNavigation.Next); true }
            Key.DirectionUp -> { navigate(LumenCommandNavigation.Previous); true }
            Key.MoveHome -> { navigate(LumenCommandNavigation.First); true }
            Key.MoveEnd -> { navigate(LumenCommandNavigation.Last); true }
            Key.Enter, Key.NumPadEnter -> { select(activeId); true }
            else -> false
        }
    }
    Column(modifier.semantics { contentDescription = label }.onPreviewKeyEvent { event ->
        if (event.type == KeyEventType.KeyDown && event.key == Key.Escape) { onOpenChange(false); true } else false
    }, verticalArrangement = Arrangement.spacedBy(LumenSpacing.Sm)) {
        LumenText(label, modifier = Modifier.semantics { heading() })
        LumenButton(onClick = { onOpenChange(false) }, intent = LumenButtonIntent.Quiet) { LumenText(closeLabel) }
        if (status != null) LumenText(status) else if (filtered != null) {
            LumenTextField(query, { if (!locked) onQueryChange(it) }, searchLabel, enabled = !locked, modifier = Modifier.focusRequester(searchFocus).onPreviewKeyEvent(::searchKey).semantics { contentDescription = searchLabel })
            LumenText(formatCount(filtered.sumOf { it.items.size }))
            Row(horizontalArrangement = Arrangement.spacedBy(LumenSpacing.Sm)) {
                listOf(LumenCommandNavigation.Previous to previousLabel, LumenCommandNavigation.Next to nextLabel).forEach { (direction, title) ->
                    LumenButton(onClick = { navigate(direction) }, enabled = !locked && moveLumenCommandActive(groups, query, activeId, direction) != null, intent = LumenButtonIntent.Secondary) { LumenText(title) }
                }
            }
            LumenText(active?.let(formatActive) ?: noActiveLabel)
            if (filtered.isEmpty()) LumenText(emptyLabel)
            Column(Modifier.heightIn(max = 240.dp).verticalScroll(rememberScrollState())) {
                filtered.forEach { group ->
                    LumenText(group.label.ifEmpty { group.id }, modifier = Modifier.semantics { heading() })
                    group.items.forEach { item ->
                        val name = listOfNotNull(item.label.ifEmpty { item.id }, item.detail, item.shortcut).joinToString(", ")
                        LumenButton(onClick = { select(item.id) }, enabled = !locked && !item.disabled, intent = LumenButtonIntent.Quiet,
                            modifier = Modifier.fillMaxWidth().heightIn(min = 48.dp).background(if (item.id == active?.id) LocalLumenTheme.current.colors.brandSoft else LocalLumenTheme.current.colors.surface).semantics { contentDescription = name; selected = item.id == active?.id }) {
                            Column(Modifier.fillMaxWidth()) {
                                LumenText(item.label.ifEmpty { item.id })
                                item.detail?.let { LumenText(it) }; item.shortcut?.let { LumenText(it) }
                            }
                        }
                    }
                }
            }
            LumenButton(onClick = { select(activeId) }, enabled = !locked && active != null) { LumenText(selectLabel) }
        }
    }
}
