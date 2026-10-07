package com.santi020k.lumen.playground.compose

import androidx.compose.foundation.layout.Column
import androidx.compose.runtime.*
import com.santi020k.lumen.*

@Composable
fun AgendaParityExample() {
    var day by remember { mutableStateOf(LumenCalendarDay(2026, 3, 8)) }
    var readOnly by remember { mutableStateOf(false) }
    var loading by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf(false) }
    var empty by remember { mutableStateOf(false) }
    var message by remember { mutableStateOf("Choose an event") }
    val start = LumenCalendarDay(2026, 3, 8)
    Column {
        LumenCheckbox("Read only", readOnly, { readOnly = it })
        LumenCheckbox("Loading", loading, { loading = it })
        LumenCheckbox("Error", error, { error = it })
        LumenCheckbox("Empty", empty, { empty = it })
        LumenAgenda("Project agenda", day, { day = it }, events = if (empty) emptyList() else listOf(
            LumenAgendaEvent(LumenCalendarEvent("review", "Design review", start), 600, 660),
            LumenAgendaEvent(LumenCalendarEvent("release", "Release preparation", start, LumenCalendarDay(2026, 3, 10), "All-day work")),
            LumenAgendaEvent(LumenCalendarEvent("handoff", "Overnight handoff", start, LumenCalendarDay(2026, 3, 9)), 1380, 60)
        ), dayCount = 3, onEventPress = { event, date -> message = "${event.event.label}: ${date.key}" }, readOnly = readOnly, loading = loading, error = if (error) "Agenda unavailable" else null)
        LumenText(message)
    }
}
