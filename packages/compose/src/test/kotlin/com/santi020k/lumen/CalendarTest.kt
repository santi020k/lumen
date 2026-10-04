package com.santi020k.lumen

import org.junit.Assert.*
import org.junit.Test

class CalendarTest {
    @Test fun civilTransitionsAndBounds() {
        val day = LumenCalendarDay(2026, 3, 8)
        assertEquals("2026-03-09", day.addingDays(1)?.key)
        assertEquals("2024-02-29", LumenCalendarDay(2024, 1, 31).addingMonths(1)?.key)
        assertEquals("2024-03-01", LumenCalendarDay(2024, 2, 28).addingDays(2)?.key)
        assertNull(LumenCalendarDay(1, 1, 1).addingDays(-1))
        assertNull(LumenCalendarDay(9999, 12, 31).addingDays(1))
        assertNull(day.addingDays(Int.MAX_VALUE))
        assertNull(day.addingMonths(Int.MAX_VALUE))
        listOf("1900-02-29", "2026-02-29", "0000-01-01", "2026-13-01", "9".repeat(100000)).forEach { assertNull(LumenCalendarDay.parse(it)) }
        assertNotNull(LumenCalendarDay.parse("2000-02-29"))
        assertEquals("2026-03-01", day.grid(0).first()?.key)
        assertEquals("2026-02-23", day.grid(1).first()?.key)
        assertTrue(day.grid(-1).isEmpty())
        assertFalse(day.isSelectable(day.addingDays(1), day))
        assertTrue(day.isSelectable(day, day))
        val event = LumenCalendarEvent("work", "Work", day, LumenCalendarDay(2026, 3, 10))
        assertTrue(event.contains(day)); assertTrue(event.contains(LumenCalendarDay(2026, 3, 10)))
        assertFalse(event.contains(LumenCalendarDay(2026, 3, 11)))
    }
}
