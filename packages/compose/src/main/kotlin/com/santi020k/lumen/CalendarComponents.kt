package com.santi020k.lumen

import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.selection.selectable
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp

@Composable
fun LumenCalendar(
    label: String, visibleMonth: LumenCalendarDay, onVisibleMonthChange: (LumenCalendarDay) -> Unit,
    selectedDay: LumenCalendarDay?, onSelectedDayChange: (LumenCalendarDay) -> Unit,
    modifier: Modifier = Modifier, events: List<LumenCalendarEvent> = emptyList(),
    min: LumenCalendarDay? = null, max: LumenCalendarDay? = null, today: LumenCalendarDay? = null,
    firstWeekday: Int = 1, enabled: Boolean = true, readOnly: Boolean = false,
    loading: Boolean = false, error: String? = null, empty: Boolean = false,
    loadingLabel: String = "Loading", emptyLabel: String = "No dates", invalidLabel: String = "Invalid calendar",
    previousMonthLabel: String = "Previous month", nextMonthLabel: String = "Next month", todayLabel: String = "Today",
    weekdayLabels: List<String> = listOf("Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"),
    formatDay: (LumenCalendarDay) -> String = { it.key }, formatMonth: (LumenCalendarDay) -> String = { it.key.take(7) }
) {
    val colors = LocalLumenTheme.current.colors
    val status = error ?: when {
        loading -> loadingLabel
        empty -> emptyLabel
        firstWeekday !in 0..6 || weekdayLabels.size != 7 || (min != null && max != null && min > max) -> invalidLabel
        else -> null
    }
    fun destination(amount: Int): LumenCalendarDay? {
        val next = visibleMonth.monthStart.addingMonths(amount) ?: return null
        if (max != null && next > max) return null
        val last = next.addingMonths(1)?.addingDays(-1)
        if (min != null && last != null && last < min) return null
        return next
    }
    Column(modifier.semantics { contentDescription = label }) {
        LumenText(label)
        if (status != null) LumenText(status) else {
            Row(verticalAlignment = Alignment.CenterVertically) {
                TextButton(onClick = { destination(-1)?.let(onVisibleMonthChange) }, enabled = enabled && !readOnly && destination(-1) != null,
                    modifier = Modifier.sizeIn(minWidth = 44.dp, minHeight = 44.dp).semantics { contentDescription = previousMonthLabel }) { LumenText("‹") }
                Box(Modifier.weight(1f), contentAlignment = Alignment.Center) { LumenText(formatMonth(visibleMonth)) }
                TextButton(onClick = { destination(1)?.let(onVisibleMonthChange) }, enabled = enabled && !readOnly && destination(1) != null,
                    modifier = Modifier.sizeIn(minWidth = 44.dp, minHeight = 44.dp).semantics { contentDescription = nextMonthLabel }) { LumenText("›") }
            }
            Column(Modifier.horizontalScroll(rememberScrollState()).widthIn(min = 308.dp)) {
            Row { repeat(7) { index -> Box(Modifier.weight(1f), contentAlignment = Alignment.Center) { LumenText(weekdayLabels[(firstWeekday + index) % 7]) } } }
            visibleMonth.grid(firstWeekday).chunked(7).forEach { week ->
                Row {
                    week.forEach { day ->
                        if (day == null) Spacer(Modifier.weight(1f).height(44.dp)) else {
                            val indicators = events.filter { it.contains(day) }
                            val selected = day == selectedDay
                            Box(Modifier.weight(1f).heightIn(min = 44.dp)
                                .background(if (selected) colors.brandSoft else Color.Transparent)
                                .selectable(selected = selected, enabled = enabled && !readOnly && day.isSelectable(min, max), role = Role.Button,
                                    onClick = { if (enabled && !readOnly && day.isSelectable(min, max)) onSelectedDayChange(day) })
                                .semantics { contentDescription = (listOf(formatDay(day)) + (if (day == today) listOf(todayLabel) else emptyList()) + indicators.map { it.label }).joinToString(", ") },
                                contentAlignment = Alignment.Center) {
                                Column(horizontalAlignment = Alignment.CenterHorizontally) { LumenText(day.day.toString()); if (indicators.isNotEmpty()) LumenText("•") }
                            }
                        }
                    }
                }
            }
            }
        }
    }
}
