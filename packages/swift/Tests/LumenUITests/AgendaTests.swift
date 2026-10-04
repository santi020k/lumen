import Testing
@testable import LumenUI

@Test func agendaClipsSortsAndValidates() throws {
    let day = try #require(LumenCalendarDay(key: "2026-03-08"))
    let end = try #require(day.addingDays(2))
    let trip = LumenAgendaEvent(event: LumenCalendarEvent(id: "trip", label: "Trip", startDay: day, endDay: end), startMinute: 600, endMinute: 0)
    let holiday = LumenAgendaEvent(event: LumenCalendarEvent(id: "holiday", label: "Holiday", startDay: day, endDay: end))
    let groups = lumenAgendaGroups(events: [trip, holiday], selectedDay: day, dayCount: 3)
    #expect(groups.map { $0.segments.count } == [2, 2, 1])
    #expect(groups[0].segments[0].id == "holiday")
    #expect(groups[0].segments[1].endMinute == 1440)
    #expect(groups[1].segments[1].startMinute == 0)
    #expect(lumenAgendaGroups(events: [trip, trip], selectedDay: day).isEmpty)
    #expect(lumenAgendaGroups(events: [], selectedDay: day, dayCount: 32).isEmpty)
    #expect(lumenAgendaGroups(events: [], selectedDay: try #require(LumenCalendarDay(key: "9999-12-31")), dayCount: 2).isEmpty)
    for input in [LumenAgendaEvent(event: holiday.event, startMinute: -1, endMinute: 60), LumenAgendaEvent(event: holiday.event, startMinute: 60), LumenAgendaEvent(event: LumenCalendarEvent(id: " ", label: "Blank", startDay: day)), LumenAgendaEvent(event: LumenCalendarEvent(id: "reverse", label: "Reverse", startDay: end, endDay: day))] {
        #expect(!input.isValid)
        #expect(lumenAgendaGroups(events: [input], selectedDay: day).isEmpty)
    }
    #expect(formatLumenAgendaMinute(1440) == "24:00")
}
