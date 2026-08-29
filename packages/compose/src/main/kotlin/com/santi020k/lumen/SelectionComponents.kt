package com.santi020k.lumen

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.selection.selectableGroup
import androidx.compose.foundation.selection.toggleable
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Checkbox
import androidx.compose.material3.CheckboxDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.RadioButton
import androidx.compose.material3.RadioButtonDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.Immutable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp

@Immutable
data class LumenSelectionOption(
    val value: String,
    val label: String,
    val description: String? = null,
    val enabled: Boolean = true
)

@Composable
fun LumenCheckbox(
    label: String,
    checked: Boolean,
    onCheckedChange: (Boolean) -> Unit,
    modifier: Modifier = Modifier,
    description: String? = null,
    enabled: Boolean = true
) {
    val colors = LocalLumenTheme.current.colors

    Row(
        modifier = modifier
            .fillMaxWidth()
            .heightIn(min = LumenButtonMetrics.resolve(LumenControlSize.Md).minHeight)
            .toggleable(
                value = checked,
                enabled = enabled,
                role = Role.Checkbox,
                onValueChange = onCheckedChange
            )
            .semantics(mergeDescendants = true) { contentDescription = label }
            .padding(vertical = LumenSpacing.Sm),
        horizontalArrangement = Arrangement.spacedBy(LumenSpacing.Md),
        verticalAlignment = Alignment.Top
    ) {
        Checkbox(
            checked = checked,
            onCheckedChange = null,
            modifier = Modifier.clearAndSetSemantics {},
            enabled = enabled,
            colors = CheckboxDefaults.colors(
                checkedColor = colors.brandSolid,
                uncheckedColor = colors.line,
                checkmarkColor = colors.onBrand,
                disabledCheckedColor = colors.brandSolid.copy(alpha = 0.52f),
                disabledUncheckedColor = colors.line.copy(alpha = 0.52f)
            )
        )
        Column(
            modifier = Modifier.weight(1f).padding(top = 2.dp),
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
}

@Composable
fun LumenRadioGroup(
    label: String,
    options: List<LumenSelectionOption>,
    value: String,
    onValueChange: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    val colors = LocalLumenTheme.current.colors

    Column(
        modifier = modifier
            .fillMaxWidth()
            .selectableGroup()
            .semantics { contentDescription = label },
        verticalArrangement = Arrangement.spacedBy(LumenSpacing.Sm)
    ) {
        Text(
            text = label,
            color = colors.ink,
            style = MaterialTheme.typography.labelLarge.copy(fontWeight = FontWeight.SemiBold)
        )
        options.forEach { option ->
            val selected = value == option.value

            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .heightIn(min = LumenButtonMetrics.resolve(LumenControlSize.Md).minHeight)
                    .selectable(
                        selected = selected,
                        enabled = option.enabled,
                        role = Role.RadioButton,
                        onClick = { onValueChange(option.value) }
                    )
                    .padding(vertical = LumenSpacing.Sm),
                horizontalArrangement = Arrangement.spacedBy(LumenSpacing.Md),
                verticalAlignment = Alignment.Top
            ) {
                RadioButton(
                    selected = selected,
                    onClick = null,
                    modifier = Modifier.clearAndSetSemantics {},
                    enabled = option.enabled,
                    colors = RadioButtonDefaults.colors(
                        selectedColor = colors.brandSolid,
                        unselectedColor = colors.line,
                        disabledSelectedColor = colors.brandSolid.copy(alpha = 0.52f),
                        disabledUnselectedColor = colors.line.copy(alpha = 0.52f)
                    )
                )
                Column(
                    modifier = Modifier.weight(1f).padding(top = 2.dp),
                    verticalArrangement = Arrangement.spacedBy(LumenSpacing.Xs)
                ) {
                    Text(text = option.label, color = colors.ink, style = MaterialTheme.typography.bodyMedium)
                    if (option.description != null) {
                        Text(
                            text = option.description,
                            color = colors.inkMuted,
                            style = MaterialTheme.typography.bodySmall
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun LumenSegmentedControl(
    label: String,
    options: List<LumenSelectionOption>,
    value: String,
    onValueChange: (String) -> Unit,
    modifier: Modifier = Modifier,
    showLabel: Boolean = true
) {
    val colors = LocalLumenTheme.current.colors

    Column(
        modifier = modifier.fillMaxWidth(),
        verticalArrangement = Arrangement.spacedBy(LumenSpacing.Sm)
    ) {
        if (showLabel) {
            Text(
                text = label,
                color = colors.ink,
                style = MaterialTheme.typography.labelLarge.copy(fontWeight = FontWeight.SemiBold)
            )
        }
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(LumenRadius.Sm))
                .background(colors.surfaceMuted)
                .border(1.dp, colors.line, RoundedCornerShape(LumenRadius.Sm))
                .padding(2.dp)
                .selectableGroup()
                .semantics { contentDescription = label },
            verticalAlignment = Alignment.CenterVertically
        ) {
            options.forEach { option ->
                val selected = value == option.value

                Box(
                    modifier = Modifier
                        .weight(1f)
                        .heightIn(min = 40.dp)
                        .clip(RoundedCornerShape(LumenRadius.Sm))
                        .background(if (selected) colors.surface else androidx.compose.ui.graphics.Color.Transparent)
                        .selectable(
                            selected = selected,
                            enabled = option.enabled,
                            role = Role.RadioButton,
                            onClick = { onValueChange(option.value) }
                        )
                        .padding(horizontal = LumenSpacing.Sm, vertical = LumenSpacing.Sm),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = option.label,
                        color = if (selected) colors.brand else colors.inkSoft,
                        fontWeight = if (selected) FontWeight.Bold else FontWeight.SemiBold,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                        style = MaterialTheme.typography.labelSmall
                    )
                }
            }
        }
    }
}

@Composable
fun LumenTabs(
    label: String,
    options: List<LumenSelectionOption>,
    value: String,
    onValueChange: (String) -> Unit,
    modifier: Modifier = Modifier,
    content: @Composable (String) -> Unit
) {
    val colors = LocalLumenTheme.current.colors
    val selectedLabel = options.firstOrNull { it.value == value }?.label ?: value
    val selectedIndex = options.indexOfFirst { it.value == value }
    val tabListState = rememberLazyListState()

    LaunchedEffect(selectedIndex) {
        if (selectedIndex >= 0) tabListState.animateScrollToItem(selectedIndex)
    }

    Column(
        modifier = modifier.fillMaxWidth(),
        verticalArrangement = Arrangement.spacedBy(LumenSpacing.Md)
    ) {
        LazyRow(
            modifier = Modifier
                .fillMaxWidth()
                .drawBehind {
                    drawLine(
                        color = colors.line,
                        start = androidx.compose.ui.geometry.Offset(0f, size.height),
                        end = androidx.compose.ui.geometry.Offset(size.width, size.height),
                        strokeWidth = 1.dp.toPx()
                    )
                }
                .selectableGroup()
                .semantics { contentDescription = label },
            horizontalArrangement = Arrangement.spacedBy(LumenSpacing.Xs),
            state = tabListState,
            verticalAlignment = Alignment.CenterVertically
        ) {
            itemsIndexed(options, key = { _, option -> option.value }) { _, option ->
                val selected = option.value == value

                Box(
                    modifier = Modifier
                        .heightIn(min = 44.dp)
                        .drawBehind {
                            if (selected) {
                                drawLine(
                                    color = colors.brandSolid,
                                    start = androidx.compose.ui.geometry.Offset(0f, size.height),
                                    end = androidx.compose.ui.geometry.Offset(size.width, size.height),
                                    strokeWidth = 2.dp.toPx()
                                )
                            }
                        }
                        .selectable(
                            selected = selected,
                            enabled = option.enabled,
                            role = Role.Tab,
                            onClick = { onValueChange(option.value) }
                        )
                        .padding(horizontal = LumenSpacing.Md, vertical = LumenSpacing.Sm),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = option.label,
                        color = if (selected) colors.brand else colors.inkSoft,
                        fontWeight = if (selected) FontWeight.Bold else FontWeight.SemiBold,
                        style = MaterialTheme.typography.labelLarge
                    )
                }
            }
        }
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .semantics { contentDescription = "$selectedLabel tab panel" }
        ) {
            content(value)
        }
    }
}
