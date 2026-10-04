#if os(iOS) || os(macOS) || os(visionOS)
import SwiftUI

public struct LumenSchedule: View {
    @Binding private var selectedDay: LumenCalendarDay
    @Environment(\.isEnabled) private var enabled
    @Environment(\.lumenTheme) private var theme
    @State private var focusedID: String?
    @State private var focusedDay: LumenCalendarDay?
    private let label: String
    private let events: [LumenAgendaEvent]
    private let dayCount: Int
    private let startHour: Int
    private let endHour: Int
    private let onEventPress: ((LumenAgendaEvent, LumenCalendarDay) -> Void)?
    private let onEventMove: ((LumenAgendaEvent, LumenCalendarDay) -> Void)?
    private let readOnly: Bool
    private let loading: Bool
    private let error: String?
    private let loadingLabel: String
    private let emptyLabel: String
    private let invalidLabel: String
    private let previousLabel: String
    private let nextLabel: String
    private let previousDayLabel: String
    private let nextDayLabel: String
    private let allDayLabel: String
    private let formatDay: (LumenCalendarDay) -> String
    private let formatTime: (Int) -> String
    public init(_ label: String, selectedDay: Binding<LumenCalendarDay>, events: [LumenAgendaEvent], dayCount: Int = 7,
        startHour: Int = 8, endHour: Int = 18, onEventPress: ((LumenAgendaEvent, LumenCalendarDay) -> Void)? = nil,
        onEventMove: ((LumenAgendaEvent, LumenCalendarDay) -> Void)? = nil, readOnly: Bool = false,
        loading: Bool = false, error: String? = nil, loadingLabel: String = "Loading", emptyLabel: String = "No events in this time range",
        invalidLabel: String = "Invalid schedule", previousLabel: String = "Previous range", nextLabel: String = "Next range",
        previousDayLabel: String = "Move to previous day", nextDayLabel: String = "Move to next day", allDayLabel: String = "All day",
        formatDay: @escaping (LumenCalendarDay) -> String = { $0.key }, formatTime: @escaping (Int) -> String = formatLumenAgendaMinute) {
        self.label = label; _selectedDay = selectedDay; self.events = events; self.dayCount = dayCount; self.startHour = startHour; self.endHour = endHour
        self.onEventPress = onEventPress; self.onEventMove = onEventMove; self.readOnly = readOnly; self.loading = loading; self.error = error
        self.loadingLabel = loadingLabel; self.emptyLabel = emptyLabel; self.invalidLabel = invalidLabel
        self.previousLabel = previousLabel; self.nextLabel = nextLabel; self.previousDayLabel = previousDayLabel; self.nextDayLabel = nextDayLabel
        self.allDayLabel = allDayLabel; self.formatDay = formatDay; self.formatTime = formatTime
    }
    private var days: [LumenScheduleDay] { lumenScheduleLayout(events: events, selectedDay: selectedDay, dayCount: dayCount, startHour: startHour, endHour: endHour) }
    private func destination(_ direction: Int) -> LumenCalendarDay? {
        guard (1...7).contains(dayCount), let day = selectedDay.addingDays(direction * dayCount), day.addingDays(dayCount - 1) != nil else { return nil }
        return day
    }
    private func width(_ day: LumenScheduleDay) -> CGFloat { CGFloat(max(200, (day.placements.map(\.laneCount).max() ?? 1) * 100)) }
    private func event(_ segment: LumenAgendaSegment, day: LumenCalendarDay) -> some View {
        let time = segment.startMinute.map { formatTime($0) + " – " + formatTime(segment.endMinute ?? 1440) } ?? allDayLabel
        let name = [formatDay(day), time, segment.event.event.label, segment.event.event.detail ?? ""].filter { !$0.isEmpty }.joined(separator: ", ")
        return Button {
            if enabled && !readOnly && !segment.event.event.disabled {
                focusedID = segment.id; focusedDay = day; onEventPress?(segment.event, day)
            }
        } label: {
            LumenText(.verbatim(segment.event.event.label)).lineLimit(2).padding(LumenSpacing.xs)
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading).background(theme.colors.brandSoft).contentShape(Rectangle())
        }.buttonStyle(.plain).disabled(readOnly || segment.event.event.disabled || (onEventPress == nil && onEventMove == nil)).accessibilityLabel(name)
    }
    public var body: some View {
        let days = self.days
        let status = error ?? (loading ? loadingLabel : days.isEmpty ? invalidLabel : nil)
        VStack(alignment: .leading, spacing: LumenSpacing.sm) {
            LumenText(.verbatim(label)).accessibilityAddTraits(.isHeader)
            if let status { LumenText(.verbatim(status)) }
            else {
                HStack {
                    Button(previousLabel) { if enabled && !readOnly, let day = destination(-1) { selectedDay = day } }.frame(minWidth: 44, minHeight: 44).disabled(readOnly || destination(-1) == nil)
                    Spacer()
                    Button(nextLabel) { if enabled && !readOnly, let day = destination(1) { selectedDay = day } }.frame(minWidth: 44, minHeight: 44).disabled(readOnly || destination(1) == nil)
                }
                if days.allSatisfy({ $0.allDay.isEmpty && $0.placements.isEmpty }) { LumenText(.verbatim(emptyLabel)) }
                grid(days)
                if let onEventMove, let focusedDay, let group = days.first(where: { $0.day == focusedDay }),
                   let segment = (group.allDay + group.placements.map(\.segment)).first(where: { $0.id == focusedID }) {
                    LumenText(.verbatim(segment.event.event.label))
                    ForEach([-1, 1], id: \.self) { direction in
                        Button(direction < 0 ? previousDayLabel : nextDayLabel) {
                            if enabled && !readOnly && !segment.event.event.disabled, let target = focusedDay.addingDays(direction) { onEventMove(segment.event, target) }
                        }.frame(minWidth: 44, minHeight: 44).disabled(readOnly || segment.event.event.disabled || focusedDay.addingDays(direction) == nil)
                    }
                }
            }
        }.accessibilityElement(children: .contain).accessibilityLabel(label)
    }
    private func grid(_ days: [LumenScheduleDay]) -> some View {
        let allDayHeight = CGFloat(max(1, days.map { $0.allDay.count }.max() ?? 0) * 48)
        let height = CGFloat((endHour - startHour) * 60)
        return ScrollView(.horizontal) {
            ScrollView(.vertical) {
                HStack(alignment: .top, spacing: 0) {
                    VStack(spacing: 0) {
                        LumenText(.verbatim(allDayLabel)).frame(height: 44 + allDayHeight, alignment: .top)
                        ZStack(alignment: .topLeading) {
                            ForEach(startHour...endHour, id: \.self) { hour in
                                LumenText(.verbatim(formatTime(hour * 60))).font(.caption).offset(y: min(CGFloat((hour - startHour) * 60), height - 20))
                            }
                        }.frame(width: 64, height: height, alignment: .topLeading)
                    }.frame(width: 64)
                    ForEach(days) { day in
                        VStack(spacing: 0) {
                            LumenText(.verbatim(formatDay(day.day))).accessibilityAddTraits(.isHeader).frame(height: 44)
                            VStack(spacing: 0) {
                                ForEach(day.allDay) { segment in event(segment, day: day.day).frame(height: 48) }
                                Spacer(minLength: 0)
                            }.frame(height: allDayHeight)
                            ZStack(alignment: .topLeading) {
                                ForEach(startHour..<endHour, id: \.self) { hour in Rectangle().fill(theme.colors.line).frame(height: 1).offset(y: CGFloat((hour - startHour) * 60)).accessibilityHidden(true) }
                                ForEach(day.placements) { item in
                                    event(item.segment, day: day.day).frame(width: width(day) / CGFloat(item.laneCount) - 4, height: CGFloat(item.height)).clipped()
                                        .offset(x: CGFloat(item.lane) * width(day) / CGFloat(item.laneCount) + 2, y: CGFloat(item.top))
                                }
                            }.frame(width: width(day), height: height, alignment: .topLeading)
                        }.frame(width: width(day)).overlay(alignment: .leading) { Rectangle().fill(theme.colors.line).frame(width: 1).accessibilityHidden(true) }
                    }
                }
            }.frame(height: 480)
        }
    }
}
#endif
