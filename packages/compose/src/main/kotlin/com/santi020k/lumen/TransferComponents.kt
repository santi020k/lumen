package com.santi020k.lumen

import androidx.compose.foundation.border
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp

@Composable
fun LumenTransfer(label: String, items: List<LumenTransferItem>, value: LumenTransferValue, onValueChange: (LumenTransferValue) -> Unit,
    modifier: Modifier = Modifier, enabled: Boolean = true, readOnly: Boolean = false, loading: Boolean = false, error: String? = null,
    sourceTitle: String = "Available", targetTitle: String = "Selected", moveToTargetLabel: String = "Move to selected", moveToSourceLabel: String = "Move to available",
    emptyLabel: String = "No items", loadingLabel: String = "Loading", invalidLabel: String = "Invalid transfer", formatCount: (Int) -> String = { it.toString() }
) {
    val lists = lumenTransferLists(items, value)
    val status = error ?: if (loading) loadingLabel else if (lists == null) invalidLabel else null
    val locked = !enabled || readOnly || status != null
    Column(modifier.semantics { contentDescription = label }, verticalArrangement = Arrangement.spacedBy(LumenSpacing.Sm)) {
        LumenText(label, modifier = Modifier.semantics { heading() })
        if (status != null) LumenText(status) else if (lists != null) {
            TransferPanel(sourceTitle, lists.source, value, locked, emptyLabel, formatCount) { item, checked ->
                if (!locked) toggleLumenTransferItem(items, value, item.id, checked)?.let(onValueChange)
            }
            TransferPanel(targetTitle, lists.target, value, locked, emptyLabel, formatCount) { item, checked ->
                if (!locked) toggleLumenTransferItem(items, value, item.id, checked)?.let(onValueChange)
            }
            Column(verticalArrangement = Arrangement.spacedBy(LumenSpacing.Sm)) {
                listOf(LumenTransferSide.Target to moveToTargetLabel, LumenTransferSide.Source to moveToSourceLabel).forEach { (side, title) ->
                    LumenButton(onClick = { if (!locked) moveLumenTransferItems(items, value, side)?.let(onValueChange) }, enabled = !locked && moveLumenTransferItems(items, value, side) != null,
                        intent = LumenButtonIntent.Secondary, modifier = Modifier.heightIn(min = 48.dp).semantics { contentDescription = title }) { LumenText(title) }
                }
            }
        }
    }
}
@Composable
private fun TransferPanel(title: String, items: List<LumenTransferItem>, value: LumenTransferValue, locked: Boolean,
    emptyLabel: String, formatCount: (Int) -> String, onCheck: (LumenTransferItem, Boolean) -> Unit) {
    Column(Modifier.fillMaxWidth().border(1.dp, LocalLumenTheme.current.colors.line, RoundedCornerShape(LumenRadius.Sm)).padding(LumenSpacing.Sm)) {
        LumenText(title, modifier = Modifier.semantics { heading() })
        LumenText(formatCount(items.size))
        if (items.isEmpty()) LumenText(emptyLabel) else {
            Column(Modifier.heightIn(max = 240.dp).verticalScroll(rememberScrollState())) {
                items.forEach { item ->
                    val name = item.label.ifEmpty { item.id }
                    LumenCheckbox(name, item.id in value.checkedIds, { checked -> if (!locked && !item.disabled) onCheck(item, checked) },
                        description = item.detail, enabled = !locked && !item.disabled, modifier = Modifier.heightIn(min = 48.dp).semantics { contentDescription = listOfNotNull(name, item.detail).joinToString(", ") })
                }
            }
        }
    }
}
