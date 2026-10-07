package com.santi020k.lumen

import androidx.compose.ui.text.TextRange
import org.junit.Assert.assertEquals
import org.junit.Test

class RichTextTest {
    @Test fun replacementRejectsMalformedSpanOffsets() {
        val original = LumenRichTextDocument("a", listOf(
            LumenRichTextSpan(Int.MAX_VALUE, Int.MAX_VALUE, LumenRichTextFormat.Bold),
            LumenRichTextSpan(Int.MIN_VALUE, 1, LumenRichTextFormat.Italic),
            LumenRichTextSpan(0, Int.MAX_VALUE, LumenRichTextFormat.Underline),
            LumenRichTextSpan(1, 0, LumenRichTextFormat.Bold),
            LumenRichTextSpan(0, 1, LumenRichTextFormat.Italic)
        ))
        assertEquals(listOf(LumenRichTextSpan(0, 1, LumenRichTextFormat.Italic)), original.replacing("ab").spans)
        assertEquals(emptyList<LumenRichTextSpan>(), original.replacing("").spans)
        assertEquals(5, original.spans.size)
    }
    @Test fun toggleAndReplacementPreserveSpans() {
        val original = LumenRichTextDocument("ab😀cd", listOf(LumenRichTextSpan(2, 4, LumenRichTextFormat.Bold)))
        assertEquals(emptyList<LumenRichTextSpan>(), original.replacing("abcd").spans)
        assertEquals(listOf(LumenRichTextSpan(3, 5, LumenRichTextFormat.Bold)), original.replacing("xab😀cd").spans)
        assertEquals(original, original.toggle(TextRange(0), LumenRichTextFormat.Italic))
        assertEquals(emptyList<LumenRichTextSpan>(), original.toggle(TextRange(2, 4), LumenRichTextFormat.Bold).spans)
        assertEquals(1, original.spans.size)
    }
}
