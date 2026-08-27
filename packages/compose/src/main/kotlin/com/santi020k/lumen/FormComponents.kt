package com.santi020k.lumen

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.selection.toggleable
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.DatePicker
import androidx.compose.material3.DatePickerDialog
import androidx.compose.material3.DateRangePicker
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.SelectableDates
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.rememberDatePickerState
import androidx.compose.material3.rememberDateRangePickerState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.error
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import java.text.DateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone

data class LumenSearchFieldState(val showClearAction: Boolean) {
    companion object {
        fun resolve(value: String, enabled: Boolean): LumenSearchFieldState = LumenSearchFieldState(
            showClearAction = enabled && value.isNotEmpty()
        )
    }
}

@Composable
fun LumenToggle(
    label: String,
    checked: Boolean,
    onCheckedChange: (Boolean) -> Unit,
    modifier: Modifier = Modifier,
    description: String? = null,
    showLabel: Boolean = true,
    enabled: Boolean = true
) {
    val colors = LocalLumenTheme.current.colors
    val widthModifier = if (showLabel) Modifier.fillMaxWidth() else Modifier

    Row(
        modifier = modifier
            .then(widthModifier)
            .heightIn(min = LumenButtonMetrics.resolve(LumenControlSize.Md).minHeight)
            .toggleable(
                value = checked,
                enabled = enabled,
                role = Role.Switch,
                onValueChange = onCheckedChange
            )
            .semantics(mergeDescendants = true) { contentDescription = label },
        horizontalArrangement = Arrangement.spacedBy(LumenSpacing.Lg),
        verticalAlignment = Alignment.CenterVertically
    ) {
        if (showLabel) {
            Column(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.spacedBy(LumenSpacing.Xs)
            ) {
                Text(
                    text = label,
                    color = colors.ink,
                    style = MaterialTheme.typography.labelLarge.copy(fontWeight = FontWeight.SemiBold)
                )
                if (description != null) {
                    Text(text = description, color = colors.inkMuted, style = MaterialTheme.typography.bodySmall)
                }
            }
        }
        Switch(
            checked = checked,
            onCheckedChange = null,
            modifier = Modifier.clearAndSetSemantics {},
            enabled = enabled,
            colors = SwitchDefaults.colors(
                checkedThumbColor = colors.onBrand,
                checkedTrackColor = colors.brandSolid,
                uncheckedThumbColor = colors.surface,
                uncheckedTrackColor = colors.surfaceStrong,
                uncheckedBorderColor = colors.line
            )
        )
    }
}

@Composable
fun LumenSettingsRow(
    title: String,
    modifier: Modifier = Modifier,
    description: String? = null,
    graphic: (@Composable () -> Unit)? = null,
    control: @Composable () -> Unit
) {
    val colors = LocalLumenTheme.current.colors

    Row(
        modifier = modifier
            .fillMaxWidth()
            .heightIn(min = 56.dp)
            .padding(vertical = LumenSpacing.Sm),
        horizontalArrangement = Arrangement.spacedBy(LumenSpacing.Lg),
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
        control()
    }
}

@Composable
fun LumenSearchField(
    value: String,
    onValueChange: (String) -> Unit,
    modifier: Modifier = Modifier,
    prompt: String = "Search",
    clearLabel: String = "Clear search",
    enabled: Boolean = true,
    graphic: (@Composable () -> Unit)? = null
) {
    val colors = LocalLumenTheme.current.colors
    val searchState = LumenSearchFieldState.resolve(value, enabled)
    val trailingIcon: (@Composable () -> Unit)? = if (searchState.showClearAction) {
        {
            TextButton(onClick = { onValueChange("") }) {
                Text(clearLabel, color = colors.inkSoft, style = MaterialTheme.typography.labelSmall)
            }
        }
    } else {
        null
    }

    OutlinedTextField(
        value = value,
        onValueChange = onValueChange,
        modifier = modifier
            .fillMaxWidth()
            .heightIn(min = LumenButtonMetrics.resolve(LumenControlSize.Md).minHeight),
        enabled = enabled,
        singleLine = true,
        label = { Text(prompt) },
        leadingIcon = graphic,
        trailingIcon = trailingIcon,
        shape = RoundedCornerShape(LumenRadius.Sm),
        colors = OutlinedTextFieldDefaults.colors(
            focusedContainerColor = colors.surface,
            unfocusedContainerColor = colors.surface,
            disabledContainerColor = colors.surface,
            focusedTextColor = colors.ink,
            unfocusedTextColor = colors.ink,
            focusedBorderColor = colors.brand,
            unfocusedBorderColor = colors.line,
            cursorColor = colors.brand
        )
    )
}

data class LumenDateRangeSelection(
    val startDateMillis: Long?,
    val endDateMillis: Long?
)

internal fun clampLumenDateMillis(value: Long, minDateMillis: Long?, maxDateMillis: Long?): Long =
    value.coerceIn(
        minimumValue = minDateMillis ?: Long.MIN_VALUE,
        maximumValue = maxDateMillis ?: Long.MAX_VALUE
    )

internal fun validateLumenDateBounds(minDateMillis: Long?, maxDateMillis: Long?) {
    require(minDateMillis == null || maxDateMillis == null || minDateMillis <= maxDateMillis) {
        "minDateMillis must not be greater than maxDateMillis."
    }
}

internal fun formatLumenDateMillis(value: Long?, locale: Locale = Locale.getDefault()): String? {
    if (value == null) return null

    return DateFormat.getDateInstance(DateFormat.MEDIUM, locale).run {
        timeZone = TimeZone.getTimeZone("UTC")
        format(Date(value))
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun rememberLumenSelectableDates(
    minDateMillis: Long?,
    maxDateMillis: Long?
): SelectableDates = remember(minDateMillis, maxDateMillis) {
    object : SelectableDates {
        override fun isSelectableDate(utcTimeMillis: Long): Boolean =
            (minDateMillis == null || utcTimeMillis >= minDateMillis) &&
                (maxDateMillis == null || utcTimeMillis <= maxDateMillis)
    }
}

@Composable
private fun LumenDateFieldLayout(
    label: String,
    value: String,
    onClick: () -> Unit,
    modifier: Modifier,
    description: String?,
    errorMessage: String?,
    enabled: Boolean
) {
    val colors = LocalLumenTheme.current.colors

    Column(
        modifier = modifier.semantics {
            if (errorMessage != null) error(errorMessage)
        },
        verticalArrangement = Arrangement.spacedBy(LumenSpacing.Sm)
    ) {
        Text(
            text = label,
            color = colors.ink,
            style = MaterialTheme.typography.labelLarge.copy(fontWeight = FontWeight.SemiBold)
        )
        OutlinedButton(
            onClick = onClick,
            modifier = Modifier
                .fillMaxWidth()
                .heightIn(min = LumenButtonMetrics.resolve(LumenControlSize.Md).minHeight)
                .semantics {
                    contentDescription = "$label: $value"
                    if (errorMessage != null) error(errorMessage)
                },
            enabled = enabled,
            shape = RoundedCornerShape(LumenRadius.Sm)
        ) {
            Text(value, modifier = Modifier.fillMaxWidth(), color = colors.ink)
        }
        val supportingText = errorMessage ?: description

        if (supportingText != null) {
            Text(
                text = supportingText,
                color = if (errorMessage == null) colors.inkMuted else colors.danger,
                style = MaterialTheme.typography.bodySmall
            )
        }
    }
}

/** Material-native date selection with controlled UTC milliseconds and Lumen field context. */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LumenDateField(
    label: String,
    value: Long?,
    onValueChange: (Long) -> Unit,
    modifier: Modifier = Modifier,
    minDateMillis: Long? = null,
    maxDateMillis: Long? = null,
    description: String? = null,
    errorMessage: String? = null,
    placeholder: String = "Choose a date",
    confirmLabel: String = "Confirm",
    dismissLabel: String = "Cancel",
    enabled: Boolean = true
) {
    validateLumenDateBounds(minDateMillis, maxDateMillis)

    var dialogVisible by remember { mutableStateOf(false) }
    val selectableDates = rememberLumenSelectableDates(minDateMillis, maxDateMillis)

    LaunchedEffect(enabled) {
        if (!enabled) dialogVisible = false
    }

    LumenDateFieldLayout(
        label = label,
        value = formatLumenDateMillis(value) ?: placeholder,
        onClick = { dialogVisible = true },
        modifier = modifier,
        description = description,
        errorMessage = errorMessage,
        enabled = enabled
    )

    if (dialogVisible && enabled) {
        val state = rememberDatePickerState(
            initialSelectedDateMillis = value?.let {
                clampLumenDateMillis(it, minDateMillis, maxDateMillis)
            },
            selectableDates = selectableDates
        )

        DatePickerDialog(
            onDismissRequest = { dialogVisible = false },
            confirmButton = {
                TextButton(
                    onClick = {
                        state.selectedDateMillis?.let(onValueChange)
                        dialogVisible = false
                    },
                    enabled = state.selectedDateMillis != null
                ) {
                    Text(confirmLabel)
                }
            },
            dismissButton = {
                TextButton(onClick = { dialogVisible = false }) {
                    Text(dismissLabel)
                }
            }
        ) {
            DatePicker(state = state, title = { Text(label) })
        }
    }
}

/** Material-native inclusive date-range selection with controlled UTC milliseconds. */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LumenDateRangeField(
    label: String,
    value: LumenDateRangeSelection,
    onValueChange: (LumenDateRangeSelection) -> Unit,
    modifier: Modifier = Modifier,
    minDateMillis: Long? = null,
    maxDateMillis: Long? = null,
    description: String? = null,
    errorMessage: String? = null,
    placeholder: String = "Choose a date range",
    confirmLabel: String = "Confirm",
    dismissLabel: String = "Cancel",
    enabled: Boolean = true
) {
    validateLumenDateBounds(minDateMillis, maxDateMillis)

    var dialogVisible by remember { mutableStateOf(false) }
    val selectableDates = rememberLumenSelectableDates(minDateMillis, maxDateMillis)
    val start = formatLumenDateMillis(value.startDateMillis)
    val end = formatLumenDateMillis(value.endDateMillis)
    val displayValue = if (start != null && end != null) "$start – $end" else placeholder

    LaunchedEffect(enabled) {
        if (!enabled) dialogVisible = false
    }

    LumenDateFieldLayout(
        label = label,
        value = displayValue,
        onClick = { dialogVisible = true },
        modifier = modifier,
        description = description,
        errorMessage = errorMessage,
        enabled = enabled
    )

    if (dialogVisible && enabled) {
        val initialStart = value.startDateMillis?.let {
            clampLumenDateMillis(it, minDateMillis, maxDateMillis)
        }
        val initialEnd = value.endDateMillis?.let {
            clampLumenDateMillis(it, minDateMillis, maxDateMillis)
        }?.takeIf { initialStart != null && it >= initialStart }
        val state = rememberDateRangePickerState(
            initialSelectedStartDateMillis = initialStart,
            initialSelectedEndDateMillis = initialEnd,
            selectableDates = selectableDates
        )

        DatePickerDialog(
            onDismissRequest = { dialogVisible = false },
            confirmButton = {
                TextButton(
                    onClick = {
                        onValueChange(
                            LumenDateRangeSelection(
                                startDateMillis = state.selectedStartDateMillis,
                                endDateMillis = state.selectedEndDateMillis
                            )
                        )
                        dialogVisible = false
                    },
                    enabled = state.selectedStartDateMillis != null && state.selectedEndDateMillis != null
                ) {
                    Text(confirmLabel)
                }
            },
            dismissButton = {
                TextButton(onClick = { dialogVisible = false }) {
                    Text(dismissLabel)
                }
            }
        ) {
            DateRangePicker(state = state, title = { Text(label) })
        }
    }
}
