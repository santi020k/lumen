package com.santi020k.lumen

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp

@Composable
fun LumenAgenda(label: String, selectedDay: LumenCalendarDay, onSelectedDayChange: (LumenCalendarDay) -> Unit,
    events: List<LumenAgendaEvent>, modifier: Modifier = Modifier, dayCount: Int = 7,
    onEventPress: ((LumenAgendaEvent, LumenCalendarDay) -> Unit)? = null,
    enabled: Boolean = true, readOnly: Boolean = false, loading: Boolean = false, error: String? = null,
    loadingLabel: String = "Loading", emptyLabel: String = "No events", invalidLabel: String = "Invalid agenda",
    previousLabel: String = "Previous days", nextLabel: String = "Next days", allDayLabel: String = "All day",
    formatDay: (LumenCalendarDay) -> String = { it.key }, formatTime: (Int) -> String = ::formatLumenAgendaMinute
) {
    val colors = LocalLumenTheme.current.colors
    val groups = lumenAgendaGroups(events, selectedDay, dayCount)
    val status = error ?: if (loading) loadingLabel else if (groups.isEmpty()) invalidLabel else null
    fun destination(direction: Int): LumenCalendarDay? {
        if (dayCount !in 1..31) return null
        val day = selectedDay.addingDays(direction * dayCount) ?: return null
        return if (day.addingDays(dayCount - 1) == null) null else day
    }
    Column(modifier.semantics { contentDescription = label }) {
        LumenText(label, modifier = Modifier.semantics { heading() })
        if (status != null) LumenText(status) else {
            Row {
                TextButton(onClick = { if (enabled && !readOnly) destination(-1)?.let(onSelectedDayChange) }, enabled = enabled && !readOnly && destination(-1) != null, modifier = Modifier.heightIn(min = 48.dp)) { LumenText(previousLabel) }
                Spacer(Modifier.weight(1f))
                TextButton(onClick = { if (enabled && !readOnly) destination(1)?.let(onSelectedDayChange) }, enabled = enabled && !readOnly && destination(1) != null, modifier = Modifier.heightIn(min = 48.dp)) { LumenText(nextLabel) }
            }
            groups.forEach { group ->
                Column(Modifier.fillMaxWidth().background(colors.surface).padding(LumenSpacing.Sm)) {
                    LumenText(formatDay(group.day), modifier = Modifier.semantics { heading() })
                    if (group.segments.isEmpty()) LumenText(emptyLabel)
                    group.segments.forEach { segment ->
                        val time = segment.startMinute?.let { formatTime(it) + " – " + formatTime(segment.endMinute ?: 1440) } ?: allDayLabel
                        val name = listOfNotNull(formatDay(group.day), time, segment.event.event.label, segment.event.event.detail).joinToString(", ")
                        if (onEventPress != null) {
                            TextButton(onClick = { if (enabled && !readOnly && !segment.event.event.disabled) onEventPress(segment.event, group.day) }, enabled = enabled && !readOnly && !segment.event.event.disabled,
                                modifier = Modifier.fillMaxWidth().heightIn(min = 48.dp).semantics { contentDescription = name }) { AgendaRow(segment, time) }
                        } else Column(Modifier.semantics(mergeDescendants = true) { contentDescription = name }) { AgendaRow(segment, time) }
                    }
                }
            }
        }
    }
}
@Composable
private fun AgendaRow(segment: LumenAgendaSegment, time: String) {
    Column(Modifier.fillMaxWidth()) {
        LumenText(segment.event.event.label); LumenText(time)
        segment.event.event.detail?.let { LumenText(it) }
    }
}
