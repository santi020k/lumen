import SwiftUI
import LumenUI

struct ScheduleParityExample: View {
    @State private var day = LumenCalendarDay(key: "2026-03-08")
    @State private var events: [LumenAgendaEvent] = []
    @State private var readOnly = false
    @State private var loading = false
    @State private var error = false
    @State private var empty = false
    @State private var dayView = false
    @State private var message = "Select an event to move it"
    var body: some View {
        VStack(alignment: .leading) {
            LumenCheckbox("Day view", isChecked: $dayView)
            LumenCheckbox("Read only", isChecked: $readOnly)
            LumenCheckbox("Loading", isChecked: $loading)
            LumenCheckbox("Error", isChecked: $error)
            LumenCheckbox("Empty", isChecked: $empty)
            if let day {
                LumenSchedule("Launch schedule", selectedDay: Binding(get: { self.day ?? day }, set: { self.day = $0 }), events: empty ? [] : events,
                    dayCount: dayView ? 1 : 7, onEventPress: { event, _ in message = "Selected \(event.event.label)" }, onEventMove: move,
                    readOnly: readOnly, loading: loading, error: error ? "Schedule unavailable" : nil)
            }
            LumenText(.verbatim(message))
        }.onAppear {
            if events.isEmpty, let start = LumenCalendarDay(key: "2026-03-08") {
                events = [
                    .init(event: .init(id: "planning", label: "Planning", startDay: start), startMinute: 600, endMinute: 660),
                    .init(event: .init(id: "review", label: "Review", startDay: start), startMinute: 630, endMinute: 720),
                    .init(event: .init(id: "ship", label: "Ship", startDay: start), startMinute: 840, endMinute: 845),
                    .init(event: .init(id: "launch", label: "Launch week", startDay: start, endDay: start.addingDays(2))),
                    .init(event: .init(id: "handoff", label: "Overnight handoff", startDay: start, endDay: start.addingDays(1)), startMinute: 1020, endMinute: 570)
                ]
            }
        }
    }
    private func move(_ input: LumenAgendaEvent, _ target: LumenCalendarDay) {
        let duration = input.event.endDay.ordinal - input.event.startDay.ordinal
        guard let end = target.addingDays(duration) else { return }
        events = events.map { item in
            guard item.id == input.id else { return item }
            let event = LumenCalendarEvent(id: item.id, label: item.event.label, startDay: target, endDay: end, detail: item.event.detail, disabled: item.event.disabled)
            return LumenAgendaEvent(event: event, startMinute: item.startMinute, endMinute: item.endMinute)
        }
        message = "Moved \(input.event.label) to \(target.key)"
    }
}
