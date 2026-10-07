import SwiftUI

public struct LumenCalendarHeatmapDatum: Sendable {
    public let date: String
    public let value: Double?
    public init(date: String, value: Double?) { self.date = date; self.value = value }
}

public struct LumenFunnelDatum: Sendable {
    public let id: String
    public let label: String
    public let value: Double?
    public let tone: LumenChartTone?
    public init(id: String, label: String, value: Double?, tone: LumenChartTone? = nil) {
        self.id = id; self.label = label; self.value = value; self.tone = tone
    }
}

public struct LumenBoxPlotDatum: Sendable {
    public let id: String
    public let label: String
    public let min: Double?
    public let q1: Double?
    public let median: Double?
    public let q3: Double?
    public let max: Double?
    public let outliers: [Double]
    public let tone: LumenChartTone?
    public init(id: String, label: String, min: Double?, q1: Double?, median: Double?, q3: Double?, max: Double?, outliers: [Double] = [], tone: LumenChartTone? = nil) {
        self.id = id; self.label = label; self.min = min; self.q1 = q1; self.median = median
        self.q3 = q3; self.max = max; self.outliers = outliers; self.tone = tone
    }
    var statistics: [Double?] { [min, q1, median, q3, max] }
}

public struct LumenBoxPlotLabels: Sendable {
    public let minimum: String
    public let firstQuartile: String
    public let median: String
    public let thirdQuartile: String
    public let maximum: String
    public let outliers: String
    public init(minimum: String = "Lower whisker", firstQuartile: String = "First quartile", median: String = "Median", thirdQuartile: String = "Third quartile", maximum: String = "Upper whisker", outliers: String = "Outliers") {
        self.minimum = minimum; self.firstQuartile = firstQuartile; self.median = median
        self.thirdQuartile = thirdQuartile; self.maximum = maximum; self.outliers = outliers
    }
    var statistics: [String] { [minimum, firstQuartile, median, thirdQuartile, maximum] }
}

private func lumenExpandedIdentity(_ id: String, _ label: String, ids: inout Set<String>) -> Bool {
    !id.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty && !label.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty && ids.insert(id).inserted
}

struct LumenFunnelModel {
    let valid: Bool
    let maximum: Double
    func ratio(_ value: Double) -> Double { maximum > 0 ? value / maximum : 0 }
}
func lumenFunnelModel(_ data: [LumenFunnelDatum]) -> LumenFunnelModel {
    var ids = Set<String>(); var maximum = 0.0
    for row in data {
        guard lumenExpandedIdentity(row.id, row.label, ids: &ids), row.value?.isFinite != false, (row.value ?? 0) >= 0 else { return .init(valid: false, maximum: 0) }
        maximum = max(maximum, row.value ?? 0)
    }
    return .init(valid: true, maximum: maximum)
}

struct LumenBoxPlotModel {
    let valid: Bool
    let domain: ClosedRange<Double>
    func position(_ value: Double) -> Double { lumenChartRatio(value, domain: domain) }
    var ticks: [Double] { [domain.lowerBound, domain.lowerBound / 2 + domain.upperBound / 2, domain.upperBound] }
}
private func lumenExpandedDomain(_ values: [Double], requested: ClosedRange<Double>?) -> ClosedRange<Double>? {
    let low = values.min() ?? 0
    let high = values.max() ?? 1
    let automatic: ClosedRange<Double>
    if low != high { automatic = low...high }
    else {
        let padding = max(1, abs(low) * 0.01)
        let lower = low - padding
        let upper = high + padding
        automatic = (lower.isFinite ? lower : low)...(upper.isFinite ? upper : high)
    }
    let result = requested ?? automatic
    guard result.lowerBound.isFinite, result.upperBound.isFinite, result.lowerBound < result.upperBound,
          values.allSatisfy({ result.contains($0) }) else { return nil }
    return result
}
func lumenBoxPlotModel(_ data: [LumenBoxPlotDatum], domain: ClosedRange<Double>?) -> LumenBoxPlotModel {
    let invalid = LumenBoxPlotModel(valid: false, domain: 0...1)
    var ids = Set<String>(); var observed: [Double] = []
    for row in data {
        let stats = row.statistics.compactMap { $0 }
        guard lumenExpandedIdentity(row.id, row.label, ids: &ids), stats.count == 0 || stats.count == 5,
              stats.allSatisfy(\.isFinite), row.outliers.allSatisfy(\.isFinite),
              zip(stats, stats.dropFirst()).allSatisfy({ $0 <= $1 }),
              !stats.isEmpty || row.outliers.isEmpty else { return invalid }
        observed.append(contentsOf: stats + row.outliers)
    }
    guard let resolved = lumenExpandedDomain(observed, requested: domain) else { return invalid }
    return .init(valid: true, domain: resolved)
}

private var lumenUTCCalendar: Calendar {
    var calendar = Calendar(identifier: .iso8601)
    calendar.timeZone = TimeZone(secondsFromGMT: 0) ?? .gmt
    return calendar
}
func lumenCalendarDate(_ text: String) -> Date? {
    let bytes = Array(text.utf8)
    guard bytes.count == 10, bytes[4] == 45, bytes[7] == 45,
          bytes.enumerated().allSatisfy({ $0.offset == 4 || $0.offset == 7 || (48...57).contains($0.element) }),
          let year = Int(text.prefix(4)), let month = Int(text.dropFirst(5).prefix(2)), let day = Int(text.suffix(2)), year > 0 else { return nil }
    guard (1...12).contains(month) else { return nil }
    let leap = year % 4 == 0 && (year % 100 != 0 || year % 400 == 0)
    let lengths = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
    guard (1...lengths[month - 1]).contains(day) else { return nil }
    // Civil arithmetic is proleptic Gregorian; Foundation calendars retain the 1582 calendar transition.
    let adjustedYear = year - (month <= 2 ? 1 : 0)
    let era = adjustedYear / 400
    let yearOfEra = adjustedYear - era * 400
    let shiftedMonth = month + (month > 2 ? -3 : 9)
    let dayOfYear = (153 * shiftedMonth + 2) / 5 + day - 1
    let dayOfEra = yearOfEra * 365 + yearOfEra / 4 - yearOfEra / 100 + dayOfYear
    return Date(timeIntervalSince1970: Double(era * 146097 + dayOfEra - 719468) * 86_400)
}
struct LumenCalendarCell {
    let date: String
    let value: Double?
    let column: Int
    let row: Int
}
struct LumenCalendarHeatmapModel {
    let valid: Bool
    let cells: [LumenCalendarCell]
    let domain: ClosedRange<Double>
    let weeks: Int
    var availableValueCount: Int { cells.filter { $0.value != nil }.count }
    func intensity(_ value: Double) -> Double { lumenChartRatio(value, domain: domain) }
}
func lumenCalendarHeatmapModel(_ data: [LumenCalendarHeatmapDatum], startDate: String, endDate: String, weekStartsOn: Int, domain: ClosedRange<Double>?, weekdayLabels: [String]? = nil) -> LumenCalendarHeatmapModel {
    let invalid = LumenCalendarHeatmapModel(valid: false, cells: [], domain: 0...1, weeks: 0)
    guard weekdayLabels.map({ $0.count == 7 && $0.allSatisfy { !$0.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty } }) != false,
          weekStartsOn == 0 || weekStartsOn == 1, let start = lumenCalendarDate(startDate), let end = lumenCalendarDate(endDate), end >= start else { return invalid }
    let days = Int((end.timeIntervalSince1970 - start.timeIntervalSince1970) / 86_400) + 1
    guard days <= 3660 else { return invalid }
    var entries: [String: LumenCalendarHeatmapDatum] = [:]
    for datum in data {
        guard let date = lumenCalendarDate(datum.date), date >= start, date <= end, datum.value?.isFinite != false, entries[datum.date] == nil else { return invalid }
        entries[datum.date] = datum
    }
    guard let resolved = lumenExpandedDomain(data.compactMap(\.value), requested: domain) else { return invalid }
    let epochDay = Int(start.timeIntervalSince1970 / 86_400)
    let sundayRow = ((epochDay + 4) % 7 + 7) % 7
    let offset = (sundayRow - weekStartsOn + 7) % 7
    var cells: [LumenCalendarCell] = []
    for index in 0..<days {
        let shifted = epochDay + index + 719468
        let era = shifted / 146097
        let dayOfEra = shifted - era * 146097
        let yearOfEra = (dayOfEra - dayOfEra / 1460 + dayOfEra / 36524 - dayOfEra / 146096) / 365
        let dayOfYear = dayOfEra - (365 * yearOfEra + yearOfEra / 4 - yearOfEra / 100)
        let shiftedMonth = (5 * dayOfYear + 2) / 153
        let day = dayOfYear - (153 * shiftedMonth + 2) / 5 + 1
        let month = shiftedMonth + (shiftedMonth < 10 ? 3 : -9)
        let year = yearOfEra + era * 400 + (month <= 2 ? 1 : 0)
        let key = String(format: "%04d-%02d-%02d", year, month, day)
        cells.append(.init(date: key, value: entries[key]?.value, column: (index + offset) / 7, row: (index + offset) % 7))
    }
    return .init(valid: true, cells: cells, domain: resolved, weeks: (days + offset + 6) / 7)
}

private func lumenExpandedTone(_ index: Int) -> LumenChartTone { [.series1, .series2, .series3, .series4, .series5, .series6, .series7, .series8][index % 8] }

public struct LumenFunnelChart: View {
    @Environment(\.lumenTheme) private var theme
    private let data: [LumenFunnelDatum]
    private let label: String
    private let heading: String?
    private let description: String?
    private let labels: LumenChartLabels
    private let showData: Bool
    public init(data: [LumenFunnelDatum], label: String, heading: String? = nil, description: String? = nil, labels: LumenChartLabels = .english, showData: Bool = true) {
        self.data = data; self.label = label; self.heading = heading; self.description = description; self.labels = labels; self.showData = showData
    }
    public var body: some View {
        let model = lumenFunnelModel(data)
        LumenChartFrame(label: label, heading: heading, description: description, summary: model.valid ? "\(labels.count): \(data.count)." : labels.invalidData) {
            if !model.valid || data.isEmpty { Text(model.valid ? labels.empty : labels.invalidData).foregroundStyle(theme.colors.inkSoft) }
            else {
                ForEach(Array(data.enumerated()), id: \.element.id) { index, row in
                    VStack(alignment: .leading, spacing: LumenSpacing.xs) {
                        ViewThatFits(in: .horizontal) {
                            HStack { Text(row.label); Spacer(); Text(format(row.value)).bold().monospacedDigit() }
                            VStack(alignment: .leading) { Text(row.label); Text(format(row.value)).bold().monospacedDigit() }
                        }.foregroundStyle(theme.colors.ink)
                        Canvas { context, size in
                            context.fill(Path(roundedRect: CGRect(origin: .zero, size: size), cornerRadius: 3), with: .color(theme.colors.surfaceMuted))
                            if let value = row.value {
                                let width = model.ratio(value) * size.width
                                context.fill(Path(roundedRect: CGRect(x: (size.width - width) / 2, y: 0, width: width, height: size.height), cornerRadius: 3), with: .color(theme.chartColor(row.tone ?? lumenExpandedTone(index))))
                                if value == 0 { context.fill(Path(CGRect(x: size.width / 2 - 1, y: 0, width: 2, height: size.height)), with: .color(theme.colors.ink)) }
                            } else { context.draw(Text("×").foregroundColor(theme.colors.inkSoft), at: CGPoint(x: size.width / 2, y: size.height / 2)) }
                        }.frame(height: 28).accessibilityHidden(true)
                    }
                }
                if showData { LumenStructuredChartDataList(labels: labels, rows: data.map { .init(id: $0.id, label: "\($0.label). \(labels.value): \(format($0.value)).") }) }
            }
        }
    }
    private func format(_ value: Double?) -> String { value.map(labels.formatValue) ?? labels.notAvailable }
}

public struct LumenBoxPlot: View {
    @Environment(\.lumenTheme) private var theme
    private let data: [LumenBoxPlotDatum]
    private let label: String
    private let domain: ClosedRange<Double>?
    private let heading: String?
    private let description: String?
    private let labels: LumenChartLabels
    private let statisticLabels: LumenBoxPlotLabels
    private let showData: Bool
    public init(data: [LumenBoxPlotDatum], label: String, domain: ClosedRange<Double>? = nil, heading: String? = nil, description: String? = nil, labels: LumenChartLabels = .english, statisticLabels: LumenBoxPlotLabels = .init(), showData: Bool = true) {
        self.data = data; self.label = label; self.domain = domain; self.heading = heading; self.description = description; self.labels = labels; self.statisticLabels = statisticLabels; self.showData = showData
    }
    public var body: some View {
        let model = lumenBoxPlotModel(data, domain: domain)
        LumenChartFrame(label: label, heading: heading, description: description, summary: model.valid ? (showData ? "\(labels.count): \(data.count)." : data.map(exact).joined(separator: " ")) : labels.invalidData) {
            if !model.valid || data.isEmpty { Text(model.valid ? labels.empty : labels.invalidData).foregroundStyle(theme.colors.inkSoft) }
            else {
                ForEach(Array(data.enumerated()), id: \.element.id) { index, row in
                    VStack(alignment: .leading, spacing: LumenSpacing.xs) {
                        Text(row.label).font(.callout.bold()).foregroundStyle(theme.colors.ink)
                        Text("\(statisticLabels.median): \(row.median.map(labels.formatValue) ?? labels.notAvailable)").font(.caption).foregroundStyle(theme.colors.inkSoft)
                        plot(row, model: model, tone: row.tone ?? lumenExpandedTone(index))
                    }
                }
                HStack {
                    ForEach(Array(model.ticks.enumerated()), id: \.offset) { index, tick in
                        Text(labels.formatValue(tick)).font(.caption).monospacedDigit().foregroundStyle(theme.colors.inkSoft)
                            .frame(maxWidth: .infinity, alignment: index == 0 ? .leading : index == 2 ? .trailing : .center)
                    }
                }
                if showData { LumenStructuredChartDataList(labels: labels, rows: data.map { .init(id: $0.id, label: exact($0)) }) }
            }
        }
    }
    private func exact(_ row: LumenBoxPlotDatum) -> String {
        let stats = zip(statisticLabels.statistics, row.statistics).map { "\($0): \($1.map(labels.formatValue) ?? labels.notAvailable)" }.joined(separator: ". ")
        return "\(row.label). \(stats). \(statisticLabels.outliers): \(row.outliers.isEmpty ? labels.notAvailable : row.outliers.map(labels.formatValue).joined(separator: ", "))."
    }
    private func plot(_ row: LumenBoxPlotDatum, model: LumenBoxPlotModel, tone: LumenChartTone) -> some View {
        Canvas { context, size in
            let width = max(0, size.width - 16)
            let color = theme.chartColor(tone)
            func x(_ value: Double) -> Double { 8 + model.position(value) * width }
            guard let minimum = row.min, let first = row.q1, let median = row.median, let third = row.q3, let maximum = row.max else {
                context.draw(Text("×").foregroundColor(theme.colors.inkSoft), at: CGPoint(x: size.width / 2, y: 20)); return
            }
            context.fill(Path(CGRect(x: x(minimum), y: 19, width: max(1, x(maximum) - x(minimum)), height: 2)), with: .color(color))
            for value in [minimum, maximum] { context.fill(Path(CGRect(x: x(value) - 1, y: 10, width: 2, height: 20)), with: .color(color)) }
            let box = Path(CGRect(x: x(first), y: 5, width: max(1, x(third) - x(first)), height: 30))
            context.fill(box, with: .color(color.opacity(0.2))); context.stroke(box, with: .color(color), lineWidth: 2)
            context.fill(Path(CGRect(x: x(median) - 2, y: 3, width: 4, height: 34)), with: .color(theme.colors.surface))
            context.fill(Path(CGRect(x: x(median) - 1, y: 3, width: 2, height: 34)), with: .color(theme.colors.ink))
            for value in row.outliers {
                let dot = Path(ellipseIn: CGRect(x: x(value) - 3, y: 17, width: 6, height: 6))
                context.fill(dot, with: .color(theme.colors.surface)); context.stroke(dot, with: .color(color), lineWidth: 2)
            }
        }.frame(height: 40).accessibilityHidden(true)
    }
}

public struct LumenCalendarHeatmap: View {
    @ScaledMetric(relativeTo: .caption2) private var cellStride: CGFloat = 20
    @ScaledMetric(relativeTo: .caption2) private var weekLabelHeight: CGFloat = 22
    @Environment(\.lumenTheme) private var theme
    @Environment(\.locale) private var locale
    private let data: [LumenCalendarHeatmapDatum]
    private let label: String
    private let startDate: String
    private let endDate: String
    private let weekStartsOn: Int
    private let domain: ClosedRange<Double>?
    private let heading: String?
    private let description: String?
    private let labels: LumenChartLabels
    private let formatDate: @Sendable (String) -> String
    private let weekdayLabels: [String]?
    private let showData: Bool
    public init(data: [LumenCalendarHeatmapDatum], label: String, startDate: String, endDate: String, weekStartsOn: Int = 0, domain: ClosedRange<Double>? = nil, heading: String? = nil, description: String? = nil, labels: LumenChartLabels = .english, weekdayLabels: [String]? = nil, formatDate: @escaping @Sendable (String) -> String = { $0 }, showData: Bool = true) {
        self.data = data; self.label = label; self.startDate = startDate; self.endDate = endDate; self.weekStartsOn = weekStartsOn; self.domain = domain; self.heading = heading; self.description = description; self.labels = labels; self.weekdayLabels = weekdayLabels; self.formatDate = formatDate; self.showData = showData
    }
    public var body: some View {
        let model = lumenCalendarHeatmapModel(data, startDate: startDate, endDate: endDate, weekStartsOn: weekStartsOn, domain: domain, weekdayLabels: weekdayLabels)
        LumenChartFrame(label: label, heading: heading, description: description, summary: model.valid ? (showData ? "\(formatDate(startDate)) – \(formatDate(endDate)). \(labels.count): \(model.availableValueCount)." : model.cells.map { "\(formatDate($0.date)): \($0.value.map(labels.formatValue) ?? labels.notAvailable)." }.joined(separator: " ")) : labels.invalidData) {
            if model.valid {
                HStack(alignment: .top, spacing: LumenSpacing.sm) {
                    VStack(alignment: .trailing, spacing: 3) {
                        Color.clear.frame(height: weekLabelHeight)
                        ForEach(0..<7, id: \.self) { row in Text(weekdays[(row + weekStartsOn) % 7]).font(.caption2).foregroundStyle(theme.colors.inkSoft).frame(height: cellStride - 3) }
                    }.fixedSize(horizontal: true, vertical: false).accessibilityHidden(true)
                    ScrollView(.horizontal) {
                        VStack(alignment: .leading, spacing: 3) {
                            HStack(spacing: 3) {
                                ForEach(0..<model.weeks, id: \.self) { week in
                                    Color.clear.frame(width: cellStride - 3, height: weekLabelHeight).overlay(alignment: .leading) {
                                        if week % 6 == 0 { Text(weekLabel(model, week: week)).font(.caption2).foregroundStyle(theme.colors.inkSoft).fixedSize() }
                                    }
                                }
                            }
                            Canvas { context, _ in
                                for cell in model.cells {
                                    let rect = CGRect(x: CGFloat(cell.column) * cellStride, y: CGFloat(cell.row) * cellStride, width: cellStride - 3, height: cellStride - 3)
                                    let path = Path(roundedRect: rect, cornerRadius: 3)
                                    let color = cell.value.map { theme.colors.brand.opacity(0.16 + model.intensity($0) * 0.84) } ?? theme.colors.surfaceMuted
                                    context.fill(path, with: .color(color))
                                    if cell.value == nil { context.draw(Text("×").font(.caption2).foregroundColor(theme.colors.inkSoft), at: CGPoint(x: rect.midX, y: rect.midY)) }
                                }
                            }.frame(width: CGFloat(model.weeks) * cellStride - 3, height: cellStride * 7 - 3)
                        }.frame(minWidth: cellStride * 6, alignment: .leading).accessibilityHidden(true)
                    }
                }
                HStack(spacing: LumenSpacing.sm) {
                    Text(labels.formatValue(model.domain.lowerBound)).font(.caption)
                    LinearGradient(colors: [theme.colors.brand.opacity(0.16), theme.colors.brand], startPoint: .leading, endPoint: .trailing).frame(width: 64, height: 10).accessibilityHidden(true)
                    Text(labels.formatValue(model.domain.upperBound)).font(.caption)
                    Text("× \(labels.notAvailable)").font(.caption)
                }.foregroundStyle(theme.colors.inkSoft)
                if showData { LumenStructuredChartDataList(labels: labels, rows: model.cells.map { .init(id: $0.date, label: "\(formatDate($0.date)). \(labels.value): \($0.value.map(labels.formatValue) ?? labels.notAvailable).") }) }
            } else { Text(labels.invalidData).foregroundStyle(theme.colors.inkSoft) }
        }
    }
    private var weekdays: [String] {
        if let weekdayLabels, weekdayLabels.count == 7 { return weekdayLabels }
        let formatter = DateFormatter(); formatter.locale = locale; formatter.calendar = lumenUTCCalendar
        return formatter.shortWeekdaySymbols
    }
    private func weekLabel(_ model: LumenCalendarHeatmapModel, week: Int) -> String {
        guard let cell = model.cells.first(where: { $0.column == week }) else { return "" }
        return formatDate(cell.date)
    }
}
