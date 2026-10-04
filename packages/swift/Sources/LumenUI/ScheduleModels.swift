import Foundation

public struct LumenSchedulePlacement: Equatable, Sendable, Identifiable {
    public let segment: LumenAgendaSegment
    public let top: Int
    public let height: Int
    public var lane: Int
    public var laneCount: Int
    public var id: String { segment.id }
}
public struct LumenScheduleDay: Equatable, Sendable, Identifiable {
    public let day: LumenCalendarDay
    public let allDay: [LumenAgendaSegment]
    public let placements: [LumenSchedulePlacement]
    public var id: String { day.key }
}
private func schedulePlacements(_ segments: [LumenAgendaSegment], start: Int, end: Int) -> [LumenSchedulePlacement] {
    var placements = segments.compactMap { segment -> LumenSchedulePlacement? in
        guard let first = segment.startMinute, let last = segment.endMinute, first < end, last > start else { return nil }
        let top = min(max(first, start), end - 48) - start
        let height = max(48, min(last, end) - start - top)
        return LumenSchedulePlacement(segment: segment, top: top, height: height, lane: 0, laneCount: 1)
    }.sorted { a, b in a.top == b.top ? a.id < b.id : a.top < b.top }
    var groupStart = 0; var laneEnds: [Int] = []; var groupEnd = -1
    for index in placements.indices {
        let top = placements[index].top
        if top >= groupEnd {
            for prior in groupStart..<index { placements[prior].laneCount = laneEnds.count }
            groupStart = index; laneEnds = []
        }
        let lane = laneEnds.firstIndex(where: { $0 <= top }) ?? laneEnds.count
        if lane == laneEnds.count { laneEnds.append(0) }
        laneEnds[lane] = top + placements[index].height
        placements[index].lane = lane
        groupEnd = laneEnds.max() ?? -1
    }
    for prior in groupStart..<placements.count { placements[prior].laneCount = laneEnds.count }
    return placements
}
public func lumenScheduleLayout(events: [LumenAgendaEvent], selectedDay: LumenCalendarDay, dayCount: Int = 7, startHour: Int = 8, endHour: Int = 18) -> [LumenScheduleDay] {
    guard (1...7).contains(dayCount), startHour >= 0, endHour <= 24, startHour < endHour else { return [] }
    return lumenAgendaGroups(events: events, selectedDay: selectedDay, dayCount: dayCount).map { group in
        LumenScheduleDay(day: group.day, allDay: group.segments.filter { $0.startMinute == nil }, placements: schedulePlacements(group.segments, start: startHour * 60, end: endHour * 60))
    }
}
