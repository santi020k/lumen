#if os(iOS) || os(macOS) || os(visionOS)
import SwiftUI

public struct LumenAgenda: View {
    @Binding private var selectedDay: LumenCalendarDay
    @Environment(\.isEnabled) private var enabled
    @Environment(\.lumenTheme) private var theme
    private let label: String
    private let events: [LumenAgendaEvent]
    private let dayCount: Int
    private let onEventPress: ((LumenAgendaEvent, LumenCalendarDay) -> Void)?
    private let readOnly: Bool
    private let loading: Bool
    private let error: String?
    private let loadingLabel: String
    private let emptyLabel: String
    private let invalidLabel: String
    private let previousLabel: String
    private let nextLabel: String
    private let allDayLabel: String
    private let formatDay: (LumenCalendarDay) -> String
    private let formatTime: (Int) -> String
    public init(_ label: String, selectedDay: Binding<LumenCalendarDay>, events: [LumenAgendaEvent], dayCount: Int = 7,
                onEventPress: ((LumenAgendaEvent, LumenCalendarDay) -> Void)? = nil, readOnly: Bool = false,
                loading: Bool = false, error: String? = nil, loadingLabel: String = "Loading", emptyLabel: String = "No events",
                invalidLabel: String = "Invalid agenda", previousLabel: String = "Previous days", nextLabel: String = "Next days",
                allDayLabel: String = "All day", formatDay: @escaping (LumenCalendarDay) -> String = { $0.key },
                formatTime: @escaping (Int) -> String = formatLumenAgendaMinute) {
        self.label = label; _selectedDay = selectedDay; self.events = events; self.dayCount = dayCount; self.onEventPress = onEventPress
        self.readOnly = readOnly; self.loading = loading; self.error = error; self.loadingLabel = loadingLabel; self.emptyLabel = emptyLabel
        self.invalidLabel = invalidLabel; self.previousLabel = previousLabel; self.nextLabel = nextLabel; self.allDayLabel = allDayLabel
        self.formatDay = formatDay; self.formatTime = formatTime
    }
    private func destination(_ direction: Int) -> LumenCalendarDay? {
        guard (1...31).contains(dayCount), let day = selectedDay.addingDays(direction * dayCount), day.addingDays(dayCount - 1) != nil else { return nil }
        return day
    }
    public var body: some View {
        let groups = lumenAgendaGroups(events: events, selectedDay: selectedDay, dayCount: dayCount)
        let status = error ?? (loading ? loadingLabel : groups.isEmpty ? invalidLabel : nil)
        VStack(alignment: .leading, spacing: LumenSpacing.sm) {
            LumenText(.verbatim(label)).accessibilityAddTraits(.isHeader)
            if let status { LumenText(.verbatim(status)) }
            else {
                HStack {
                    Button(previousLabel) { if enabled && !readOnly, let day = destination(-1) { selectedDay = day } }.frame(minWidth: 44, minHeight: 44).disabled(readOnly || destination(-1) == nil)
                    Spacer()
                    Button(nextLabel) { if enabled && !readOnly, let day = destination(1) { selectedDay = day } }.frame(minWidth: 44, minHeight: 44).disabled(readOnly || destination(1) == nil)
                }
                ForEach(groups) { group in
                    VStack(alignment: .leading, spacing: LumenSpacing.xs) {
                        LumenText(.verbatim(formatDay(group.day))).accessibilityAddTraits(.isHeader)
                        if group.segments.isEmpty { LumenText(.verbatim(emptyLabel)) }
                        ForEach(group.segments) { segment in
                            let time = segment.startMinute.map { formatTime($0) + " – " + formatTime(segment.endMinute ?? 1440) } ?? allDayLabel
                            let name = [formatDay(group.day), time, segment.event.event.label, segment.event.event.detail ?? ""].filter { !$0.isEmpty }.joined(separator: ", ")
                            if let onEventPress {
                                Button { if enabled && !readOnly && !segment.event.event.disabled { onEventPress(segment.event, group.day) } } label: { row(segment, time: time) }
                                    .buttonStyle(.plain).disabled(readOnly || segment.event.event.disabled).accessibilityLabel(name)
                            } else { row(segment, time: time).accessibilityElement(children: .ignore).accessibilityLabel(name) }
                        }
                    }.padding(LumenSpacing.sm).frame(maxWidth: .infinity, alignment: .leading)
                        .background(theme.colors.surface).overlay(alignment: .bottom) { Rectangle().fill(theme.colors.line).frame(height: 1) }
                }
            }
        }.accessibilityElement(children: .contain).accessibilityLabel(label)
    }
    private func row(_ segment: LumenAgendaSegment, time: String) -> some View {
        VStack(alignment: .leading, spacing: LumenSpacing.xs) {
            LumenText(.verbatim(segment.event.event.label))
            LumenText(.verbatim(time))
            if let detail = segment.event.event.detail { LumenText(.verbatim(detail)) }
        }.frame(maxWidth: .infinity, minHeight: 44, alignment: .leading).contentShape(Rectangle())
    }
}
#endif
