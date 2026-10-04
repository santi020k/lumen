#if os(iOS) || os(macOS) || os(visionOS)
import SwiftUI

public struct LumenCalendar: View {
    @Binding private var visibleMonth: LumenCalendarDay
    @Binding private var selectedDay: LumenCalendarDay?
    @Environment(\.isEnabled) private var enabled
    @Environment(\.lumenTheme) private var theme
    private let label: String
    private let events: [LumenCalendarEvent]
    private let min: LumenCalendarDay?
    private let max: LumenCalendarDay?
    private let today: LumenCalendarDay?
    private let firstWeekday: Int
    private let readOnly: Bool
    private let loading: Bool
    private let error: String?
    private let empty: Bool
    private let loadingLabel: String
    private let emptyLabel: String
    private let invalidLabel: String
    private let previousMonthLabel: String
    private let nextMonthLabel: String
    private let todayLabel: String
    private let weekdayLabels: [String]
    private let formatDay: (LumenCalendarDay) -> String
    private let formatMonth: (LumenCalendarDay) -> String
    public init(_ label: String, visibleMonth: Binding<LumenCalendarDay>, selectedDay: Binding<LumenCalendarDay?>,
                events: [LumenCalendarEvent] = [], min: LumenCalendarDay? = nil, max: LumenCalendarDay? = nil,
                today: LumenCalendarDay? = nil, firstWeekday: Int = 1, readOnly: Bool = false,
                loading: Bool = false, error: String? = nil, empty: Bool = false,
                loadingLabel: String = "Loading", emptyLabel: String = "No dates", invalidLabel: String = "Invalid calendar",
                previousMonthLabel: String = "Previous month", nextMonthLabel: String = "Next month", todayLabel: String = "Today",
                weekdayLabels: [String] = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
                formatDay: @escaping (LumenCalendarDay) -> String = { $0.key },
                formatMonth: @escaping (LumenCalendarDay) -> String = { String($0.key.prefix(7)) }) {
        self.label = label; _visibleMonth = visibleMonth; _selectedDay = selectedDay; self.events = events
        self.min = min; self.max = max; self.today = today; self.firstWeekday = firstWeekday; self.readOnly = readOnly
        self.loading = loading; self.error = error; self.empty = empty; self.loadingLabel = loadingLabel
        self.emptyLabel = emptyLabel; self.invalidLabel = invalidLabel; self.previousMonthLabel = previousMonthLabel
        self.nextMonthLabel = nextMonthLabel; self.todayLabel = todayLabel; self.weekdayLabels = weekdayLabels
        self.formatDay = formatDay; self.formatMonth = formatMonth
    }
    private var status: String? {
        if let error { return error }
        if loading { return loadingLabel }
        if empty { return emptyLabel }
        if !(0...6).contains(firstWeekday) || weekdayLabels.count != 7 || (min != nil && max != nil && (min ?? visibleMonth) > (max ?? visibleMonth)) { return invalidLabel }
        return nil
    }
    private func destination(_ amount: Int) -> LumenCalendarDay? {
        guard let next = visibleMonth.monthStart.addingMonths(amount) else { return nil }
        if let max, next > max { return nil }
        if let min, let last = next.addingMonths(1)?.addingDays(-1), last < min { return nil }
        return next
    }
    public var body: some View {
        VStack(alignment: .leading, spacing: LumenSpacing.xs) {
            LumenText(.verbatim(label))
            if let status { LumenText(.verbatim(status)) }
            else {
                HStack {
                    Button { if enabled && !readOnly, let next = destination(-1) { visibleMonth = next } } label: { Text("‹").frame(minWidth: 44, minHeight: 44) }
                        .accessibilityLabel(previousMonthLabel).disabled(readOnly || destination(-1) == nil)
                    Spacer()
                    Text(formatMonth(visibleMonth)).multilineTextAlignment(.center)
                    Spacer()
                    Button { if enabled && !readOnly, let next = destination(1) { visibleMonth = next } } label: { Text("›").frame(minWidth: 44, minHeight: 44) }
                        .accessibilityLabel(nextMonthLabel).disabled(readOnly || destination(1) == nil)
                }
                ScrollView(.horizontal) {
                LazyVGrid(columns: Array(repeating: GridItem(.flexible(minimum: 0), spacing: 0), count: 7), spacing: 0) {
                    ForEach(0..<7, id: \.self) { index in Text(weekdayLabels[(firstWeekday + index) % 7]).font(.caption).frame(maxWidth: .infinity) }
                    ForEach(Array(visibleMonth.grid(firstWeekday: firstWeekday).enumerated()), id: \.offset) { _, day in
                        if let day {
                            let selected = day == selectedDay
                            let indicators = events.filter { $0.contains(day) }
                            Button { if enabled && !readOnly && day.isSelectable(min: min, max: max) { selectedDay = day } } label: {
                                VStack(spacing: 0) {
                                    Text(String(day.day))
                                    if !indicators.isEmpty { Text("•").accessibilityHidden(true) }
                                }.frame(maxWidth: .infinity, minHeight: 44)
                                    .background(selected ? theme.colors.brandSoft : .clear)
                                    .contentShape(Rectangle())
                            }.buttonStyle(.plain)
                                .disabled(readOnly || !day.isSelectable(min: min, max: max))
                                .foregroundStyle(theme.colors.ink)
                                .opacity(day.month == visibleMonth.month ? 1 : 0.52)
                                .accessibilityLabel(([formatDay(day)] + (day == today ? [todayLabel] : []) + indicators.map(\.label)).joined(separator: ", "))
                                .accessibilityAddTraits(selected ? .isSelected : [])
                        } else { Color.clear.frame(minHeight: 44).accessibilityHidden(true) }
                    }
                }.frame(minWidth: 308)
                }
            }
        }.accessibilityElement(children: .contain).accessibilityLabel(label)
    }
}
#endif
