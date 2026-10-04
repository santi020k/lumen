package com.santi020k.lumen

import java.util.Locale

data class LumenMentionsSelection(val start: Int, val end: Int)
data class LumenMentionsValue(val text: String, val selection: LumenMentionsSelection)
data class LumenMentionOption(val id: String, val label: String, val value: String, val disabled: Boolean = false)
data class LumenMentionQuery(val start: Int, val end: Int, val query: String, val trigger: String)
private fun mentionWord(unit: Char): Boolean = unit in 'A'..'Z' || unit in 'a'..'z' || unit in '0'..'9' || unit == '_'
private fun mentionBoundary(text: String, offset: Int): Boolean = offset == 0 || offset == text.length ||
    !(text[offset - 1].isHighSurrogate() && text[offset].isLowSurrogate())
fun isLumenMentionsSelectionValid(value: LumenMentionsValue): Boolean = value.selection.start >= 0 &&
    value.selection.end >= value.selection.start && value.selection.end <= value.text.length &&
    mentionBoundary(value.text, value.selection.start) && mentionBoundary(value.text, value.selection.end)
fun resolveLumenMentionQuery(value: LumenMentionsValue, trigger: String = "@"): LumenMentionQuery? {
    if (!isLumenMentionsSelectionValid(value) || value.selection.start != value.selection.end || trigger.isEmpty() ||
        trigger.length > 8 || trigger.any { it !in '!'..'~' || mentionWord(it) }) return null
    val end = value.selection.start
    var start = end
    while (start > 0 && mentionWord(value.text[start - 1])) start--
    val tokenStart = start - trigger.length
    if (tokenStart < 0 || value.text.substring(tokenStart, start) != trigger ||
        (tokenStart > 0 && value.text[tokenStart - 1] !in " \t\n\r\u000b\u000c([{\"',;:!?")) return null
    return LumenMentionQuery(tokenStart, end, value.text.substring(start, end).lowercase(Locale.ROOT), trigger)
}
private fun validMentionOption(option: LumenMentionOption): Boolean = option.id.isNotEmpty() &&
    option.value.isNotEmpty() && option.value.length <= 128 && option.value.all(::mentionWord)
fun filterLumenMentionOptions(options: List<LumenMentionOption>, query: LumenMentionQuery?): List<LumenMentionOption> {
    if (query == null) return emptyList()
    val used = mutableSetOf<String>()
    return options.filter { validMentionOption(it) && used.add(it.id) && it.value.lowercase(Locale.ROOT).startsWith(query.query) }
}
fun insertLumenMention(value: LumenMentionsValue, option: LumenMentionOption, trigger: String = "@"): LumenMentionsValue? {
    val query = resolveLumenMentionQuery(value, trigger) ?: return null
    if (option.disabled || !validMentionOption(option) || !option.value.lowercase(Locale.ROOT).startsWith(query.query)) return null
    val before = value.text.substring(0, query.start) + trigger + option.value + " "
    return LumenMentionsValue(before + value.text.substring(query.end), LumenMentionsSelection(before.length, before.length))
}
