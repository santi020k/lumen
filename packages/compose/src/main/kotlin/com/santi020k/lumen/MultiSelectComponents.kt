package com.santi020k.lumen

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.error
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp

internal fun validateLumenMultiSelectOptions(options: List<LumenSelectionOption>) {
    require(options.all { it.value.isNotBlank() && it.label.isNotBlank() }) { "Options need non-empty values and labels." }
    require(options.map { it.value }.toSet().size == options.size) { "Option values must be unique." }
}

internal fun toggleLumenMultiSelection(values: Set<String>, value: String): Set<String> =
    if (value in values) values - value else values + value

/**
 * Immediate controlled selection, with caller-owned search and results. Closing does not roll back edits.
 * Unknown selected values stay visible and removable while filtered or asynchronously loaded options change.
 */
@Composable
fun LumenMultiSelect(
    label: String,
    options: List<LumenSelectionOption>,
    values: Set<String>,
    onValuesChange: (Set<String>) -> Unit,
    query: String,
    onQueryChange: (String) -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    readOnly: Boolean = false,
    description: String? = null,
    errorMessage: String? = null,
    loading: Boolean = false,
    resultsErrorMessage: String? = null,
    onRetry: (() -> Unit)? = null,
    chooseLabel: String = "Choose options",
    searchLabel: String = "Search options",
    clearSearchLabel: String = "Clear search",
    doneLabel: String = "Done",
    emptyLabel: String = "No matching options",
    loadingLabel: String = "Loading options",
    retryLabel: String = "Retry",
    selectionLabel: (Int) -> String = { "$it selected" },
    removeLabel: (String) -> String = { "Remove $it" }
) {
    validateLumenMultiSelectOptions(options)
    var open by rememberSaveable { mutableStateOf(false) }
    LaunchedEffect(enabled, readOnly) { if (!enabled || readOnly) open = false }
    val editable = enabled && !readOnly
    val optionsByValue = options.associateBy { it.value }
    Column(modifier.fillMaxWidth().semantics { if (errorMessage != null) error(errorMessage) },
        verticalArrangement = Arrangement.spacedBy(LumenSpacing.Sm)) {
        LumenText(label, variant = LumenTextVariant.Label)
        if (description != null) LumenText(description, tone = LumenTextTone.Muted)
        LumenButton(onClick = { open = true }, enabled = editable, intent = LumenButtonIntent.Secondary) {
            Text("$chooseLabel · ${selectionLabel(values.size)}")
        }
        FlowRow(horizontalArrangement = Arrangement.spacedBy(LumenSpacing.Sm), verticalArrangement = Arrangement.spacedBy(LumenSpacing.Sm)) {
            values.forEach { value ->
                val option = optionsByValue[value]
                val text = option?.label ?: value
                LumenChip(label = text, selected = true, enabled = editable && option?.enabled != false,
                    removeLabel = removeLabel(text),
                    onRemove = if (editable && option?.enabled != false) {
                        { onValuesChange(values - value) }
                    } else null)
            }
        }
        if (errorMessage != null) LumenText(errorMessage, tone = LumenTextTone.Danger, modifier = Modifier.semantics { liveRegion = LiveRegionMode.Polite })
    }
    if (open && editable) AlertDialog(
        onDismissRequest = { open = false },
        title = { LumenText(label, variant = LumenTextVariant.Title) },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(LumenSpacing.Sm)) {
                LumenSearchField(query, onQueryChange, prompt = searchLabel, clearLabel = clearSearchLabel)
                when {
                    loading -> LumenSpinner(label = loadingLabel)
                    resultsErrorMessage != null -> {
                        LumenText(resultsErrorMessage, modifier = Modifier.semantics { liveRegion = LiveRegionMode.Polite })
                        if (onRetry != null) LumenButton(onClick = onRetry) { Text(retryLabel) }
                    }
                    options.isEmpty() -> LumenText(emptyLabel, modifier = Modifier.semantics { liveRegion = LiveRegionMode.Polite })
                    else -> LazyColumn(Modifier.heightIn(max = 280.dp)) {
                        items(options, key = { it.value }) { option ->
                            LumenCheckbox(option.label, option.value in values,
                                onCheckedChange = { onValuesChange(toggleLumenMultiSelection(values, option.value)) },
                                enabled = option.enabled, description = option.description)
                        }
                    }
                }
            }
        },
        confirmButton = { LumenButton(onClick = { open = false }) { Text(doneLabel) } }
    )
}
