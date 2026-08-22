package com.santi020k.lumen

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.selection.toggleable
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp

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
