import SwiftUI
import LumenUI

struct AgendaParityExample: View {
    @State private var day = LumenCalendarDay(year: 2026, month: 3, day: 8)
    @State private var readOnly = false
    @State private var loading = false
    @State private var error = false
    @State private var empty = false
    @State private var message = "Choose an event"
    var body: some View {
        VStack(alignment: .leading) {
            LumenCheckbox("Read only", isChecked: $readOnly)
            LumenCheckbox("Loading", isChecked: $loading)
            LumenCheckbox("Error", isChecked: $error)
            LumenCheckbox("Empty", isChecked: $empty)
            if let day, let start = LumenCalendarDay(key: "2026-03-08"), let end = start.addingDays(2) {
                LumenAgenda("Project agenda", selectedDay: Binding(get: { self.day ?? day }, set: { self.day = $0 }), events: empty ? [] : [
                    .init(event: .init(id: "review", label: "Design review", startDay: start), startMinute: 600, endMinute: 660),
                    .init(event: .init(id: "release", label: "Release preparation", startDay: start, endDay: end, detail: "All-day work")),
                    .init(event: .init(id: "handoff", label: "Overnight handoff", startDay: start, endDay: start.addingDays(1)), startMinute: 1380, endMinute: 60)
                ], dayCount: 3, onEventPress: { event, date in message = "\(event.event.label): \(date.key)" }, readOnly: readOnly, loading: loading, error: error ? "Agenda unavailable" : nil)
            }
            LumenText(.verbatim(message))
        }
    }
}
