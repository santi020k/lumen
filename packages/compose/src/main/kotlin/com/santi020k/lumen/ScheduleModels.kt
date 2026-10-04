package com.santi020k.lumen

data class LumenSchedulePlacement(val segment: LumenAgendaSegment, val top: Int, val height: Int, val lane: Int, val laneCount: Int)
data class LumenScheduleDay(val day: LumenCalendarDay, val allDay: List<LumenAgendaSegment>, val placements: List<LumenSchedulePlacement>)
private fun schedulePlacements(segments: List<LumenAgendaSegment>, start: Int, end: Int): List<LumenSchedulePlacement> {
    val placements = segments.mapNotNull { segment ->
        val first = segment.startMinute ?: return@mapNotNull null
        val last = segment.endMinute ?: return@mapNotNull null
        if (first >= end || last <= start) return@mapNotNull null
        val top = minOf(maxOf(first, start), end - 48) - start
        LumenSchedulePlacement(segment, top, maxOf(48, minOf(last, end) - start - top), 0, 1)
    }.sortedWith(compareBy<LumenSchedulePlacement> { it.top }.thenBy { it.segment.event.event.id }).toMutableList()
    var groupStart = 0; val laneEnds = mutableListOf<Int>(); var groupEnd = -1
    for (index in placements.indices) {
        val item = placements[index]
        if (item.top >= groupEnd) {
            for (prior in groupStart until index) placements[prior] = placements[prior].copy(laneCount = laneEnds.size)
            groupStart = index; laneEnds.clear()
        }
        var lane = laneEnds.indexOfFirst { it <= item.top }
        if (lane < 0) { lane = laneEnds.size; laneEnds.add(0) }
        laneEnds[lane] = item.top + item.height
        placements[index] = item.copy(lane = lane)
        groupEnd = laneEnds.maxOrNull() ?: -1
    }
    for (prior in groupStart until placements.size) placements[prior] = placements[prior].copy(laneCount = laneEnds.size)
    return placements
}
fun lumenScheduleLayout(events: List<LumenAgendaEvent>, selectedDay: LumenCalendarDay, dayCount: Int = 7, startHour: Int = 8, endHour: Int = 18): List<LumenScheduleDay> {
    if (dayCount !in 1..7 || startHour < 0 || endHour > 24 || startHour >= endHour) return emptyList()
    return lumenAgendaGroups(events, selectedDay, dayCount).map { group ->
        LumenScheduleDay(group.day, group.segments.filter { it.startMinute == null }, schedulePlacements(group.segments, startHour * 60, endHour * 60))
    }
}
