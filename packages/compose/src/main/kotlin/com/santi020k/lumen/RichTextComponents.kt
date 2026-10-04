package com.santi020k.lumen

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.runtime.Composable
import androidx.compose.runtime.Immutable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.setValue
import androidx.compose.runtime.remember
import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.error
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.selected
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.TextRange
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.TextFieldValue
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.unit.dp

@Immutable
enum class LumenRichTextFormat { Bold, Italic, Underline }
@Immutable
data class LumenRichTextSpan(val start: Int, val end: Int, val format: LumenRichTextFormat)
@Immutable
data class LumenRichTextDocument(val text: String = "", val spans: List<LumenRichTextSpan> = emptyList()) {
    fun toggle(selection: TextRange, format: LumenRichTextFormat): LumenRichTextDocument {
        val start = selection.min.coerceIn(0, text.length)
        val end = selection.max.coerceIn(0, text.length)
        if (start == end) return this
        val coverage = BooleanArray(text.length)
        spans.filter { it.format == format }.forEach { span ->
            for (index in span.start.coerceIn(0, text.length) until span.end.coerceIn(0, text.length)) coverage[index] = true
        }
        val active = (start until end).all { coverage[it] }
        for (index in start until end) coverage[index] = !active
        val result = spans.filter { it.format != format }.toMutableList()
        var from = -1
        for (index in 0..text.length) {
            val marked = index < text.length && coverage[index]
            if (marked && from < 0) from = index
            if (!marked && from >= 0) { result.add(LumenRichTextSpan(from, index, format)); from = -1 }
        }
        return copy(spans = result)
    }
    fun replacing(value: String): LumenRichTextDocument {
        var start = 0
        while (start < text.length && start < value.length && text[start] == value[start]) start++
        var oldEnd = text.length
        var newEnd = value.length
        while (oldEnd > start && newEnd > start && text[oldEnd - 1] == value[newEnd - 1]) { oldEnd--; newEnd-- }
        val delta = newEnd - oldEnd
        return LumenRichTextDocument(value, spans.mapNotNull { span ->
            val from = if (span.start < start) span.start else if (span.start >= oldEnd) span.start + delta else start
            val to = if (span.end <= start) span.end else if (span.end >= oldEnd) span.end + delta else newEnd
            if (to > from) span.copy(start = from, end = to) else null
        })
    }
    fun annotated(): AnnotatedString = AnnotatedString.Builder(text).apply {
        spans.forEach { span ->
            val start = span.start.coerceIn(0, text.length)
            val end = span.end.coerceIn(start, text.length)
            if (start < end) addStyle(when (span.format) {
                LumenRichTextFormat.Bold -> SpanStyle(fontWeight = FontWeight.Bold)
                LumenRichTextFormat.Italic -> SpanStyle(fontStyle = FontStyle.Italic)
                LumenRichTextFormat.Underline -> SpanStyle(textDecoration = TextDecoration.Underline)
            }, start, end)
        }
    }.toAnnotatedString()
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun LumenRichTextEditor(
    label: String,
    document: LumenRichTextDocument,
    selection: TextRange,
    onDocumentChange: (LumenRichTextDocument) -> Unit,
    onSelectionChange: (TextRange) -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    readOnly: Boolean = false,
    errorMessage: String? = null,
    formatLabel: (LumenRichTextFormat) -> String = { it.name }
) {
    var composition by remember { mutableStateOf<TextRange?>(null) }
    val clampedSelection = TextRange(selection.start.coerceIn(0, document.text.length),
        selection.end.coerceIn(0, document.text.length))
    Column(modifier, verticalArrangement = Arrangement.spacedBy(LumenSpacing.Xs)) {
        LumenText(label)
        FlowRow(horizontalArrangement = Arrangement.spacedBy(LumenSpacing.Xs)) {
            LumenRichTextFormat.entries.forEach { format ->
                LumenButton(onClick = { if (enabled && !readOnly) onDocumentChange(document.toggle(clampedSelection, format)) },
                    enabled = enabled && !readOnly && !clampedSelection.collapsed,
                    modifier = Modifier.semantics {
                        contentDescription = formatLabel(format)
                        selected = !clampedSelection.collapsed && (clampedSelection.min until clampedSelection.max).all { index ->
                            document.spans.any { it.format == format && index >= it.start && index < it.end }
                        }
                    }) { LumenText(formatLabel(format)) }
            }
        }
        BasicTextField(value = TextFieldValue(document.annotated(), clampedSelection,
            composition?.takeIf { it.min >= 0 && it.max <= document.text.length }),
            onValueChange = { value ->
                composition = value.composition
                if (enabled && !readOnly && value.text != document.text) onDocumentChange(document.replacing(value.text))
                if (enabled) onSelectionChange(value.selection)
            }, enabled = enabled, readOnly = readOnly,
            textStyle = androidx.compose.ui.text.TextStyle(color = LocalLumenTheme.current.colors.ink),
            modifier = Modifier.heightIn(min = 120.dp).semantics {
                contentDescription = label
                errorMessage?.let { error(it) }
            })
        errorMessage?.let { LumenText(it) }
    }
}
