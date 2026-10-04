import Foundation

public struct LumenAgendaEvent: Equatable, Sendable, Identifiable {
    public let event: LumenCalendarEvent
    public let startMinute: Int?
    public let endMinute: Int?
    public var id: String { event.id }
    public init(event: LumenCalendarEvent, startMinute: Int? = nil, endMinute: Int? = nil) {
        self.event = event; self.startMinute = startMinute; self.endMinute = endMinute
    }
    public var isValid: Bool {
        guard !id.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty, event.endDay >= event.startDay else { return false }
        if startMinute == nil && endMinute == nil { return true }
        guard let startMinute, let endMinute, (0..<1440).contains(startMinute), (0...1440).contains(endMinute) else { return false }
        return event.endDay > event.startDay || endMinute > startMinute
    }
}
public struct LumenAgendaSegment: Equatable, Sendable, Identifiable {
    public let event: LumenAgendaEvent
    public let startMinute: Int?
    public let endMinute: Int?
    public var id: String { event.id }
}
public struct LumenAgendaGroup: Equatable, Sendable, Identifiable {
    public let day: LumenCalendarDay
    public let segments: [LumenAgendaSegment]
    public var id: String { day.key }
}
public func lumenAgendaGroups(events: [LumenAgendaEvent], selectedDay: LumenCalendarDay, dayCount: Int = 7) -> [LumenAgendaGroup] {
    guard (1...31).contains(dayCount), selectedDay.addingDays(dayCount - 1) != nil,
          events.allSatisfy({ $0.isValid }), Set(events.map(\.id)).count == events.count else { return [] }
    return (0..<dayCount).map { offset in
        let day = selectedDay.addingDays(offset) ?? selectedDay
        let segments = events.compactMap { input -> LumenAgendaSegment? in
            guard input.event.contains(day) else { return nil }
            let start = input.startMinute.map { day == input.event.startDay ? $0 : 0 }
            let end = input.endMinute.map { day == input.event.endDay ? $0 : 1440 }
            if let start, let end, end <= start { return nil }
            return LumenAgendaSegment(event: input, startMinute: start, endMinute: end)
        }.sorted { a, b in
            if a.startMinute == b.startMinute { return a.id < b.id }
            return (a.startMinute ?? -1) < (b.startMinute ?? -1)
        }
        return LumenAgendaGroup(day: day, segments: segments)
    }
}
public func formatLumenAgendaMinute(_ minute: Int) -> String { String(format: "%02d:%02d", minute / 60, minute % 60) }
