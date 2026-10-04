package com.santi020k.lumen

import java.util.Locale

data class LumenAgendaEvent(val event: LumenCalendarEvent, val startMinute: Int? = null, val endMinute: Int? = null) {
    val isValid: Boolean get() {
        if (event.id.isBlank() || event.endDay < event.startDay) return false
        if (startMinute == null && endMinute == null) return true
        return startMinute != null && endMinute != null && startMinute in 0 until 1440 && endMinute in 0..1440 && (event.endDay > event.startDay || endMinute > startMinute)
    }
}
data class LumenAgendaSegment(val event: LumenAgendaEvent, val startMinute: Int?, val endMinute: Int?)
data class LumenAgendaGroup(val day: LumenCalendarDay, val segments: List<LumenAgendaSegment>)
fun lumenAgendaGroups(events: List<LumenAgendaEvent>, selectedDay: LumenCalendarDay, dayCount: Int = 7): List<LumenAgendaGroup> {
    if (dayCount !in 1..31 || selectedDay.addingDays(dayCount - 1) == null || events.any { !it.isValid } || events.map { it.event.id }.toSet().size != events.size) return emptyList()
    return (0 until dayCount).map { offset ->
        val day = selectedDay.addingDays(offset) ?: selectedDay
        val segments = events.mapNotNull { input ->
            if (!input.event.contains(day)) return@mapNotNull null
            val start = input.startMinute?.let { if (day == input.event.startDay) it else 0 }
            val end = input.endMinute?.let { if (day == input.event.endDay) it else 1440 }
            if (start != null && end != null && end <= start) return@mapNotNull null
            LumenAgendaSegment(input, start, end)
        }.sortedWith(compareBy<LumenAgendaSegment> { it.startMinute ?: -1 }.thenBy { it.event.event.id })
        LumenAgendaGroup(day, segments)
    }
}
fun formatLumenAgendaMinute(minute: Int): String = "%02d:%02d".format(Locale.ROOT, minute / 60, minute % 60)
