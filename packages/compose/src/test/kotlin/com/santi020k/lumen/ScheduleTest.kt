package com.santi020k.lumen

import org.junit.Assert.*
import org.junit.Test

class ScheduleTest {
    @Test fun overlapClippingAndValidation() {
        val day = LumenCalendarDay(2026, 3, 8)
        fun timed(id: String, start: Int, end: Int) = LumenAgendaEvent(LumenCalendarEvent(id, id, day), start, end)
        val layout = lumenScheduleLayout(listOf(timed("a", 540, 660), timed("b", 570, 630), timed("c", 630, 690), timed("d", 720, 780)), day, 1)
        assertEquals(listOf(0, 1, 1, 0), layout[0].placements.map { it.lane })
        assertEquals(listOf(2, 2, 2, 1), layout[0].placements.map { it.laneCount })
        val short = lumenScheduleLayout(listOf(timed("a", 480, 485), timed("b", 486, 490), timed("last", 1079, 1080)), day, 1)
        assertEquals(listOf(48, 48, 48), short[0].placements.map { it.height })
        assertEquals(552, short[0].placements[2].top)
        assertEquals(2, short[0].placements[1].laneCount)
        val event = timed("duplicate", 600, 660)
        assertTrue(lumenScheduleLayout(listOf(event, event), day).isEmpty())
        assertTrue(lumenScheduleLayout(emptyList(), day, 8).isEmpty())
        assertTrue(lumenScheduleLayout(emptyList(), day, startHour = 18, endHour = 8).isEmpty())
        assertTrue(lumenScheduleLayout(emptyList(), LumenCalendarDay(9999, 12, 31), 2).isEmpty())
        val overnight = LumenAgendaEvent(LumenCalendarEvent("night", "Night", day, LumenCalendarDay(2026, 3, 9)), 1380, 60)
        assertEquals(0, lumenScheduleLayout(listOf(overnight), day, 2, 0, 24)[1].placements[0].segment.startMinute)
    }
}
