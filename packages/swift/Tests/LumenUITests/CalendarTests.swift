import Testing
@testable import LumenUI

@Test func calendarCivilTransitionsAndBounds() throws {
    let day = try #require(LumenCalendarDay(key: "2026-03-08"))
    #expect(day.addingDays(1)?.key == "2026-03-09")
    #expect(LumenCalendarDay(key: "2024-01-31")?.addingMonths(1)?.key == "2024-02-29")
    #expect(LumenCalendarDay(key: "2024-02-28")?.addingDays(2)?.key == "2024-03-01")
    #expect(LumenCalendarDay(key: "0001-01-01")?.addingDays(-1) == nil)
    #expect(LumenCalendarDay(key: "9999-12-31")?.addingDays(1) == nil)
    #expect(day.addingDays(Int.max) == nil)
    #expect(day.addingMonths(Int.max) == nil)
    for key in ["1900-02-29", "2026-02-29", "0000-01-01", "2026-13-01", String(repeating: "9", count: 100000)] { #expect(LumenCalendarDay(key: key) == nil) }
    #expect(LumenCalendarDay(key: "2000-02-29") != nil)
    #expect(day.grid(firstWeekday: 0).first.flatMap { $0 }?.key == "2026-03-01")
    #expect(day.grid(firstWeekday: 1).first.flatMap { $0 }?.key == "2026-02-23")
    #expect(day.grid(firstWeekday: -1).isEmpty)
    #expect(!day.isSelectable(min: day.addingDays(1), max: day))
    #expect(day.isSelectable(min: day, max: day))
    let event = LumenCalendarEvent(id: "work", label: "Work", startDay: day, endDay: day.addingDays(2))
    #expect(event.contains(day))
    #expect(event.contains(try #require(day.addingDays(2))))
    #expect(!event.contains(try #require(day.addingDays(3))))
}
