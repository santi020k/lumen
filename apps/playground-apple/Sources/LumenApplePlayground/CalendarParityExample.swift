import SwiftUI
import LumenUI
struct CalendarParityExample: View {
    @State private var month = LumenCalendarDay(year: 2026, month: 3, day: 1)
    @State private var day = LumenCalendarDay(year: 2026, month: 3, day: 8)
    @State private var readOnly = false
    @State private var loading = false
    @State private var error = false
    var body: some View {
        VStack(alignment: .leading) {
            LumenCheckbox("Read only", isChecked: $readOnly)
            LumenCheckbox("Loading", isChecked: $loading)
            LumenCheckbox("Error", isChecked: $error)
            if let month {
                LumenCalendar("Project calendar", visibleMonth: Binding(get: { self.month ?? month }, set: { self.month = $0 }), selectedDay: $day,
                    events: [.init(id: "review", label: "Design review", startDay: LumenCalendarDay(year: 2026, month: 3, day: 10) ?? month)],
                    min: LumenCalendarDay(year: 2026, month: 3, day: 5), max: LumenCalendarDay(year: 2026, month: 4, day: 20),
                    readOnly: readOnly, loading: loading, error: error ? "Calendar unavailable" : nil)
            }
            LumenText(.verbatim("Selected: \(day?.key ?? "None")"))
        }
    }
}
