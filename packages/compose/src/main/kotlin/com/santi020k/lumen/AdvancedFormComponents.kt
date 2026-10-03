package com.santi020k.lumen

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ExposedDropdownMenuAnchorType
import androidx.compose.material3.ExposedDropdownMenuBox
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TimeInput
import androidx.compose.material3.TimePicker
import androidx.compose.material3.rememberTimePickerState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.Immutable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.key
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalWindowInfo
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.error
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.selected
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.input.KeyboardType
import java.math.BigDecimal
import java.text.DecimalFormatSymbols
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Locale
import java.util.TimeZone

/** A local wall-clock time, independent of a date or time zone. */
@Immutable
data class LumenTimeSelection(val hour: Int, val minute: Int) {
    init {
        require(hour in 0..23) { "hour must be between 0 and 23." }
        require(minute in 0..59) { "minute must be between 0 and 59." }
    }

    internal val minutesSinceMidnight: Int get() = hour * 60 + minute
}

internal fun validateLumenTimeBounds(minTime: LumenTimeSelection?, maxTime: LumenTimeSelection?) {
    require(minTime == null || maxTime == null || minTime.minutesSinceMidnight <= maxTime.minutesSinceMidnight) {
        "minTime must not be later than maxTime; overnight ranges are application-owned."
    }
}

internal fun isLumenTimeInBounds(
    value: LumenTimeSelection,
    minTime: LumenTimeSelection?,
    maxTime: LumenTimeSelection?
): Boolean = (minTime == null || value.minutesSinceMidnight >= minTime.minutesSinceMidnight) &&
    (maxTime == null || value.minutesSinceMidnight <= maxTime.minutesSinceMidnight)

internal fun clampLumenTime(
    value: LumenTimeSelection,
    minTime: LumenTimeSelection?,
    maxTime: LumenTimeSelection?
): LumenTimeSelection {
    val minutes = value.minutesSinceMidnight.coerceIn(
        minTime?.minutesSinceMidnight ?: 0,
        maxTime?.minutesSinceMidnight ?: 1439
    )
    return LumenTimeSelection(minutes / 60, minutes % 60)
}

internal fun formatLumenTime(value: LumenTimeSelection, is24Hour: Boolean, locale: Locale): String {
    val zone = TimeZone.getTimeZone("UTC")
    val calendar = Calendar.getInstance(zone, locale).apply {
        clear()
        set(2000, Calendar.JANUARY, 1, value.hour, value.minute)
    }
    return SimpleDateFormat(if (is24Hour) "HH:mm" else "h:mm a", locale).run {
        timeZone = zone
        format(calendar.time)
    }
}

/** Controlled time selection. Cancel leaves the host value untouched. */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LumenTimeField(
    label: String,
    value: LumenTimeSelection?,
    onValueChange: (LumenTimeSelection) -> Unit,
    modifier: Modifier = Modifier,
    minTime: LumenTimeSelection? = null,
    maxTime: LumenTimeSelection? = null,
    is24Hour: Boolean? = null,
    description: String? = null,
    errorMessage: String? = null,
    placeholder: String = "Choose a time",
    confirmLabel: String = "Confirm",
    dismissLabel: String = "Cancel",
    inputLabel: String = "Use keyboard",
    dialLabel: String = "Use clock",
    rangeErrorLabel: String = "Choose a time within the allowed range",
    enabled: Boolean = true,
    readOnly: Boolean = false
) {
    validateLumenTimeBounds(minTime, maxTime)
    val compactHeight = LocalWindowInfo.current.containerSize.height / LocalDensity.current.density < 600f
    val use24Hour = is24Hour ?: android.text.format.DateFormat.is24HourFormat(LocalContext.current)
    var visible by remember { mutableStateOf(false) }
    val editable = enabled && !readOnly
    LaunchedEffect(editable) { if (!editable) visible = false }

    LumenFieldGroup(label = label, description = description.takeIf { errorMessage == null }, modifier = modifier) {
        LumenButton(
            onClick = { visible = true },
            enabled = editable,
            intent = LumenButtonIntent.Secondary,
            modifier = Modifier.fillMaxWidth().semantics {
                contentDescription = "$label: ${value?.let { formatLumenTime(it, use24Hour, Locale.getDefault()) } ?: placeholder}"
                if (errorMessage != null) error(errorMessage)
            }
        ) {
            Text(value?.let { formatLumenTime(it, use24Hour, Locale.getDefault()) } ?: placeholder)
        }
        if (errorMessage != null) LumenText(
            errorMessage,
            modifier = Modifier.semantics { error(errorMessage); liveRegion = LiveRegionMode.Polite }
        )
    }
    if (visible && editable) key(value, minTime, maxTime, use24Hour) {
        val initial = clampLumenTime(value ?: LumenTimeSelection(0, 0), minTime, maxTime)
        val state = rememberTimePickerState(initial.hour, initial.minute, use24Hour)
        var inputMode by remember { mutableStateOf(compactHeight) }
        val draft = LumenTimeSelection(state.hour, state.minute)
        val valid = isLumenTimeInBounds(draft, minTime, maxTime)
        AlertDialog(
            onDismissRequest = { visible = false },
            title = { Text(label) },
            text = {
                Column(
                    modifier = Modifier.verticalScroll(rememberScrollState()),
                    verticalArrangement = Arrangement.spacedBy(LumenSpacing.Sm)
                ) {
                    if (inputMode) TimeInput(state = state) else TimePicker(state = state)
                    TextButton(onClick = { inputMode = !inputMode }) {
                        Text(if (inputMode) dialLabel else inputLabel)
                    }
                    if (!valid) Text(
                        rangeErrorLabel,
                        color = LocalLumenTheme.current.colors.ink,
                        modifier = Modifier.semantics { error(rangeErrorLabel); liveRegion = LiveRegionMode.Polite }
                    )
                }
            },
            confirmButton = {
                LumenButton(onClick = { onValueChange(draft); visible = false }, enabled = valid) { Text(confirmLabel) }
            },
            dismissButton = { TextButton(onClick = { visible = false }) { Text(dismissLabel) } }
        )
    }
}

/** One host-provided autocomplete result. Values must be unique within the result list. */
data class LumenAutocompleteOption<T : Any>(
    val value: T,
    val label: String,
    val description: String? = null,
    val enabled: Boolean = true
)

/** Searchable selection; the application owns filtering, network requests, and selection policy. */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun <T : Any> LumenAutocomplete(
    label: String,
    query: String,
    onQueryChange: (String) -> Unit,
    options: List<LumenAutocompleteOption<T>>,
    onValueChange: (T) -> Unit,
    modifier: Modifier = Modifier,
    value: T? = null,
    description: String? = null,
    errorMessage: String? = null,
    loading: Boolean = false,
    resultsErrorMessage: String? = null,
    onRetry: (() -> Unit)? = null,
    loadingLabel: String = "Loading results",
    emptyLabel: String = "No results",
    retryLabel: String = "Retry",
    enabled: Boolean = true,
    readOnly: Boolean = false
) {
    require(options.map { it.value }.toSet().size == options.size) { "Autocomplete option values must be unique." }
    val colors = LocalLumenTheme.current.colors
    var expanded by remember { mutableStateOf(false) }
    val editable = enabled && !readOnly
    LaunchedEffect(editable) { if (!editable) expanded = false }

    ExposedDropdownMenuBox(
        expanded = expanded && editable,
        onExpandedChange = { if (editable) expanded = it },
        modifier = modifier
    ) {
        OutlinedTextField(
            value = query,
            onValueChange = { if (editable) { onQueryChange(it); expanded = true } },
            modifier = Modifier.fillMaxWidth()
                .menuAnchor(ExposedDropdownMenuAnchorType.PrimaryEditable, editable)
                .semantics { if (errorMessage != null) error(errorMessage) },
            label = { Text(label) },
            supportingText = { (errorMessage ?: description)?.let { Text(it) } },
            singleLine = true,
            enabled = enabled,
            readOnly = readOnly,
            isError = errorMessage != null,
            shape = androidx.compose.foundation.shape.RoundedCornerShape(LumenRadius.Sm),
            colors = OutlinedTextFieldDefaults.colors(
                focusedContainerColor = colors.surface,
                unfocusedContainerColor = colors.surface,
                disabledContainerColor = colors.surface,
                focusedBorderColor = colors.brand,
                unfocusedBorderColor = colors.line,
                focusedTextColor = colors.ink,
                unfocusedTextColor = colors.ink,
                cursorColor = colors.brand,
                errorContainerColor = colors.surface,
                errorTextColor = colors.ink,
                errorLabelColor = colors.ink,
                errorSupportingTextColor = colors.ink,
                errorBorderColor = colors.danger
            )
        )
        ExposedDropdownMenu(expanded = expanded && editable, onDismissRequest = { expanded = false }) {
            when {
                loading -> LumenSpinner(label = loadingLabel)
                resultsErrorMessage != null -> {
                    Text(resultsErrorMessage, modifier = Modifier.semantics { liveRegion = LiveRegionMode.Polite })
                    if (onRetry != null) DropdownMenuItem(text = { Text(retryLabel) }, onClick = onRetry)
                }
                options.isEmpty() -> Text(emptyLabel, modifier = Modifier.semantics { liveRegion = LiveRegionMode.Polite })
                else -> options.forEach { option ->
                    DropdownMenuItem(
                        text = {
                            Column {
                                Text(option.label)
                                option.description?.let { Text(it, color = colors.inkMuted) }
                            }
                        },
                        modifier = Modifier.semantics { selected = value == option.value },
                        enabled = option.enabled,
                        onClick = {
                            if (editable && option.enabled && !loading) {
                                onQueryChange(option.label)
                                onValueChange(option.value)
                                expanded = false
                            }
                        }
                    )
                }
            }
        }
    }
}

internal sealed interface LumenNumberDraft {
    data object Empty : LumenNumberDraft
    data object Incomplete : LumenNumberDraft
    data object Invalid : LumenNumberDraft
    data class Valid(val number: BigDecimal) : LumenNumberDraft
}

// Bound input before decimal construction; never interpret grouping or scientific notation.
internal fun parseLumenNumberDraft(value: String, locale: Locale): LumenNumberDraft {
    if (value.isEmpty()) return LumenNumberDraft.Empty
    if (value.length > 128) return LumenNumberDraft.Invalid
    val symbols = DecimalFormatSymbols.getInstance(locale)
    val normalized = StringBuilder(value.length)
    var decimalSeen = false
    var digits = 0
    value.forEachIndexed { index, character ->
        val digit = Character.digit(character, 10)
        when {
            digit >= 0 -> { normalized.append(digit); digits += 1 }
            index == 0 && (character == '-' || character == symbols.minusSign) -> normalized.append('-')
            character == symbols.decimalSeparator && !decimalSeen -> { normalized.append('.'); decimalSeen = true }
            else -> return LumenNumberDraft.Invalid
        }
    }
    if (digits == 0 || normalized.last() == '.') return LumenNumberDraft.Incomplete
    return try {
        LumenNumberDraft.Valid(BigDecimal(normalized.toString()))
    } catch (_: NumberFormatException) {
        LumenNumberDraft.Invalid
    }
}

internal fun validateLumenNumberBounds(min: BigDecimal?, max: BigDecimal?, step: BigDecimal) {
    require(step.signum() > 0) { "step must be positive." }
    require(min == null || max == null || min <= max) { "min must not be greater than max." }
    listOfNotNull(min, max, step).forEach {
        require(it.precision() <= 128 && it.scale() in -128..128 && it.toPlainString().length <= 128) { "Number configuration exceeds 128-digit precision or scale." }
    }
}

internal fun isLumenNumberInBounds(value: BigDecimal, min: BigDecimal?, max: BigDecimal?): Boolean =
    (min == null || value >= min) && (max == null || value <= max)

internal fun stepLumenNumber(
    draft: LumenNumberDraft,
    direction: Int,
    min: BigDecimal?,
    max: BigDecimal?,
    step: BigDecimal
): BigDecimal? {
    val start = when (draft) {
        is LumenNumberDraft.Valid -> draft.number
        LumenNumberDraft.Empty -> min ?: max?.takeIf { it.signum() < 0 } ?: BigDecimal.ZERO
        else -> return null
    }
    val result = start.add(step.multiply(BigDecimal.valueOf(direction.toLong())))
    val bounded = result.max(min ?: result).min(max ?: result)
    return bounded.takeIf { it.toPlainString().length <= 128 }
}

internal fun formatLumenNumber(value: BigDecimal, locale: Locale): String {
    val symbols = DecimalFormatSymbols.getInstance(locale)
    return buildString {
        value.stripTrailingZeros().toPlainString().forEach { character ->
            append(when (character) {
                '.' -> symbols.decimalSeparator
                '-' -> symbols.minusSign
                else -> (symbols.zeroDigit.code + (character - '0')).toChar()
            })
        }
    }
}

/** Exact decimal entry with a host-owned raw draft and localized, ungrouped display. */
@Composable
fun LumenNumberField(
    label: String,
    value: String,
    onValueChange: (String) -> Unit,
    modifier: Modifier = Modifier,
    min: BigDecimal? = null,
    max: BigDecimal? = null,
    step: BigDecimal = BigDecimal.ONE,
    locale: Locale = Locale.getDefault(),
    description: String? = null,
    errorMessage: String? = null,
    invalidNumberLabel: String = "Enter a valid number",
    outOfRangeLabel: String = "Enter a number within the allowed range",
    incrementLabel: String = "Increase value",
    decrementLabel: String = "Decrease value",
    showStepper: Boolean = true,
    enabled: Boolean = true,
    readOnly: Boolean = false
) {
    validateLumenNumberBounds(min, max, step)
    val draft = remember(value, locale) { parseLumenNumberDraft(value, locale) }
    val validationError = when (draft) {
        LumenNumberDraft.Invalid, LumenNumberDraft.Incomplete -> invalidNumberLabel
        is LumenNumberDraft.Valid -> if (isLumenNumberInBounds(draft.number, min, max)) null else outOfRangeLabel
        LumenNumberDraft.Empty -> null
    }
    val editable = enabled && !readOnly
    val colors = LocalLumenTheme.current.colors
    val message = errorMessage ?: validationError
    val decrease = stepLumenNumber(draft, -1, min, max, step)
    val increase = stepLumenNumber(draft, 1, min, max, step)
    val current = (draft as? LumenNumberDraft.Valid)?.number
    Column(modifier = modifier, verticalArrangement = Arrangement.spacedBy(LumenSpacing.Sm)) {
        OutlinedTextField(
            value = value,
            onValueChange = { if (editable) onValueChange(it) },
            modifier = Modifier.fillMaxWidth().semantics { if (message != null) error(message) },
            label = { Text(label) },
            supportingText = { (message ?: description)?.let { Text(it) } },
            enabled = enabled,
            readOnly = readOnly,
            singleLine = true,
            isError = message != null,
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
            shape = androidx.compose.foundation.shape.RoundedCornerShape(LumenRadius.Sm),
            colors = OutlinedTextFieldDefaults.colors(
                focusedContainerColor = colors.surface,
                unfocusedContainerColor = colors.surface,
                disabledContainerColor = colors.surface,
                focusedBorderColor = colors.brand,
                unfocusedBorderColor = colors.line,
                focusedTextColor = colors.ink,
                unfocusedTextColor = colors.ink,
                cursorColor = colors.brand,
                errorContainerColor = colors.surface,
                errorTextColor = colors.ink,
                errorLabelColor = colors.ink,
                errorSupportingTextColor = colors.ink,
                errorBorderColor = colors.danger
            )
        )
        if (showStepper) Row(horizontalArrangement = Arrangement.spacedBy(LumenSpacing.Sm)) {
            LumenIconButton(
                name = LumenIconName.Minus,
                size = LumenControlSize.Lg,
                contentDescription = decrementLabel,
                enabled = editable && decrease != null && (current == null || decrease.compareTo(current) != 0),
                onClick = { if (editable && decrease != null) onValueChange(formatLumenNumber(decrease, locale)) }
            )
            LumenIconButton(
                name = LumenIconName.Plus,
                size = LumenControlSize.Lg,
                contentDescription = incrementLabel,
                enabled = editable && increase != null && (current == null || increase.compareTo(current) != 0),
                onClick = { if (editable && increase != null) onValueChange(formatLumenNumber(increase, locale)) }
            )
        }
    }
}
