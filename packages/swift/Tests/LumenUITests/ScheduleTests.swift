import Testing
@testable import LumenUI

@Test func scheduleOverlapClippingAndValidation() throws {
    let day = try #require(LumenCalendarDay(key: "2026-03-08"))
    func timed(_ id: String, _ start: Int, _ end: Int) -> LumenAgendaEvent { .init(event: .init(id: id, label: id, startDay: day), startMinute: start, endMinute: end) }
    let layout = lumenScheduleLayout(events: [timed("a", 540, 660), timed("b", 570, 630), timed("c", 630, 690), timed("d", 720, 780)], selectedDay: day, dayCount: 1)
    #expect(layout[0].placements.map(\.lane) == [0, 1, 1, 0])
    #expect(layout[0].placements.map(\.laneCount) == [2, 2, 2, 1])
    let short = lumenScheduleLayout(events: [timed("a", 480, 485), timed("b", 486, 490), timed("last", 1079, 1080)], selectedDay: day, dayCount: 1)
    #expect(short[0].placements.map(\.height) == [48, 48, 48])
    #expect(short[0].placements[2].top == 552)
    #expect(short[0].placements[1].laneCount == 2)
    let event = timed("duplicate", 600, 660)
    #expect(lumenScheduleLayout(events: [event, event], selectedDay: day).isEmpty)
    #expect(lumenScheduleLayout(events: [], selectedDay: day, dayCount: 8).isEmpty)
    #expect(lumenScheduleLayout(events: [], selectedDay: day, startHour: 18, endHour: 8).isEmpty)
    #expect(lumenScheduleLayout(events: [], selectedDay: try #require(LumenCalendarDay(key: "9999-12-31")), dayCount: 2).isEmpty)
    let overnight = LumenAgendaEvent(event: .init(id: "night", label: "Night", startDay: day, endDay: day.addingDays(1)), startMinute: 1380, endMinute: 60)
    #expect(lumenScheduleLayout(events: [overnight], selectedDay: day, dayCount: 2, startHour: 0, endHour: 24)[1].placements[0].segment.startMinute == 0)
}
