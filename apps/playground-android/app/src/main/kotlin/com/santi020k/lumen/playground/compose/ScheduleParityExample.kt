package com.santi020k.lumen.playground.compose

import androidx.compose.foundation.layout.Column
import androidx.compose.runtime.*
import com.santi020k.lumen.*

@Composable
fun ScheduleParityExample() {
    val start = LumenCalendarDay(2026, 3, 8)
    var day by remember { mutableStateOf(start) }
    var events by remember { mutableStateOf(listOf(
        LumenAgendaEvent(LumenCalendarEvent("planning", "Planning", start), 600, 660),
        LumenAgendaEvent(LumenCalendarEvent("review", "Review", start), 630, 720),
        LumenAgendaEvent(LumenCalendarEvent("ship", "Ship", start), 840, 845),
        LumenAgendaEvent(LumenCalendarEvent("launch", "Launch week", start, LumenCalendarDay(2026, 3, 10))),
        LumenAgendaEvent(LumenCalendarEvent("handoff", "Overnight handoff", start, LumenCalendarDay(2026, 3, 9)), 1020, 570)
    )) }
    var readOnly by remember { mutableStateOf(false) }
    var loading by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf(false) }
    var empty by remember { mutableStateOf(false) }
    var dayView by remember { mutableStateOf(false) }
    var message by remember { mutableStateOf("Select an event to move it") }
    Column {
        LumenCheckbox("Day view", dayView, { dayView = it })
        LumenCheckbox("Read only", readOnly, { readOnly = it })
        LumenCheckbox("Loading", loading, { loading = it })
        LumenCheckbox("Error", error, { error = it })
        LumenCheckbox("Empty", empty, { empty = it })
        LumenSchedule("Launch schedule", day, { day = it }, events = if (empty) emptyList() else events, dayCount = if (dayView) 1 else 7,
            onEventPress = { event, _ -> message = "Selected ${event.event.label}" }, onEventMove = { event, target ->
                val duration = event.event.endDay.ordinal - event.event.startDay.ordinal
                target.addingDays(duration)?.let { end ->
                    events = events.map { item -> if (item.event.id == event.event.id) item.copy(event = item.event.copy(startDay = target, endDay = end)) else item }
                    message = "Moved ${event.event.label} to ${target.key}"
                }
            }, readOnly = readOnly, loading = loading, error = if (error) "Schedule unavailable" else null)
        LumenText(message)
    }
}
