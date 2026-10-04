package com.santi020k.lumen.playground.compose
import androidx.compose.foundation.layout.Column
import androidx.compose.runtime.*
import com.santi020k.lumen.*
@Composable
fun CalendarParityExample() {
    var month by remember { mutableStateOf(LumenCalendarDay(2026, 3, 1)) }
    var day by remember { mutableStateOf<LumenCalendarDay?>(LumenCalendarDay(2026, 3, 8)) }
    var readOnly by remember { mutableStateOf(false) }
    var loading by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf(false) }
    Column {
        LumenCheckbox("Read only", readOnly, { readOnly = it })
        LumenCheckbox("Loading", loading, { loading = it })
        LumenCheckbox("Error", error, { error = it })
        LumenCalendar("Project calendar", month, { month = it }, day, { day = it },
            events = listOf(LumenCalendarEvent("review", "Design review", LumenCalendarDay(2026, 3, 10))),
            min = LumenCalendarDay(2026, 3, 5), max = LumenCalendarDay(2026, 4, 20),
            readOnly = readOnly, loading = loading, error = if (error) "Calendar unavailable" else null)
        LumenText("Selected: ${day?.key ?: "None"}")
    }
}
