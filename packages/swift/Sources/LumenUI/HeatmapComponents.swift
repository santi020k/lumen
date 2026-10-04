import Charts
import SwiftUI

public enum LumenHeatmapColorScale: String, Sendable {
    case sequential
    case diverging
}

extension LumenHeatmapDatum {
    var coordinateID: String { "\(column.utf8.count):\(column)\(row)" }
}

struct LumenHeatmapModel {
    let cells: [LumenHeatmapDatum]
    let columns: [String]
    let rows: [String]
    let domain: ClosedRange<Double>
    let midpoint: Double

    var midpointRatio: Double { lumenChartRatio(midpoint, domain: domain) }
}


func lumenHeatmapModel(_ data: [LumenHeatmapDatum], colorScale: LumenHeatmapColorScale, domain: ClosedRange<Double>?, midpoint: Double) -> LumenHeatmapModel {
    var seen = Set<String>()
    let cells = data.filter { seen.insert($0.coordinateID).inserted }
    var columns: [String] = []
    var rows: [String] = []
    var seenColumns = Set<String>()
    var seenRows = Set<String>()
    for cell in cells {
        if seenColumns.insert(cell.column).inserted { columns.append(cell.column) }
        if seenRows.insert(cell.row).inserted { rows.append(cell.row) }
    }
    let values = cells.compactMap { $0.value?.isFinite == true ? $0.value : nil }
    var minimum = values.min() ?? 0
    var maximum = values.max() ?? 1
    if minimum == maximum {
        let offset = max(Double.leastNonzeroMagnitude, abs(minimum == 0 ? 1 : minimum) * 0.1)
        minimum = max(-Double.greatestFiniteMagnitude, minimum - offset)
        maximum = min(Double.greatestFiniteMagnitude, maximum + offset)
    }
    var center = midpoint.isFinite ? midpoint : 0
    let requested = domain.flatMap { value in
        value.lowerBound.isFinite && value.upperBound.isFinite && value.lowerBound < value.upperBound ? value : nil
    }
    if colorScale == .diverging {
        if let requested, requested.lowerBound < center, requested.upperBound > center {
            return LumenHeatmapModel(cells: cells, columns: columns, rows: rows, domain: requested, midpoint: center)
        }
        var radius = max(abs(minimum - center), abs(maximum - center), 1)
        if !(center - radius).isFinite || !(center + radius).isFinite {
            center = 0
            radius = max(abs(minimum), abs(maximum), 1)
        }
        minimum = center - radius
        maximum = center + radius
    } else if let requested {
        minimum = requested.lowerBound
        maximum = requested.upperBound
    }
    return LumenHeatmapModel(cells: cells, columns: columns, rows: rows, domain: minimum...maximum, midpoint: center)
}

public struct LumenHeatmap: View {
    @Environment(\.lumenTheme) private var theme
    private let data: [LumenHeatmapDatum]
    private let label: String
    private let labels: LumenChartLabels
    private let showData: Bool
    private let summary: String?
    private let heading: String?
    private let description: String?
    private let colorScale: LumenHeatmapColorScale
    private let domain: ClosedRange<Double>?
    private let midpoint: Double

    public init(
        label: String, data: [LumenHeatmapDatum], summary: String? = nil,
        labels: LumenChartLabels = .english, showData: Bool = true,
        heading: String? = nil, description: String? = nil,
        colorScale: LumenHeatmapColorScale = .sequential, domain: ClosedRange<Double>? = nil, midpoint: Double = 0
    ) {
        self.label = label
        self.data = data
        self.summary = summary
        self.labels = labels
        self.showData = showData
        self.heading = heading
        self.description = description
        self.colorScale = colorScale
        self.domain = domain
        self.midpoint = midpoint
    }

    private func gradient(_ model: LumenHeatmapModel) -> Gradient {
        if colorScale == .diverging {
            return Gradient(stops: [
                .init(color: theme.chartColors.divergingNegative, location: 0),
                .init(color: theme.chartColors.divergingMid, location: model.midpointRatio),
                .init(color: theme.chartColors.divergingPositive, location: 1)
            ])
        }
        return Gradient(colors: [theme.chartColors.sequentialLow, theme.chartColors.sequentialHigh])
    }

    public var body: some View {
        let model = lumenHeatmapModel(data, colorScale: colorScale, domain: domain, midpoint: midpoint)
        let available = lumenAvailableHeatmapData(model.cells)
        LumenChartFrame(label: label, heading: heading, description: description, summary: summary ?? labels.formatHeatmapSummary(available.count)) {
            if available.isEmpty {
                Text(labels.empty).foregroundStyle(theme.colors.inkSoft)
            } else {
                HStack(alignment: .top, spacing: LumenSpacing.sm) {
                    GeometryReader { geometry in
                        ForEach(rowTicks(model), id: \.self) { index in
                            Text(model.rows[index]).lineLimit(1)
                                .frame(width: geometry.size.width, alignment: .trailing)
                                .position(x: geometry.size.width / 2, y: geometry.size.height * (Double(index) + 0.5) / Double(model.rows.count))
                        }
                    }
                    .font(.caption).foregroundStyle(theme.colors.inkSoft)
                    .frame(width: 48, height: 240)
                    .accessibilityHidden(true)
                    VStack(spacing: LumenSpacing.sm) {
                        Chart(model.cells, id: \.coordinateID) { datum in
                            if let value = datum.value, value.isFinite {
                                RectangleMark(x: .value(labels.column, datum.column), y: .value(labels.row, datum.row), width: .ratio(0.94), height: .ratio(0.94))
                                    .foregroundStyle(by: .value(labels.value, min(model.domain.upperBound, max(model.domain.lowerBound, value))))
                                    .cornerRadius(2)
                                    .accessibilityLabel(datum.label ?? "\(datum.column), \(datum.row)")
                                    .accessibilityValue(labels.formatValue(value))
                            } else {
                                RectangleMark(x: .value(labels.column, datum.column), y: .value(labels.row, datum.row), width: .ratio(0.94), height: .ratio(0.94))
                                    .foregroundStyle(theme.colors.surfaceMuted)
                                    .cornerRadius(2)
                                    .annotation(position: .overlay) { Text("×").font(.caption2).foregroundStyle(theme.colors.inkSoft).accessibilityHidden(true) }
                                    .accessibilityLabel(datum.label ?? "\(datum.column), \(datum.row)")
                                    .accessibilityValue(labels.notAvailable)
                            }
                        }
                        .chartXScale(domain: model.columns)
                        .chartYScale(domain: model.rows)
                        .chartForegroundStyleScale(domain: model.domain, range: gradient(model))
                        .chartLegend(.hidden)
                        .chartXAxis(.hidden)
                        .chartYAxis(.hidden)
                        .frame(height: 240)
                        GeometryReader { geometry in
                            ForEach(columnTicks(model), id: \.self) { index in
                                Text(model.columns[index]).font(.caption).fixedSize()
                                    .foregroundStyle(theme.colors.inkSoft)
                                    .position(x: min(max(20, geometry.size.width * (Double(index) + 0.5) / Double(model.columns.count)), max(20, geometry.size.width - 20)), y: 8)
                            }
                        }.frame(height: 20).accessibilityHidden(true)
                    }
                }
                legend(model)
                if available.count < model.cells.count {
                    Text("× \(labels.notAvailable)").font(.caption).foregroundStyle(theme.colors.inkSoft)
                }
            }
            if showData {
                LumenStructuredChartDataList(labels: labels, rows: model.cells.map { datum in
                    let value = datum.value.flatMap { $0.isFinite ? labels.formatValue($0) : nil } ?? labels.notAvailable
                    return LumenChartDataRow(id: datum.coordinateID, label: "\(datum.label ?? "\(datum.column), \(datum.row)"): \(value)")
                })
            }
        }
    }

    private func columnTicks(_ model: LumenHeatmapModel) -> [Int] {
        model.columns.count <= 3 ? Array(model.columns.indices) : [0, model.columns.count / 2, model.columns.count - 1]
    }

    private func rowTicks(_ model: LumenHeatmapModel) -> [Int] {
        let stride = max(1, Int(ceil(Double(model.rows.count) / 12)))
        return model.rows.indices.filter { $0 % stride == 0 }
    }

    private func legend(_ model: LumenHeatmapModel) -> some View {
        VStack(spacing: LumenSpacing.xs) {
            LinearGradient(gradient: gradient(model), startPoint: .leading, endPoint: .trailing)
                .frame(height: 8).clipShape(Capsule())
                .accessibilityHidden(true)
            HStack {
                Text(labels.formatValue(model.domain.lowerBound))
                Spacer()
                Text(labels.formatValue(model.domain.upperBound))
            }
            if colorScale == .diverging {
                GeometryReader { geometry in
                    Text(labels.formatValue(model.midpoint)).fixedSize()
                        .position(x: geometry.size.width * min(0.9, max(0.1, model.midpointRatio)), y: geometry.size.height / 2)
                }.frame(height: 16)
            }
        }
        .font(.caption)
        .foregroundStyle(theme.colors.inkSoft)
    }
}
