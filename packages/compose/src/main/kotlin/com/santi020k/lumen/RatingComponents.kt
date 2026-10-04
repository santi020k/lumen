package com.santi020k.lumen

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.sizeIn
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.selection.selectableGroup
import androidx.compose.runtime.Composable
import androidx.compose.runtime.Immutable
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp

@Immutable
data class LumenRatingModel(val maximum: Int = 5) {
    val resolvedMaximum: Int get() = maximum.coerceIn(1, 100)
    fun resolved(value: Int): Int = value.coerceIn(0, resolvedMaximum)
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun LumenRating(
    label: String,
    value: Int,
    onValueChange: (Int) -> Unit,
    modifier: Modifier = Modifier,
    maximum: Int = 5,
    enabled: Boolean = true,
    readOnly: Boolean = false,
    formatOption: (Int, Int) -> String = { rating, total -> "$rating / $total" }
) {
    val model = LumenRatingModel(maximum)
    val colors = LocalLumenTheme.current.colors
    Column(modifier, verticalArrangement = Arrangement.spacedBy(LumenSpacing.Xs)) {
        LumenText(label)
        FlowRow(
            modifier = Modifier.selectableGroup().semantics { contentDescription = label },
            horizontalArrangement = Arrangement.spacedBy(LumenSpacing.Xs)
        ) {
            for (option in 1..model.resolvedMaximum) {
                androidx.compose.foundation.layout.Box(
                    modifier = Modifier.sizeIn(minWidth = 44.dp, minHeight = 44.dp)
                        .selectable(selected = option == model.resolved(value),
                            enabled = enabled && !readOnly, role = Role.RadioButton,
                            onClick = { if (enabled && !readOnly) onValueChange(option) })
                        .semantics { contentDescription = formatOption(option, model.resolvedMaximum) },
                    contentAlignment = androidx.compose.ui.Alignment.Center
                ) {
                    LumenIcon(name = LumenIconName.Star,
                        tint = if (option <= model.resolved(value)) colors.brandSolid else colors.inkMuted)
                }
            }
        }
    }
}
