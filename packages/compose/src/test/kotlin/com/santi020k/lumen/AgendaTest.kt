package com.santi020k.lumen

import org.junit.Assert.*
import org.junit.Test

class AgendaTest {
    @Test fun clipsSortsAndValidates() {
        val day = LumenCalendarDay(2026, 3, 8); val end = LumenCalendarDay(2026, 3, 10)
        val trip = LumenAgendaEvent(LumenCalendarEvent("trip", "Trip", day, end), 600, 0)
        val holiday = LumenAgendaEvent(LumenCalendarEvent("holiday", "Holiday", day, end))
        val groups = lumenAgendaGroups(listOf(trip, holiday), day, 3)
        assertEquals(listOf(2, 2, 1), groups.map { it.segments.size })
        assertEquals("holiday", groups[0].segments[0].event.event.id)
        assertEquals(1440, groups[0].segments[1].endMinute)
        assertEquals(0, groups[1].segments[1].startMinute)
        assertTrue(lumenAgendaGroups(listOf(trip, trip), day).isEmpty())
        assertTrue(lumenAgendaGroups(emptyList(), day, 32).isEmpty())
        assertTrue(lumenAgendaGroups(emptyList(), LumenCalendarDay(9999, 12, 31), 2).isEmpty())
        listOf(LumenAgendaEvent(holiday.event, -1, 60), LumenAgendaEvent(holiday.event, 60), LumenAgendaEvent(LumenCalendarEvent(" ", "Blank", day)), LumenAgendaEvent(LumenCalendarEvent("reverse", "Reverse", end, day))).forEach {
            assertFalse(it.isValid); assertTrue(lumenAgendaGroups(listOf(it), day).isEmpty())
        }
        assertEquals("24:00", formatLumenAgendaMinute(1440))
    }
}
