import Charts
import SwiftUI

public enum LumenChartTone: String, CaseIterable, Sendable {
    case accent
    case brand
    case danger
    case neutral
    case series1
    case series2
    case series3
    case series4
    case series5
    case series6
    case series7
    case series8
    case success
    case warning
}

public enum LumenChartX: Hashable, Sendable {
    case category(String)
    case number(Double)
    case time(Date)

    public var label: String {
        switch self {
        case .category(let value): value
        case .number(let value): value.formatted()
        case .time(let value): value.formatted(date: .abbreviated, time: .shortened)
        }
    }
}

public struct LumenChartDatum: Identifiable, Sendable {
    public let id: String
    public let label: String?
    public let size: Double?
    public let x: LumenChartX
    public let y: Double?

    public init(
        id: String,
        x: LumenChartX,
        y: Double?,
        label: String? = nil,
        size: Double? = nil
    ) {
        self.id = id
        self.x = x
        self.y = y
        self.label = label
        self.size = size
    }
}

public enum LumenComboMark: Sendable {
    case area
    case bar
    case line
}

public struct LumenChartSeries: Identifiable, Sendable {
    public let data: [LumenChartDatum]
    public let id: String
    public let label: String
    public let mark: LumenComboMark
    public let tone: LumenChartTone?

    public init(
        id: String,
        label: String,
        data: [LumenChartDatum],
        tone: LumenChartTone? = nil,
        mark: LumenComboMark = .line
    ) {
        self.id = id
        self.label = label
        self.data = data
        self.tone = tone
        self.mark = mark
    }
}

public struct LumenChartSelection: Equatable, Sendable {
    public let seriesID: String
    public let x: LumenChartX

    public init(seriesID: String, x: LumenChartX) {
        self.seriesID = seriesID
        self.x = x
    }
}

public struct LumenRangeDatum: Identifiable, Sendable {
    public let high: Double?
    public let id: String
    public let label: String?
    public let low: Double?
    public let x: LumenChartX

    public init(id: String, x: LumenChartX, low: Double?, high: Double?, label: String? = nil) {
        self.id = id
        self.x = x
        self.low = low
        self.high = high
        self.label = label
    }
}

public struct LumenHeatmapDatum: Identifiable, Sendable {
    public let column: String
    public let id: String
    public let label: String?
    public let row: String
    public let value: Double?

    public init(id: String, column: String, row: String, value: Double?, label: String? = nil) {
        self.id = id
        self.column = column
        self.row = row
        self.value = value
        self.label = label
    }
}

func lumenAvailableHeatmapData(_ data: [LumenHeatmapDatum]) -> [LumenHeatmapDatum] {
    data.filter { datum in datum.value?.isFinite == true }
}

struct LumenLineSegmentDatum: Identifiable {
    let point: LumenChartDatum
    let segmentID: String

    var id: String { "\(segmentID):\(point.id)" }
}

struct LumenRangeSegmentDatum: Identifiable {
    let point: LumenRangeDatum
    let segmentID: String

    var id: String { "\(segmentID):\(point.id)" }
}

func isValidLumenChartX(_ value: LumenChartX) -> Bool {
    if case .number(let number) = value {
        return number.isFinite
    }

    return true
}

func lumenDataWithValidX(_ data: [LumenChartDatum]) -> [LumenChartDatum] {
    data.filter { datum in isValidLumenChartX(datum.x) }
}

func lumenChartCategories(_ series: [LumenChartSeries]) -> [LumenChartX] {
    series.reduce(into: []) { categories, item in
        lumenDataWithValidX(item.data).forEach { datum in
            if !categories.contains(datum.x) {
                categories.append(datum.x)
            }
        }
    }
}

func lumenSegmentedLineData(
    series: LumenChartSeries,
    categories: [LumenChartX]
) -> [LumenLineSegmentDatum] {
    var segmentIndex = 0
    var result: [LumenLineSegmentDatum] = []

    for category in categories {
        guard
            let point = series.data.first(where: { datum in datum.x == category }),
            point.y?.isFinite == true
        else {
            segmentIndex += 1
            continue
        }

        result.append(
            LumenLineSegmentDatum(point: point, segmentID: "\(series.id):\(segmentIndex)")
        )
    }

    return result
}

func lumenSegmentedRangeData(_ data: [LumenRangeDatum]) -> [LumenRangeSegmentDatum] {
    var segmentIndex = 0
    var result: [LumenRangeSegmentDatum] = []

    for point in data {
        guard point.low?.isFinite == true, point.high?.isFinite == true else {
            segmentIndex += 1
            continue
        }

        result.append(LumenRangeSegmentDatum(point: point, segmentID: "range:\(segmentIndex)"))
    }

    return result
}

func lumenAvailableRangeData(_ data: [LumenRangeDatum]) -> [LumenRangeDatum] {
    data.filter { datum in datum.low?.isFinite == true && datum.high?.isFinite == true }
}

public struct LumenChartSummary: Equatable, Sendable {
    public let availablePointCount: Int
    public let maximum: Double?
    public let minimum: Double?
    public let missingPointCount: Int
    public let seriesCount: Int

    public static func resolve(series: [LumenChartSeries]) -> LumenChartSummary {
        var values: [Double] = []
        var missingPointCount = 0

        for item in series {
            for datum in item.data {
                guard isValidLumenChartX(datum.x) else { continue }

                if let value = datum.y, value.isFinite {
                    values.append(value)
                } else {
                    missingPointCount += 1
                }
            }
        }

        return LumenChartSummary(
            availablePointCount: values.count,
            maximum: values.max(),
            minimum: values.min(),
            missingPointCount: missingPointCount,
            seriesCount: series.count
        )
    }

    public var spokenDescription: String {
        guard let minimum, let maximum else { return "No chart data available." }

        let pointLabel = availablePointCount == 1 ? "point" : "points"
        let missing = missingPointCount == 0
            ? ""
            : " \(missingPointCount) missing \(missingPointCount == 1 ? "value" : "values")."

        return "\(seriesCount) series, \(availablePointCount) \(pointLabel). "
            + "Values range from \(minimum.formatted()) to \(maximum.formatted()).\(missing)"
    }
}

private extension LumenTheme {
    var chartColors: LumenChartColorPalette {
        scheme == .dark ? LumenChartColors.dark : LumenChartColors.light
    }

    func chartColor(_ tone: LumenChartTone) -> Color {
        switch tone {
        case .accent: colors.accent
        case .brand: colors.brand
        case .danger: colors.danger
        case .neutral: colors.inkMuted
        case .series1: chartColors.series1
        case .series2: chartColors.series2
        case .series3: chartColors.series3
        case .series4: chartColors.series4
        case .series5: chartColors.series5
        case .series6: chartColors.series6
        case .series7: chartColors.series7
        case .series8: chartColors.series8
        case .success: colors.success
        case .warning: colors.warning
        }
    }
}

private func resolvedLumenChartTone(_ tone: LumenChartTone?, index: Int) -> LumenChartTone {
    if let tone { return tone }

    let seriesTones: [LumenChartTone] = [
        .series1, .series2, .series3, .series4, .series5, .series6, .series7, .series8
    ]

    return seriesTones[index % seriesTones.count]
}

@ChartContentBuilder
private func lumenLineMark(
    point: LumenChartDatum,
    series: LumenChartSeries,
    color: Color,
    area: Bool,
    segmentID: String
) -> some ChartContent {
    if let value = point.y, value.isFinite {
        switch point.x {
        case .category(let x):
            LineMark(
                x: .value("Category", x),
                y: .value(series.label, value),
                series: .value("Segment", segmentID)
            )
                .foregroundStyle(color)
            if area {
                AreaMark(
                    x: .value("Category", x),
                    y: .value(series.label, value),
                    series: .value("Segment", segmentID)
                )
                    .foregroundStyle(color.opacity(LumenChartMetrics.areaOpacity))
            }
        case .number(let x):
            LineMark(
                x: .value("X", x),
                y: .value(series.label, value),
                series: .value("Segment", segmentID)
            )
                .foregroundStyle(color)
            if area {
                AreaMark(
                    x: .value("X", x),
                    y: .value(series.label, value),
                    series: .value("Segment", segmentID)
                )
                    .foregroundStyle(color.opacity(LumenChartMetrics.areaOpacity))
            }
        case .time(let x):
            LineMark(
                x: .value("Time", x),
                y: .value(series.label, value),
                series: .value("Segment", segmentID)
            )
                .foregroundStyle(color)
            if area {
                AreaMark(
                    x: .value("Time", x),
                    y: .value(series.label, value),
                    series: .value("Segment", segmentID)
                )
                    .foregroundStyle(color.opacity(LumenChartMetrics.areaOpacity))
            }
        }
    }
}

@ChartContentBuilder
private func lumenBarMark(
    point: LumenChartDatum,
    series: LumenChartSeries,
    color: Color,
    stacking: MarkStackingMethod
) -> some ChartContent {
    if let value = point.y, value.isFinite {
        switch point.x {
        case .category(let x):
            BarMark(x: .value("Category", x), y: .value(series.label, value), stacking: stacking)
                .foregroundStyle(color)
                .accessibilityLabel("\(x), \(series.label)")
                .accessibilityValue(value.formatted())
        case .number(let x):
            BarMark(x: .value("X", x), y: .value(series.label, value), stacking: stacking)
                .foregroundStyle(color)
                .accessibilityLabel("\(x.formatted()), \(series.label)")
                .accessibilityValue(value.formatted())
        case .time(let x):
            BarMark(x: .value("Time", x), y: .value(series.label, value), stacking: stacking)
                .foregroundStyle(color)
                .accessibilityLabel("\(x.formatted()), \(series.label)")
                .accessibilityValue(value.formatted())
        }
    }
}

private struct LumenChartDataList: View {
    @Environment(\.lumenTheme) private var theme

    let selection: Binding<LumenChartSelection?>?
    let series: [LumenChartSeries]
    var includeSize = false

    @ViewBuilder
    private var dataRows: some View {
        VStack(alignment: .leading, spacing: LumenSpacing.sm) {
            ForEach(series) { item in
                ForEach(lumenDataWithValidX(item.data)) { datum in
                    let label = lumenChartDataLabel(series: item, datum: datum, includeSize: includeSize)

                    if let selection, datum.y?.isFinite == true {
                        Button(label) {
                            selection.wrappedValue = LumenChartSelection(seriesID: item.id, x: datum.x)
                        }
                        .buttonStyle(.plain)
                        .frame(minHeight: 44, alignment: .leading)
                        .accessibilityAddTraits(
                            selection.wrappedValue == LumenChartSelection(seriesID: item.id, x: datum.x)
                                ? .isSelected
                                : []
                        )
                    } else {
                        Text(label)
                            .foregroundStyle(theme.colors.inkSoft)
                    }
                }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.top, LumenSpacing.sm)
    }

    @ViewBuilder
    var body: some View {
        #if os(tvOS) || os(watchOS)
        VStack(alignment: .leading, spacing: LumenSpacing.sm) {
            Text("View chart data")
                .font(.headline)
                .foregroundStyle(theme.colors.brand)
            dataRows
        }
        #else
        DisclosureGroup("View chart data") {
            dataRows
        }
        .tint(theme.colors.brand)
        #endif
    }
}

func lumenChartDataLabel(
    series: LumenChartSeries,
    datum: LumenChartDatum,
    includeSize: Bool = false
) -> String {
    let value = datum.label ?? datum.y.flatMap { $0.isFinite ? $0.formatted() : nil } ?? "Not available"
    let base = "\(datum.x.label), \(series.label): \(value)"
    let size = datum.size.flatMap { $0.isFinite && $0 >= 0 ? $0.formatted() : nil } ?? "Not available"

    return includeSize ? "\(base), Size: \(size)" : base
}

func lumenScatterSymbolSize(_ size: Double?) -> Double {
    size.flatMap { $0.isFinite && $0 >= 0 ? $0 : nil } ?? 36
}

private struct LumenChartDataRow: Identifiable {
    let id: String
    let label: String
}

private struct LumenStructuredChartDataList: View {
    @Environment(\.lumenTheme) private var theme

    let rows: [LumenChartDataRow]

    @ViewBuilder
    private var dataRows: some View {
        VStack(alignment: .leading, spacing: LumenSpacing.sm) {
            ForEach(rows) { row in
                Text(row.label)
                    .foregroundStyle(theme.colors.inkSoft)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.top, LumenSpacing.sm)
    }

    @ViewBuilder
    var body: some View {
        #if os(tvOS) || os(watchOS)
        VStack(alignment: .leading, spacing: LumenSpacing.sm) {
            Text("View chart data")
                .font(.headline)
                .foregroundStyle(theme.colors.brand)
            dataRows
        }
        #else
        DisclosureGroup("View chart data") {
            dataRows
        }
        .tint(theme.colors.brand)
        #endif
    }
}

private struct LumenChartFrame<Content: View>: View {
    @Environment(\.lumenTheme) private var theme

    let content: Content
    let description: String?
    let heading: String?
    let label: String
    let summary: String

    init(
        label: String,
        heading: String?,
        description: String?,
        summary: String,
        @ViewBuilder content: () -> Content
    ) {
        self.label = label
        self.heading = heading
        self.description = description
        self.summary = summary
        self.content = content()
    }

    var body: some View {
        VStack(alignment: .leading, spacing: LumenSpacing.md) {
            if let heading {
                Text(heading)
                    .font(.headline)
                    .foregroundStyle(theme.colors.ink)
            }

            if let description {
                Text(description)
                    .font(.callout)
                    .foregroundStyle(theme.colors.inkMuted)
            }

            content
        }
        .padding(LumenSpacing.lg)
        .background(theme.colors.surface)
        .clipShape(RoundedRectangle(cornerRadius: LumenRadius.lg, style: .continuous))
        .overlay {
            RoundedRectangle(cornerRadius: LumenRadius.lg, style: .continuous)
                .stroke(theme.colors.line, lineWidth: 1)
        }
        .accessibilityLabel(label)
        .accessibilityValue(summary)
    }
}

public struct LumenLineChart: View {
    @Environment(\.lumenTheme) private var theme

    private let area: Bool
    private let description: String?
    private let heading: String?
    private let label: String
    private let selection: Binding<LumenChartSelection?>?
    private let series: [LumenChartSeries]
    private let showData: Bool
    private let summary: String

    public init(
        label: String,
        series: [LumenChartSeries],
        heading: String? = nil,
        description: String? = nil,
        summary: String? = nil,
        area: Bool = false,
        showData: Bool = true,
        selection: Binding<LumenChartSelection?>? = nil
    ) {
        self.label = label
        self.series = series
        self.heading = heading
        self.description = description
        self.area = area
        self.showData = showData
        self.selection = selection
        self.summary = summary ?? LumenChartSummary.resolve(series: series).spokenDescription
    }

    public var body: some View {
        let categories = lumenChartCategories(series)

        LumenChartFrame(
            label: label,
            heading: heading,
            description: description,
            summary: summary
        ) {
            Chart {
                ForEach(Array(series.enumerated()), id: \.element.id) { index, item in
                    let color = theme.chartColor(resolvedLumenChartTone(item.tone, index: index))

                    ForEach(lumenSegmentedLineData(series: item, categories: categories)) { segmented in
                        lumenLineMark(
                            point: segmented.point,
                            series: item,
                            color: color,
                            area: area,
                            segmentID: segmented.segmentID
                        )
                    }
                }
            }
            .frame(minHeight: 220)

            if showData {
                LumenChartDataList(selection: selection, series: series)
            }
        }
    }
}

public enum LumenBarChartLayout: Sendable {
    case grouped
    case stacked
}

public struct LumenBarChart: View {
    @Environment(\.lumenTheme) private var theme

    private let label: String
    private let layout: LumenBarChartLayout
    private let selection: Binding<LumenChartSelection?>?
    private let series: [LumenChartSeries]
    private let showData: Bool
    private let summary: String

    public init(
        label: String,
        series: [LumenChartSeries],
        layout: LumenBarChartLayout = .grouped,
        summary: String? = nil,
        showData: Bool = true,
        selection: Binding<LumenChartSelection?>? = nil
    ) {
        self.label = label
        self.series = series
        self.layout = layout
        self.showData = showData
        self.selection = selection
        self.summary = summary ?? LumenChartSummary.resolve(series: series).spokenDescription
    }

    public var body: some View {
        LumenChartFrame(label: label, heading: nil, description: nil, summary: summary) {
            Chart {
                ForEach(Array(series.enumerated()), id: \.element.id) { index, item in
                    let color = theme.chartColor(resolvedLumenChartTone(item.tone, index: index))

                    ForEach(lumenDataWithValidX(item.data)) { point in
                        lumenBarMark(
                            point: point,
                            series: item,
                            color: color,
                            stacking: layout == .stacked ? .standard : .unstacked
                        )
                    }
                }
            }
            .frame(minHeight: 220)

            if showData {
                LumenChartDataList(selection: selection, series: series)
            }
        }
    }
}

public struct LumenSparkline: View {
    @Environment(\.lumenTheme) private var theme

    private let label: String
    private let tone: LumenChartTone
    private let values: [Double]

    public init(label: String, values: [Double], tone: LumenChartTone = .series1) {
        self.label = label
        self.values = values
        self.tone = tone
    }

    public var body: some View {
        Chart(Array(values.enumerated()), id: \.offset) { index, value in
            LineMark(x: .value("Index", index), y: .value("Value", value))
                .foregroundStyle(theme.chartColor(tone))
        }
        .chartXAxis(.hidden)
        .chartYAxis(.hidden)
        .frame(width: 120, height: 40)
        .accessibilityLabel(label)
    }
}

public struct LumenScatterChart: View {
    @Environment(\.lumenTheme) private var theme

    private let label: String
    private let selection: Binding<LumenChartSelection?>?
    private let series: [LumenChartSeries]
    private let showData: Bool
    private let summary: String

    public init(
        label: String,
        series: [LumenChartSeries],
        summary: String? = nil,
        showData: Bool = true,
        selection: Binding<LumenChartSelection?>? = nil
    ) {
        self.label = label
        self.series = series
        self.showData = showData
        self.selection = selection
        self.summary = summary ?? LumenChartSummary.resolve(series: series).spokenDescription
    }

    public var body: some View {
        LumenChartFrame(label: label, heading: nil, description: nil, summary: summary) {
            Chart {
                ForEach(Array(series.enumerated()), id: \.element.id) { index, item in
                    let color = theme.chartColor(resolvedLumenChartTone(item.tone, index: index))

                    ForEach(lumenDataWithValidX(item.data)) { point in
                        if let value = point.y, value.isFinite {
                            switch point.x {
                            case .category(let x):
                                PointMark(x: .value("Category", x), y: .value(item.label, value))
                                    .symbolSize(lumenScatterSymbolSize(point.size))
                                    .foregroundStyle(color)
                            case .number(let x):
                                PointMark(x: .value("X", x), y: .value(item.label, value))
                                    .symbolSize(lumenScatterSymbolSize(point.size))
                                    .foregroundStyle(color)
                            case .time(let x):
                                PointMark(x: .value("Time", x), y: .value(item.label, value))
                                    .symbolSize(lumenScatterSymbolSize(point.size))
                                    .foregroundStyle(color)
                            }
                        }
                    }
                }
            }
            .frame(minHeight: 220)

            if showData {
                LumenChartDataList(selection: selection, series: series, includeSize: true)
            }
        }
    }
}

public struct LumenRangeChart: View {
    @Environment(\.lumenTheme) private var theme

    private let data: [LumenRangeDatum]
    private let label: String
    private let showData: Bool
    private let summary: String
    private let tone: LumenChartTone

    public init(
        label: String,
        data: [LumenRangeDatum],
        summary: String? = nil,
        tone: LumenChartTone = .series1,
        showData: Bool = true
    ) {
        self.label = label
        self.data = data
        let availableRangeCount = lumenAvailableRangeData(data).count
        self.summary = summary ?? (
            availableRangeCount == 0 ? "No chart data available." : "\(availableRangeCount) ranges."
        )
        self.tone = tone
        self.showData = showData
    }

    public var body: some View {
        let segmentedData = lumenSegmentedRangeData(data)

        LumenChartFrame(label: label, heading: nil, description: nil, summary: summary) {
            if segmentedData.isEmpty {
                Text("No chart data available.")
                    .foregroundStyle(theme.colors.inkMuted)
            } else {
                Chart(segmentedData) { segmented in
                    let point = segmented.point

                    if let low = point.low, let high = point.high, low.isFinite, high.isFinite {
                        switch point.x {
                        case .category(let x):
                            AreaMark(
                                x: .value("Category", x),
                                yStart: .value("Low", low),
                                yEnd: .value("High", high),
                                series: .value("Segment", segmented.segmentID)
                            )
                            .foregroundStyle(theme.chartColor(tone).opacity(LumenChartMetrics.areaOpacity))
                        case .number(let x):
                            AreaMark(
                                x: .value("X", x),
                                yStart: .value("Low", low),
                                yEnd: .value("High", high),
                                series: .value("Segment", segmented.segmentID)
                            )
                            .foregroundStyle(theme.chartColor(tone).opacity(LumenChartMetrics.areaOpacity))
                        case .time(let x):
                            AreaMark(
                                x: .value("Time", x),
                                yStart: .value("Low", low),
                                yEnd: .value("High", high),
                                series: .value("Segment", segmented.segmentID)
                            )
                            .foregroundStyle(theme.chartColor(tone).opacity(LumenChartMetrics.areaOpacity))
                        }
                    }
                }
                .frame(minHeight: 220)
            }

            if showData {
                LumenStructuredChartDataList(rows: data.map { datum in
                    let low = datum.low?.isFinite == true ? datum.low?.formatted() ?? "Not available" : "Not available"
                    let high = datum.high?.isFinite == true ? datum.high?.formatted() ?? "Not available" : "Not available"

                    return LumenChartDataRow(
                        id: datum.id,
                        label: "\(datum.label ?? datum.x.label): \(low) to \(high)"
                    )
                })
            }
        }
    }
}

public enum LumenPieChartVariant: Sendable {
    case donut
    case pie
}

private struct LumenPieSlice: Identifiable {
    let endAngle: Angle
    let id: String
    let label: String
    let startAngle: Angle
    let tone: LumenChartTone
    let value: Double
}

func lumenAvailablePieData(_ data: [LumenChartDatum]) -> [LumenChartDatum] {
    data.filter { datum in
        guard isValidLumenChartX(datum.x), let value = datum.y else { return false }

        return value.isFinite && value > 0
    }
}

private func lumenPieSlices(series: LumenChartSeries) -> [LumenPieSlice] {
    let available = lumenAvailablePieData(series.data)
    let total = available.compactMap(\.y).reduce(0, +)
    var angle = -90.0

    return available.enumerated().map { index, datum in
        let value = datum.y ?? 0
        let startAngle = angle
        let endAngle = startAngle + (total == 0 ? 0 : value / total) * 360

        angle = endAngle

        return LumenPieSlice(
            endAngle: .degrees(endAngle),
            id: datum.id,
            label: datum.label ?? datum.x.label,
            startAngle: .degrees(startAngle),
            tone: resolvedLumenChartTone(series.tone, index: index),
            value: value
        )
    }
}

private func lumenPiePath(
    center: CGPoint,
    outerRadius: CGFloat,
    innerRadius: CGFloat,
    startAngle: Angle,
    endAngle: Angle
) -> Path {
    var path = Path()

    if innerRadius == 0 {
        path.move(to: center)
        path.addArc(
            center: center,
            radius: outerRadius,
            startAngle: startAngle,
            endAngle: endAngle,
            clockwise: false
        )
        path.closeSubpath()

        return path
    }

    let startRadians = startAngle.radians
    let outerStart = CGPoint(
        x: center.x + cos(startRadians) * outerRadius,
        y: center.y + sin(startRadians) * outerRadius
    )

    path.move(to: outerStart)
    path.addArc(
        center: center,
        radius: outerRadius,
        startAngle: startAngle,
        endAngle: endAngle,
        clockwise: false
    )
    path.addArc(
        center: center,
        radius: innerRadius,
        startAngle: endAngle,
        endAngle: startAngle,
        clockwise: true
    )
    path.closeSubpath()

    return path
}

public struct LumenPieChart: View {
    @Environment(\.lumenTheme) private var theme

    private let label: String
    private let selection: Binding<LumenChartSelection?>?
    private let series: LumenChartSeries
    private let showData: Bool
    private let summary: String
    private let variant: LumenPieChartVariant

    public init(
        label: String,
        series: LumenChartSeries,
        variant: LumenPieChartVariant = .donut,
        summary: String? = nil,
        showData: Bool = true,
        selection: Binding<LumenChartSelection?>? = nil
    ) {
        self.label = label
        self.series = series
        self.variant = variant
        self.showData = showData
        self.selection = selection
        let availableSeries = LumenChartSeries(
            id: series.id,
            label: series.label,
            data: lumenAvailablePieData(series.data),
            tone: series.tone
        )
        self.summary = summary ?? LumenChartSummary.resolve(series: [availableSeries]).spokenDescription
    }

    public var body: some View {
        let availableSeries = LumenChartSeries(
            id: series.id,
            label: series.label,
            data: lumenAvailablePieData(series.data),
            tone: series.tone
        )
        let slices = lumenPieSlices(series: availableSeries)

        LumenChartFrame(label: label, heading: nil, description: nil, summary: summary) {
            if slices.isEmpty {
                Text("No chart data available.")
                    .foregroundStyle(theme.colors.inkMuted)
            } else {
                Canvas { context, size in
                    let center = CGPoint(x: size.width / 2, y: size.height / 2)
                    let outerRadius = max(0, min(size.width, size.height) / 2 - LumenSpacing.sm)
                    let innerRadius = variant == .donut ? outerRadius * 0.58 : 0

                    for slice in slices {
                        let path = lumenPiePath(
                            center: center,
                            outerRadius: outerRadius,
                            innerRadius: innerRadius,
                            startAngle: slice.startAngle,
                            endAngle: slice.endAngle
                        )

                        context.fill(path, with: .color(theme.chartColor(slice.tone)))
                        context.stroke(path, with: .color(theme.colors.surface), lineWidth: 2)
                    }
                }
                .frame(minHeight: 240)
                .aspectRatio(1, contentMode: .fit)
            }

            if showData {
                LumenChartDataList(selection: selection, series: [availableSeries])
            }
        }
    }
}

public struct LumenHeatmap: View {
    @Environment(\.lumenTheme) private var theme

    private let data: [LumenHeatmapDatum]
    private let label: String
    private let showData: Bool
    private let summary: String

    public init(label: String, data: [LumenHeatmapDatum], summary: String? = nil, showData: Bool = true) {
        self.label = label
        self.data = data
        self.summary = summary ?? "\(lumenAvailableHeatmapData(data).count) heatmap cells."
        self.showData = showData
    }

    public var body: some View {
        let availableData = lumenAvailableHeatmapData(data)
        let values = availableData.compactMap(\.value)
        let minimum = values.min() ?? 0
        let maximum = values.max() ?? 1

        LumenChartFrame(label: label, heading: nil, description: nil, summary: summary) {
            if availableData.isEmpty {
                Text("No chart data available.")
                    .foregroundStyle(theme.colors.inkMuted)
            } else {
                Chart(availableData) { datum in
                    RectangleMark(
                        x: .value("Column", datum.column),
                        y: .value("Row", datum.row)
                    )
                    .foregroundStyle(
                        theme.chartColors.sequentialHigh.opacity(
                            lumenHeatmapOpacity(value: datum.value, minimum: minimum, maximum: maximum)
                        )
                    )
                    .accessibilityLabel(datum.label ?? "\(datum.column), \(datum.row)")
                    .accessibilityValue(datum.value?.formatted() ?? "Not available")
                }
                .frame(minHeight: 220)
            }

            if showData {
                LumenStructuredChartDataList(rows: data.map { datum in
                    let value = datum.value?.isFinite == true
                        ? datum.value?.formatted() ?? "Not available"
                        : "Not available"

                    return LumenChartDataRow(
                        id: datum.id,
                        label: "\(datum.label ?? "\(datum.column), \(datum.row)"): \(value)"
                    )
                })
            }
        }
    }
}

private func lumenHeatmapOpacity(value: Double?, minimum: Double, maximum: Double) -> Double {
    guard let value, value.isFinite, maximum > minimum else { return 0.12 }

    return max(0.12, min(1, (value - minimum) / (maximum - minimum)))
}

public struct LumenComboChart: View {
    @Environment(\.lumenTheme) private var theme

    private let label: String
    private let selection: Binding<LumenChartSelection?>?
    private let series: [LumenChartSeries]
    private let showData: Bool
    private let summary: String

    public init(
        label: String,
        series: [LumenChartSeries],
        summary: String? = nil,
        showData: Bool = true,
        selection: Binding<LumenChartSelection?>? = nil
    ) {
        self.label = label
        self.series = series
        self.showData = showData
        self.selection = selection
        self.summary = summary ?? LumenChartSummary.resolve(series: series).spokenDescription
    }

    public var body: some View {
        let categories = lumenChartCategories(series)

        LumenChartFrame(label: label, heading: nil, description: nil, summary: summary) {
            Chart {
                ForEach(Array(series.enumerated()), id: \.element.id) { index, item in
                    let color = theme.chartColor(resolvedLumenChartTone(item.tone, index: index))

                    switch item.mark {
                    case .bar:
                        ForEach(lumenDataWithValidX(item.data)) { point in
                            lumenBarMark(
                                point: point,
                                series: item,
                                color: color,
                                stacking: .unstacked
                            )
                        }
                    case .area:
                        ForEach(lumenSegmentedLineData(series: item, categories: categories)) { segmented in
                            lumenLineMark(
                                point: segmented.point,
                                series: item,
                                color: color,
                                area: true,
                                segmentID: segmented.segmentID
                            )
                        }
                    case .line:
                        ForEach(lumenSegmentedLineData(series: item, categories: categories)) { segmented in
                            lumenLineMark(
                                point: segmented.point,
                                series: item,
                                color: color,
                                area: false,
                                segmentID: segmented.segmentID
                            )
                        }
                    }
                }
            }
            .frame(minHeight: 220)

            if showData {
                LumenChartDataList(selection: selection, series: series)
            }
        }
    }
}
