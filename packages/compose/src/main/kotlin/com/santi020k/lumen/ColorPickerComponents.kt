package com.santi020k.lumen

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp

data class LumenColorPickerLabels(
    val field: String = "Hex or RGBA color", val hue: String = "Hue", val saturation: String = "Saturation",
    val brightness: String = "Brightness", val alpha: String = "Opacity", val invalid: String = "Enter a valid color",
    val preview: String = "Selected color"
)
private fun LumenRGBA.composeColor() = Color(red / 255f, green / 255f, blue / 255f, alpha.toFloat())

@Composable
fun LumenColorPicker(
    label: String, value: String, onValueChange: (String) -> Unit, modifier: Modifier = Modifier,
    allowAlpha: Boolean = false, disabled: Boolean = false, readOnly: Boolean = false,
    palette: List<LumenColorSwatch> = emptyList(), labels: LumenColorPickerLabels = LumenColorPickerLabels()
) {
    val theme = LocalLumenTheme.current
    val parsed = parseLumenColor(value)
    val source = parsed?.let { formatLumenColor(it, allowAlpha) }
    val rgba = if (source == null) null else parsed
    val actual = rgba?.let(::lumenRGBAToHSVA)
    var draft by remember(value, allowAlpha) { mutableStateOf(value) }
    var selection by remember { mutableStateOf<LumenHSVA?>(null) }
    var selectionSource by remember { mutableStateOf<String?>(null) }
    LaunchedEffect(value, allowAlpha) {
        if (selectionSource != source) { selection = null; selectionSource = null }
    }
    val hsva = if (selectionSource == source) selection ?: actual else actual
    val enabled = !disabled && !readOnly
    val invalid = parseLumenColor(draft)?.let { formatLumenColor(it, allowAlpha) } == null
    fun publish(next: String) { if (enabled) { draft = next; onValueChange(next) } }
    fun change(candidate: LumenHSVA) {
        if (!enabled) return
        val encoded = lumenHSVAToRGBA(candidate)?.let { formatLumenColor(it, allowAlpha) } ?: return
        selection = candidate; selectionSource = encoded; publish(encoded)
    }
    Column(modifier, verticalArrangement = Arrangement.spacedBy(LumenSpacing.Sm)) {
        LumenText(label)
        if (rgba != null) Box(Modifier.size(64.dp, 44.dp).background(rgba.composeColor(), RoundedCornerShape(LumenRadius.Sm))
            .border(1.dp, theme.colors.line, RoundedCornerShape(LumenRadius.Sm))
            .semantics { contentDescription = "${labels.preview}: $value" })
        LumenTextField(draft, { next ->
            if (enabled) {
                draft = next
                parseLumenColor(next)?.let { formatLumenColor(it, allowAlpha) }?.let { encoded ->
                    selection = null; selectionSource = null; onValueChange(encoded)
                }
            }
        }, label = labels.field, error = invalid, errorMessage = if (invalid) labels.invalid else null, enabled = enabled)
        if (hsva != null) {
            LumenSlider(labels.hue, hsva.hue.toFloat(), { change(hsva.copy(hue = it.toDouble())) },
                valueRange = 0f..360f, valueLabel = "${hsva.hue.toInt()}°", enabled = enabled, modifier = Modifier.heightIn(min = 44.dp).semantics { contentDescription = labels.hue })
            LumenSlider(labels.saturation, hsva.saturation.toFloat(), { change(hsva.copy(saturation = it.toDouble())) },
                valueLabel = "${(hsva.saturation * 100).toInt()}%", enabled = enabled, modifier = Modifier.heightIn(min = 44.dp).semantics { contentDescription = labels.saturation })
            LumenSlider(labels.brightness, hsva.value.toFloat(), { change(hsva.copy(value = it.toDouble())) },
                valueLabel = "${(hsva.value * 100).toInt()}%", enabled = enabled, modifier = Modifier.heightIn(min = 44.dp).semantics { contentDescription = labels.brightness })
            if (allowAlpha) LumenSlider(labels.alpha, hsva.alpha.toFloat(), { change(hsva.copy(alpha = it.toDouble())) },
                valueLabel = "${(hsva.alpha * 100).toInt()}%", enabled = enabled, modifier = Modifier.heightIn(min = 44.dp).semantics { contentDescription = labels.alpha })
        }
        Row(Modifier.horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(LumenSpacing.Sm)) {
            palette.filter { swatch -> parseLumenColor(swatch.value)?.let { formatLumenColor(it, allowAlpha) } != null }
                .distinctBy { it.id }.forEach { swatch ->
                val swatchColor = parseLumenColor(swatch.value)
                val encoded = swatchColor?.let { formatLumenColor(it, allowAlpha) }
                if (swatchColor != null && encoded != null) Box(Modifier.size(44.dp)
                    .background(swatchColor.composeColor(), RoundedCornerShape(LumenRadius.Sm))
                    .border(if (source == encoded) 3.dp else 1.dp, theme.colors.ink, RoundedCornerShape(LumenRadius.Sm))
                    .selectable(source == encoded, enabled && !swatch.disabled, Role.RadioButton) {
                        selection = null; selectionSource = null; publish(encoded)
                    }.semantics { contentDescription = swatch.label })
            }
        }
    }
}
