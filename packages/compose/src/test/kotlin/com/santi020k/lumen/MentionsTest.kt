package com.santi020k.lumen

import org.junit.Assert.*
import org.junit.Test

class MentionsTest {
    private fun value(text: String, start: Int = text.length, end: Int = start) =
        LumenMentionsValue(text, LumenMentionsSelection(start, end))
    private val alice = LumenMentionOption("alice", "Alice 🐈", "alice")
    @Test fun boundaryInsertionAndCustomTrigger() {
        assertEquals("al", resolveLumenMentionQuery(value("Hello @AL tail", 9))?.query)
        assertEquals(value("😀 @alice !", 10), insertLumenMention(value("😀 @al!", 6), alice))
        assertNull(resolveLumenMentionQuery(value("alice@bo")))
        assertEquals("bo", resolveLumenMentionQuery(value("x (@bo"))?.query)
        assertEquals("al", resolveLumenMentionQuery(value("Hi ::al"), "::")?.query)
        listOf("", "a", "123456789", "🧡").forEach { assertNull(resolveLumenMentionQuery(value("@al"), it)) }
        assertNull(resolveLumenMentionQuery(value("@ál")))
    }
    @Test fun invalidSelectionPreserved() {
        listOf(value("😀 @al", 1), value("@al", -1), value("@al", 1, 4), value("@al", 2, 1), value("@al", Int.MAX_VALUE)).forEach {
            val original = it.copy()
            assertFalse(isLumenMentionsSelectionValid(it))
            assertNull(resolveLumenMentionQuery(it))
            assertNull(insertLumenMention(it, alice))
            assertEquals(original, it)
        }
        assertNull(resolveLumenMentionQuery(value("@al", 1, 3)))
    }
    @Test fun optionsAndLinearLongInput() {
        val disabled = LumenMentionOption("archived", "Archived", "albert", true)
        val options = listOf(alice, alice.copy(value = "alex"), disabled, LumenMentionOption("bad", "Bad", "alice smith"),
            LumenMentionOption("", "Empty", "alice"), LumenMentionOption("long", "Long", "a".repeat(129)))
        assertEquals(listOf(alice, disabled), filterLumenMentionOptions(options, resolveLumenMentionQuery(value("@al"))))
        assertNull(insertLumenMention(value("@al"), disabled))
        assertNull(insertLumenMention(value("@bo"), alice))
        assertNull(resolveLumenMentionQuery(value("a".repeat(1_000_000))))
    }
}
