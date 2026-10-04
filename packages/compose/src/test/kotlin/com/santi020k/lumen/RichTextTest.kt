package com.santi020k.lumen

import androidx.compose.ui.text.TextRange
import org.junit.Assert.assertEquals
import org.junit.Test

class RichTextTest {
    @Test fun toggleAndReplacementPreserveSpans() {
        val original = LumenRichTextDocument("ab😀cd", listOf(LumenRichTextSpan(2, 4, LumenRichTextFormat.Bold)))
        assertEquals(emptyList<LumenRichTextSpan>(), original.replacing("abcd").spans)
        assertEquals(listOf(LumenRichTextSpan(3, 5, LumenRichTextFormat.Bold)), original.replacing("xab😀cd").spans)
        assertEquals(original, original.toggle(TextRange(0), LumenRichTextFormat.Italic))
        assertEquals(emptyList<LumenRichTextSpan>(), original.toggle(TextRange(2, 4), LumenRichTextFormat.Bold).spans)
        assertEquals(1, original.spans.size)
    }
}
