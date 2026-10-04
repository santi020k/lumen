package com.santi020k.lumen

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.focus.onFocusChanged
import androidx.compose.ui.input.key.Key
import androidx.compose.ui.input.key.KeyEventType
import androidx.compose.ui.input.key.key
import androidx.compose.ui.input.key.onPreviewKeyEvent
import androidx.compose.ui.input.key.type
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.error
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.TextRange
import androidx.compose.ui.text.input.TextFieldValue
import androidx.compose.ui.unit.dp

enum class LumenMentionsStatus { Ready, Loading, Error }
data class LumenMentionsLabels(
    val suggestions: String = "Mention suggestions", val empty: String = "No matching mentions",
    val loading: String = "Loading suggestions", val error: String = "Unable to load suggestions",
    val invalid: String = "Invalid text selection", val readOnly: String = "Read-only"
)

/** Atomic UTF-16 text/selection updates. Native composing text is never replaced by a host update. */
@Composable
fun LumenMentions(
    label: String, value: LumenMentionsValue, onValueChange: (LumenMentionsValue) -> Unit,
    options: List<LumenMentionOption>, modifier: Modifier = Modifier, trigger: String = "@",
    disabled: Boolean = false, readOnly: Boolean = false, status: LumenMentionsStatus = LumenMentionsStatus.Ready,
    labels: LumenMentionsLabels = LumenMentionsLabels()
) {
    val valid = isLumenMentionsSelectionValid(value)
    var nativeValue by remember { mutableStateOf(TextFieldValue(value.text, if (valid)
        TextRange(value.selection.start, value.selection.end) else TextRange.Zero)) }
    var accepted by remember { mutableStateOf(value) }
    var focused by remember { mutableStateOf(false) }
    var dismissed by remember { mutableStateOf<LumenMentionsValue?>(null) }
    var activeId by remember { mutableStateOf<String?>(null) }
    // State synchronization is guarded by actual Android composition metadata.
    if (nativeValue.composition == null && (accepted != value || nativeValue.text != value.text ||
        (valid && nativeValue.selection != TextRange(value.selection.start, value.selection.end)))) {
        accepted = value
        nativeValue = TextFieldValue(value.text, if (valid) TextRange(value.selection.start, value.selection.end)
            else TextRange(nativeValue.selection.start.coerceAtMost(value.text.length),
                nativeValue.selection.end.coerceAtMost(value.text.length)))
    }
    val editable = !disabled && !readOnly
    val query = if (valid && editable && focused && nativeValue.composition == null && status == LumenMentionsStatus.Ready &&
        dismissed != value && nativeValue.text == value.text && nativeValue.selection ==
        TextRange(value.selection.start, value.selection.end)) resolveLumenMentionQuery(value, trigger) else null
    val matches = filterLumenMentionOptions(options, query)
    val enabled = matches.filterNot { it.disabled }
    val active = enabled.firstOrNull { it.id == activeId } ?: enabled.firstOrNull()
    fun insert(id: String) {
        if (!valid || !editable || nativeValue.composition != null || status != LumenMentionsStatus.Ready) return
        if (nativeValue.text != value.text || nativeValue.selection != TextRange(value.selection.start, value.selection.end)) return
        val current = filterLumenMentionOptions(options, resolveLumenMentionQuery(value, trigger)).firstOrNull { it.id == id }
            ?: return
        insertLumenMention(value, current, trigger)?.let(onValueChange)
    }
    Column(modifier.fillMaxWidth()) {
        LumenText(label)
        BasicTextField(
            value = nativeValue, enabled = !disabled, readOnly = readOnly,
            onValueChange = { next ->
                if (editable) {
                    nativeValue = next
                    dismissed = null
                    val range = next.selection
                    onValueChange(LumenMentionsValue(next.text,
                        LumenMentionsSelection(minOf(range.start, range.end), maxOf(range.start, range.end))))
                }
            },
            textStyle = MaterialTheme.typography.bodyLarge.copy(color = MaterialTheme.colorScheme.onSurface),
            modifier = Modifier.fillMaxWidth().heightIn(min = 120.dp)
                .background(MaterialTheme.colorScheme.surface).padding(12.dp)
                .semantics { contentDescription = if (readOnly) "$label, ${labels.readOnly}" else label
                    if (!valid) error(labels.invalid) }
                .onFocusChanged { focused = it.isFocused }
                .onPreviewKeyEvent { event ->
                    if (event.type != KeyEventType.KeyDown || query == null) false
                    else when (event.key) {
                        Key.Escape -> { dismissed = value; true }
                        Key.Enter -> { active?.let { insert(it.id) }; active != null }
                        Key.DirectionDown, Key.DirectionUp -> {
                            if (enabled.isEmpty()) false else {
                                val index = enabled.indexOfFirst { it.id == active?.id }
                                val delta = if (event.key == Key.DirectionDown) 1 else -1
                                activeId = enabled[(index + delta + enabled.size) % enabled.size].id
                                true
                            }
                        }
                        Key.MoveHome -> { activeId = enabled.firstOrNull()?.id; enabled.isNotEmpty() }
                        Key.MoveEnd -> { activeId = enabled.lastOrNull()?.id; enabled.isNotEmpty() }
                        else -> false
                    }
                }
        )
        if (!valid) LumenText(labels.invalid)
        when (status) {
            LumenMentionsStatus.Loading -> LumenText(labels.loading)
            LumenMentionsStatus.Error -> LumenText(labels.error)
            LumenMentionsStatus.Ready -> Unit
        }
        if (query != null && matches.isEmpty()) LumenText(labels.empty)
        if (matches.isNotEmpty()) {
            LumenText(labels.suggestions)
            matches.forEach { option ->
                LumenButton(onClick = { insert(option.id) }, enabled = !option.disabled,
                    modifier = Modifier.fillMaxWidth()) { LumenText(option.label) }
            }
        }
    }
}
