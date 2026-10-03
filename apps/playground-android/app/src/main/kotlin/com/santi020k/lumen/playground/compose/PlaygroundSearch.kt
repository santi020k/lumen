package com.santi020k.lumen.playground.compose

internal fun normalizeComponentQuery(value: String): String =
    value.lowercase().filterNot { it.isWhitespace() || it == '-' || it == '_' }

internal fun matchesComponentQuery(name: String, query: String, exact: Boolean = false): Boolean {
    val needle = normalizeComponentQuery(query)
    val label = normalizeComponentQuery(name)
    return needle.isEmpty() || if (exact) label == needle else label.contains(needle)
}
