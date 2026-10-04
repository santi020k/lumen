package com.santi020k.lumen

import androidx.compose.foundation.background
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.layout.*
import androidx.compose.material3.TextButton
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clipToBounds
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp

@Composable
fun LumenSchedule(label: String, selectedDay: LumenCalendarDay, onSelectedDayChange: (LumenCalendarDay) -> Unit,
    events: List<LumenAgendaEvent>, modifier: Modifier = Modifier, dayCount: Int = 7, startHour: Int = 8, endHour: Int = 18,
    onEventPress: ((LumenAgendaEvent, LumenCalendarDay) -> Unit)? = null, onEventMove: ((LumenAgendaEvent, LumenCalendarDay) -> Unit)? = null,
    enabled: Boolean = true, readOnly: Boolean = false, loading: Boolean = false, error: String? = null,
    loadingLabel: String = "Loading", emptyLabel: String = "No events in this time range", invalidLabel: String = "Invalid schedule",
    previousLabel: String = "Previous range", nextLabel: String = "Next range", previousDayLabel: String = "Move to previous day", nextDayLabel: String = "Move to next day", allDayLabel: String = "All day",
    formatDay: (LumenCalendarDay) -> String = { it.key }, formatTime: (Int) -> String = ::formatLumenAgendaMinute
) {
    val colors = LocalLumenTheme.current.colors
    val days = lumenScheduleLayout(events, selectedDay, dayCount, startHour, endHour)
    val status = error ?: if (loading) loadingLabel else if (days.isEmpty()) invalidLabel else null
    val locked = !enabled || readOnly || status != null
    var focusedID by remember { mutableStateOf<String?>(null) }
    var focusedDay by remember { mutableStateOf<LumenCalendarDay?>(null) }
    fun destination(direction: Int): LumenCalendarDay? {
        if (dayCount !in 1..7) return null
        val day = selectedDay.addingDays(direction * dayCount) ?: return null
        return if (day.addingDays(dayCount - 1) == null) null else day
    }
    fun focus(event: LumenAgendaEvent, day: LumenCalendarDay) {
        if (!locked && !event.event.disabled) { focusedID = event.event.id; focusedDay = day; onEventPress?.invoke(event, day) }
    }
    Column(modifier.semantics { contentDescription = label }) {
        LumenText(label, modifier = Modifier.semantics { heading() })
        if (status != null) LumenText(status) else {
            Row {
                TextButton(onClick = { if (!locked) destination(-1)?.let(onSelectedDayChange) }, enabled = !locked && destination(-1) != null, modifier = Modifier.heightIn(min = 48.dp)) { LumenText(previousLabel) }
                Spacer(Modifier.weight(1f))
                TextButton(onClick = { if (!locked) destination(1)?.let(onSelectedDayChange) }, enabled = !locked && destination(1) != null, modifier = Modifier.heightIn(min = 48.dp)) { LumenText(nextLabel) }
            }
            if (days.all { it.allDay.isEmpty() && it.placements.isEmpty() }) LumenText(emptyLabel)
            val allDayHeight = maxOf(1, days.maxOfOrNull { it.allDay.size } ?: 0) * 48
            Row(Modifier.horizontalScroll(rememberScrollState())) {
                Row(Modifier.height(480.dp).verticalScroll(rememberScrollState())) {
                    Column(Modifier.width(64.dp)) {
                        Box(Modifier.height((44 + allDayHeight).dp)) { LumenText(allDayLabel) }
                        Box(Modifier.height(((endHour - startHour) * 60).dp)) {
                            (startHour..endHour).forEach { hour -> LumenText(formatTime(hour * 60), modifier = Modifier.offset(y = minOf((hour - startHour) * 60, (endHour - startHour) * 60 - 20).dp)) }
                        }
                    }
                    days.forEach { day ->
                        val width = maxOf(200, (day.placements.maxOfOrNull { it.laneCount } ?: 1) * 100)
                        Column(Modifier.width(width.dp)) {
                            Box(Modifier.height(44.dp)) { LumenText(formatDay(day.day), modifier = Modifier.semantics { heading() }) }
                            Column(Modifier.height(allDayHeight.dp)) {
                                day.allDay.forEach { segment ->
                                    ScheduleEvent(segment, day.day, Modifier.fillMaxWidth().height(48.dp), locked || segment.event.event.disabled || (onEventPress == null && onEventMove == null), allDayLabel, formatDay, formatTime, ::focus)
                                }
                            }
                            Box(Modifier.height(((endHour - startHour) * 60).dp).fillMaxWidth()) {
                                (startHour until endHour).forEach { hour -> Box(Modifier.offset(y = ((hour - startHour) * 60).dp).fillMaxWidth().height(1.dp).background(colors.line)) }
                                day.placements.forEach { item ->
                                    ScheduleEvent(item.segment, day.day, Modifier.offset(x = (item.lane * width.toFloat() / item.laneCount + 2).dp, y = item.top.dp).width((width.toFloat() / item.laneCount - 4).dp).height(item.height.dp), locked || item.segment.event.event.disabled || (onEventPress == null && onEventMove == null), allDayLabel, formatDay, formatTime, ::focus)
                                }
                            }
                        }
                    }
                }
            }
            val focused = focusedDay
            val group = days.firstOrNull { it.day == focused }
            val segment = group?.let { (it.allDay + it.placements.map { item -> item.segment }).firstOrNull { item -> item.event.event.id == focusedID } }
            if (onEventMove != null && focused != null && segment != null) {
                LumenText(segment.event.event.label)
                listOf(-1, 1).forEach { direction ->
                    val target = focused.addingDays(direction)
                    TextButton(onClick = { if (!locked && !segment.event.event.disabled && target != null) onEventMove(segment.event, target) }, enabled = !locked && !segment.event.event.disabled && target != null, modifier = Modifier.heightIn(min = 48.dp)) { LumenText(if (direction < 0) previousDayLabel else nextDayLabel) }
                }
            }
        }
    }
}
@Composable
private fun ScheduleEvent(segment: LumenAgendaSegment, day: LumenCalendarDay, modifier: Modifier, disabled: Boolean,
    allDayLabel: String, formatDay: (LumenCalendarDay) -> String, formatTime: (Int) -> String, onPress: (LumenAgendaEvent, LumenCalendarDay) -> Unit) {
    val time = segment.startMinute?.let { formatTime(it) + " – " + formatTime(segment.endMinute ?: 1440) } ?: allDayLabel
    val name = listOfNotNull(formatDay(day), time, segment.event.event.label, segment.event.event.detail).joinToString(", ")
    TextButton(onClick = { if (!disabled) onPress(segment.event, day) }, enabled = !disabled,
        modifier = modifier.clipToBounds().background(LocalLumenTheme.current.colors.brandSoft).semantics { contentDescription = name }, contentPadding = PaddingValues(LumenSpacing.Xs)) {
        LumenText(segment.event.event.label)
    }
}
