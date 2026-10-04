import Charts
import SwiftUI

public enum LumenWaterfallKind: String, Sendable {
    case delta
    case total
}

public struct LumenWaterfallDatum: Identifiable, Sendable {
    public let id: String
    public let label: String
    public let value: Double
    public let kind: LumenWaterfallKind
    public let tone: LumenChartTone?

    public init(id: String, label: String, value: Double, kind: LumenWaterfallKind = .delta, tone: LumenChartTone? = nil) {
        self.id = id
        self.label = label
        self.value = value
        self.kind = kind
        self.tone = tone
    }
}

public enum LumenHistogramFrequency: String, Sendable {
    case count
    case density
}

public struct LumenHistogramBin: Sendable {
    public let start: Double
    public let end: Double
    public let count: Double
    public let label: String?

    public init(start: Double, end: Double, count: Double, label: String? = nil) {
        self.start = start
        self.end = end
        self.count = count
        self.label = label
    }
}

struct LumenIntervalMark: Identifiable {
    let id: String
    let label: String
    let start: Double
    let end: Double
    let value: Double
    let tone: LumenChartTone
    let count: Double?
}

struct LumenIntervalModel {
    let marks: [LumenIntervalMark]
    let valid: Bool
}

// Fail closed: omitting one invalid change would misstate every following balance.
func lumenWaterfallModel(_ data: [LumenWaterfallDatum]) -> LumenIntervalModel {
    var balance = 0.0
    var seen = Set<String>()
    var marks: [LumenIntervalMark] = []
    for datum in data {
        let start = datum.kind == .total ? 0 : balance
        let end = datum.kind == .total ? datum.value : balance + datum.value
        guard datum.value.isFinite, end.isFinite, seen.insert(datum.id).inserted else {
            return LumenIntervalModel(marks: [], valid: false)
        }
        marks.append(LumenIntervalMark(
            id: datum.id, label: datum.label, start: start, end: end, value: datum.value,
            tone: datum.tone ?? (datum.kind == .total ? .series1 : datum.value < 0 ? .series3 : .series2), count: nil
        ))
        balance = end
    }
    return LumenIntervalModel(marks: marks, valid: true)
}

func lumenHistogramModel(
    _ data: [LumenHistogramBin], frequency: LumenHistogramFrequency,
    tone: LumenChartTone, formatBoundary: (Double) -> String
) -> LumenIntervalModel {
    let bins = data.sorted { $0.start < $1.start }
    let firstWidth = bins.first.map { $0.end - $0.start } ?? 0
    var previousEnd: Double?
    var marks: [LumenIntervalMark] = []
    for bin in bins {
        let width = bin.end - bin.start
        let value = frequency == .density ? bin.count / width : bin.count
        guard bin.start.isFinite, bin.end.isFinite, bin.count.isFinite, width.isFinite,
              width > 0, bin.count >= 0, value.isFinite,
              previousEnd.map({ bin.start >= $0 }) ?? true,
              frequency == .density || abs(width - firstWidth) <= abs(firstWidth) * 1e-9 else {
            return LumenIntervalModel(marks: [], valid: false)
        }
        marks.append(LumenIntervalMark(
            id: String(bin.start), label: bin.label ?? "\(formatBoundary(bin.start))–\(formatBoundary(bin.end))",
            start: bin.start, end: bin.end, value: value, tone: tone, count: bin.count
        ))
        previousEnd = bin.end
    }
    return LumenIntervalModel(marks: marks, valid: true)
}

private func intervalRows(_ model: LumenIntervalModel, labels: LumenChartLabels, valueLabel: String, formatBoundary: (Double) -> String, density: Bool) -> [LumenChartDataRow] {
    model.marks.map { mark in
        let count = density ? mark.count.map { ", \(labels.count): \(labels.formatValue($0))" } ?? "" : ""
        return LumenChartDataRow(id: mark.id, label: "\(mark.label), \(labels.start): \(formatBoundary(mark.start)), \(labels.end): \(formatBoundary(mark.end)), \(valueLabel): \(labels.formatValue(mark.value))\(count)")
    }
}

private func intervalSummary(_ model: LumenIntervalModel, labels: LumenChartLabels, valueLabel: String) -> String {
    guard model.valid else { return labels.invalidData }
    return labels.formatSummary(LumenChartSummary.resolve(series: [LumenChartSeries(
        id: "values", label: valueLabel,
        data: model.marks.map { LumenChartDatum(id: $0.id, x: .category($0.label), y: $0.value) }
    )]))
}

public struct LumenWaterfallChart: View {
    @Environment(\.lumenTheme) private var theme
    private let data: [LumenWaterfallDatum]
    private let label: String
    private let heading: String?
    private let description: String?
    private let labels: LumenChartLabels
    private let showData: Bool
    private let valueLabel: String?

    public init(label: String, data: [LumenWaterfallDatum], heading: String? = nil, description: String? = nil, labels: LumenChartLabels = .english, showData: Bool = true, valueLabel: String? = nil) {
        self.data = data
        self.label = label
        self.heading = heading
        self.description = description
        self.labels = labels
        self.showData = showData
        self.valueLabel = valueLabel
    }

    public var body: some View {
        let model = lumenWaterfallModel(data)
        let title = valueLabel ?? labels.value
        LumenChartFrame(label: label, heading: heading, description: description, summary: intervalSummary(model, labels: labels, valueLabel: title)) {
            if model.marks.isEmpty {
                Text(model.valid ? labels.empty : labels.invalidData).foregroundStyle(theme.colors.inkSoft)
            } else {
                Text(title).font(.caption).foregroundStyle(theme.colors.inkSoft)
                Chart {
                    ForEach(Array(model.marks.enumerated()), id: \.element.id) { index, mark in
                        RectangleMark(
                            xStart: .value(labels.start, Double(index) + 0.15), xEnd: .value(labels.end, Double(index) + 0.85),
                            yStart: .value(labels.start, mark.start), yEnd: .value(labels.end, mark.end)
                        )
                        .foregroundStyle(theme.chartColor(mark.tone))
                        if index < model.marks.count - 1 {
                            RuleMark(xStart: .value(labels.start, Double(index) + 0.85), xEnd: .value(labels.end, Double(index) + 1.15), y: .value(title, mark.end))
                                .foregroundStyle(theme.colors.inkSoft)
                                .lineStyle(StrokeStyle(lineWidth: 1, dash: [4, 4]))
                        }
                    }
                }
                .chartXScale(domain: 0...Double(model.marks.count))
                .chartXAxis {
                    AxisMarks(values: Array(Set([0, (model.marks.count - 1) / 2, model.marks.count - 1])).sorted().map { Double($0) + 0.5 }) { value in
                        AxisValueLabel(anchor: value.index == 0 ? .topLeading : value.index == value.count - 1 ? .topTrailing : .top) {
                            if let position = value.as(Double.self), model.marks.indices.contains(Int(position)) {
                                Text(model.marks[Int(position)].label).lineLimit(1)
                            }
                        }
                    }
                }
                .chartYAxis {
                    AxisMarks(position: .leading) { value in
                        AxisGridLine(stroke: StrokeStyle(lineWidth: 1, dash: [3, 5]))
                        AxisValueLabel {
                            if let number = value.as(Double.self) { Text(labels.formatValue(number)) }
                        }
                    }
                }
                .frame(height: 240)
                .accessibilityLabel(label)
                if showData {
                    LumenStructuredChartDataList(labels: labels, rows: intervalRows(model, labels: labels, valueLabel: title, formatBoundary: labels.formatValue, density: false))
                }
            }
        }
    }
}

public struct LumenHistogram: View {
    @Environment(\.lumenTheme) private var theme
    private let data: [LumenHistogramBin]
    private let label: String
    private let heading: String?
    private let description: String?
    private let labels: LumenChartLabels
    private let frequency: LumenHistogramFrequency
    private let tone: LumenChartTone
    private let showData: Bool
    private let formatBoundary: (Double) -> String

    public init(label: String, data: [LumenHistogramBin], heading: String? = nil, description: String? = nil, labels: LumenChartLabels = .english, frequency: LumenHistogramFrequency = .count, tone: LumenChartTone = .series1, showData: Bool = true, formatBoundary: @escaping (Double) -> String = { $0.formatted() }) {
        self.data = data
        self.label = label
        self.heading = heading
        self.description = description
        self.labels = labels
        self.frequency = frequency
        self.tone = tone
        self.showData = showData
        self.formatBoundary = formatBoundary
    }

    public var body: some View {
        let model = lumenHistogramModel(data, frequency: frequency, tone: tone, formatBoundary: formatBoundary)
        let title = frequency == .density ? labels.density : labels.count
        LumenChartFrame(label: label, heading: heading, description: description, summary: intervalSummary(model, labels: labels, valueLabel: title)) {
            if model.marks.isEmpty {
                Text(model.valid ? labels.empty : labels.invalidData).foregroundStyle(theme.colors.inkSoft)
            } else {
                Text(title).font(.caption).foregroundStyle(theme.colors.inkSoft)
                Chart(model.marks) { mark in
                    RectangleMark(xStart: .value(labels.start, mark.start), xEnd: .value(labels.end, mark.end), yStart: .value(title, 0), yEnd: .value(title, mark.value))
                        .foregroundStyle(theme.chartColor(mark.tone))
                }
                .chartXScale(domain: (model.marks.first?.start ?? 0)...(model.marks.last?.end ?? 1))
                .chartXAxis {
                    AxisMarks { value in
                        AxisGridLine()
                        AxisValueLabel {
                            if let boundary = value.as(Double.self) { Text(formatBoundary(boundary)) }
                        }
                    }
                }
                .chartYAxis {
                    AxisMarks(position: .leading) { value in
                        AxisGridLine(stroke: StrokeStyle(lineWidth: 1, dash: [3, 5]))
                        AxisValueLabel {
                            if let number = value.as(Double.self) { Text(labels.formatValue(number)) }
                        }
                    }
                }
                .frame(height: 240)
                .accessibilityLabel(label)
                if showData {
                    LumenStructuredChartDataList(labels: labels, rows: intervalRows(model, labels: labels, valueLabel: title, formatBoundary: formatBoundary, density: frequency == .density))
                }
            }
        }
    }
}
