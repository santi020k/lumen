package com.santi020k.lumen

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Slider
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.error
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.progressBarRangeInfo
import androidx.compose.ui.semantics.ProgressBarRangeInfo
import androidx.compose.ui.semantics.selected
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp

enum class LumenButtonGroupOrientation {
    Horizontal,
    Vertical
}

@Composable
fun LumenButtonGroup(
    modifier: Modifier = Modifier,
    orientation: LumenButtonGroupOrientation = LumenButtonGroupOrientation.Horizontal,
    content: @Composable () -> Unit
) {
    if (orientation == LumenButtonGroupOrientation.Horizontal) {
        Row(
            modifier = modifier,
            horizontalArrangement = Arrangement.spacedBy(LumenSpacing.Sm),
            verticalAlignment = Alignment.CenterVertically
        ) { content() }
    } else {
        Column(modifier = modifier, verticalArrangement = Arrangement.spacedBy(LumenSpacing.Sm)) {
            content()
        }
    }
}

@Composable
fun LumenFieldGroup(
    label: String,
    modifier: Modifier = Modifier,
    description: String? = null,
    errorMessage: String? = null,
    required: Boolean = false,
    content: @Composable () -> Unit
) {
    val colors = LocalLumenTheme.current.colors

    Column(modifier = modifier, verticalArrangement = Arrangement.spacedBy(LumenSpacing.Sm)) {
        Text(
            text = if (required) "$label *" else label,
            modifier = if (required) {
                Modifier.semantics { contentDescription = "$label, required" }
            } else {
                Modifier
            },
            color = colors.ink,
            style = MaterialTheme.typography.labelLarge.copy(fontWeight = FontWeight.SemiBold)
        )
        if (description != null) {
            Text(description, color = colors.inkMuted, style = MaterialTheme.typography.bodySmall)
        }
        content()
        if (errorMessage != null) {
            Text(
                errorMessage,
                modifier = Modifier.semantics {
                    error(errorMessage)
                    liveRegion = LiveRegionMode.Polite
                },
                color = colors.danger,
                style = MaterialTheme.typography.bodySmall
            )
        }
    }
}

@Composable
fun LumenTextarea(
    value: String,
    onValueChange: (String) -> Unit,
    label: String,
    modifier: Modifier = Modifier,
    description: String? = null,
    errorMessage: String? = null,
    enabled: Boolean = true,
    minLines: Int = 4
) {
    val colors = LocalLumenTheme.current.colors

    OutlinedTextField(
        value = value,
        onValueChange = onValueChange,
        modifier = modifier
            .fillMaxWidth()
            .semantics {
                if (errorMessage != null) error(errorMessage)
            },
        enabled = enabled,
        isError = errorMessage != null,
        minLines = minLines.coerceAtLeast(2),
        label = { Text(label) },
        supportingText = {
            val message = errorMessage ?: description
            if (message != null) Text(message)
        },
        shape = RoundedCornerShape(LumenRadius.Sm),
        colors = OutlinedTextFieldDefaults.colors(
            focusedContainerColor = colors.surface,
            unfocusedContainerColor = colors.surface,
            disabledContainerColor = colors.surface,
            focusedTextColor = colors.ink,
            unfocusedTextColor = colors.ink,
            focusedBorderColor = colors.brand,
            unfocusedBorderColor = colors.line,
            errorBorderColor = colors.danger,
            cursorColor = colors.brand
        )
    )
}

@Composable
fun LumenChip(
    label: String,
    modifier: Modifier = Modifier,
    selected: Boolean = false,
    enabled: Boolean = true,
    removeLabel: String = "Remove $label",
    onClick: (() -> Unit)? = null,
    onRemove: (() -> Unit)? = null
) {
    val colors = LocalLumenTheme.current.colors
    val interactionModifier = if (onClick != null) {
        Modifier.clickable(enabled = enabled, role = Role.Button, onClick = onClick)
    } else {
        Modifier
    }

    Surface(
        modifier = modifier
            .then(interactionModifier)
            .semantics { this.selected = selected },
        color = if (selected) colors.brandSoft else colors.surfaceMuted,
        contentColor = if (selected) colors.brand else colors.inkSoft,
        shape = RoundedCornerShape(LumenRadius.Full),
        border = BorderStroke(1.dp, if (selected) colors.brand else colors.line)
    ) {
        Row(
            modifier = Modifier
                .heightIn(min = 32.dp)
                .padding(horizontal = LumenSpacing.Md),
            horizontalArrangement = Arrangement.spacedBy(LumenSpacing.Xs),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(label, style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.SemiBold))
            if (onRemove != null) {
                TextButton(enabled = enabled, onClick = onRemove) {
                    Text("×", modifier = Modifier.semantics { contentDescription = removeLabel })
                }
            }
        }
    }
}

@Composable
fun LumenToast(
    title: String,
    modifier: Modifier = Modifier,
    description: String? = null,
    variant: LumenBannerVariant = LumenBannerVariant.Default,
    dismissLabel: String = "Dismiss",
    onDismiss: (() -> Unit)? = null,
    action: (@Composable RowScope.() -> Unit)? = null
) {
    val colors = LocalLumenTheme.current.colors
    val palette = lumenBannerPalette(colors, variant)

    Surface(
        modifier = modifier.semantics { liveRegion = LiveRegionMode.Polite },
        color = palette.background,
        contentColor = colors.ink,
        shape = RoundedCornerShape(LumenRadius.Md),
        border = BorderStroke(1.dp, palette.border)
    ) {
        Row(
            modifier = Modifier.padding(horizontal = LumenSpacing.Lg, vertical = LumenSpacing.Md),
            horizontalArrangement = Arrangement.spacedBy(LumenSpacing.Md),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.spacedBy(LumenSpacing.Xs)
            ) {
                Text(
                    title,
                    color = palette.accent,
                    style = MaterialTheme.typography.labelLarge.copy(fontWeight = FontWeight.SemiBold)
                )
                if (description != null) {
                    Text(description, color = colors.inkSoft, style = MaterialTheme.typography.bodySmall)
                }
            }
            action?.invoke(this)
            if (onDismiss != null) {
                TextButton(onClick = onDismiss) { Text(dismissLabel, color = palette.accent) }
            }
        }
    }
}

data class LumenPickerOption<T>(
    val value: T,
    val label: String,
    val enabled: Boolean = true
)

@Composable
fun <T> LumenPicker(
    label: String,
    value: T,
    options: List<LumenPickerOption<T>>,
    onValueChange: (T) -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true
) {
    var expanded by remember { mutableStateOf(false) }
    val selectedLabel = options.firstOrNull { it.value == value }?.label ?: value.toString()

    Box(modifier = modifier) {
        Button(
            onClick = { expanded = true },
            enabled = enabled,
            modifier = Modifier.semantics {
                contentDescription = label
                stateDescription = selectedLabel
            }
        ) {
            Text(selectedLabel)
        }
        DropdownMenu(expanded = expanded, onDismissRequest = { expanded = false }) {
            options.forEach { option ->
                DropdownMenuItem(
                    text = { Text(option.label) },
                    enabled = option.enabled,
                    onClick = {
                        onValueChange(option.value)
                        expanded = false
                    }
                )
            }
        }
    }
}

@Composable
fun LumenSlider(
    label: String,
    value: Float,
    onValueChange: (Float) -> Unit,
    modifier: Modifier = Modifier,
    valueRange: ClosedFloatingPointRange<Float> = 0f..1f,
    steps: Int = 0,
    valueLabel: String = value.toString(),
    enabled: Boolean = true
) {
    Column(modifier = modifier, verticalArrangement = Arrangement.spacedBy(LumenSpacing.Xs)) {
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            Text(label)
            Text(valueLabel, color = LocalLumenTheme.current.colors.inkMuted)
        }
        Slider(
            value = value.coerceIn(valueRange.start, valueRange.endInclusive),
            onValueChange = onValueChange,
            enabled = enabled,
            valueRange = valueRange,
            steps = steps.coerceAtLeast(0),
            modifier = Modifier.semantics { stateDescription = valueLabel }
        )
    }
}

@Composable
fun LumenGauge(
    label: String,
    value: Float,
    modifier: Modifier = Modifier,
    max: Float = 100f,
    valueLabel: String = value.toString(),
    tone: LumenMetricTone = LumenMetricTone.Brand,
    center: (@Composable () -> Unit)? = null
) {
    val progress = LumenProgressValue.resolve(value, max)
    val colors = LocalLumenTheme.current.colors

    Box(
        modifier = modifier
            .size(72.dp)
            .semantics {
                contentDescription = label
                progressBarRangeInfo = ProgressBarRangeInfo(
                    current = progress.value,
                    range = 0f..progress.max,
                    steps = 0
                )
                stateDescription = valueLabel
            },
        contentAlignment = Alignment.Center
    ) {
        CircularProgressIndicator(
            progress = { progress.value / progress.max },
            modifier = Modifier.size(72.dp),
            color = lumenMetricColor(colors, tone),
            trackColor = colors.surfaceStrong
        )
        if (center != null) center() else Text(valueLabel, style = MaterialTheme.typography.labelSmall)
    }
}
