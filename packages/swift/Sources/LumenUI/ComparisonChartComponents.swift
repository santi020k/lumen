import SwiftUI

public struct LumenComparisonDatum: Sendable {
    public let id: String
    public let label: String
    public let value: Double?
    public let reference: Double?
    public let tone: LumenChartTone?
    public init(id: String, label: String, value: Double?, reference: Double? = nil, tone: LumenChartTone? = nil) {
        self.id = id; self.label = label; self.value = value; self.reference = reference; self.tone = tone
    }
}

struct LumenComparisonModel {
    let domain: ClosedRange<Double>
    let valid: Bool
    func position(_ value: Double) -> Double { lumenChartRatio(value, domain: domain) }
    var ticks: [Double] { [domain.lowerBound, domain.lowerBound / 2 + domain.upperBound / 2, domain.upperBound] }
}

func lumenComparisonModel(_ data: [LumenComparisonDatum], paired: Bool, domain: ClosedRange<Double>?) -> LumenComparisonModel {
    let invalid = LumenComparisonModel(domain: 0...1, valid: false)
    var ids = Set<String>()
    var minimum = 0.0
    var maximum = 0.0
    for row in data {
        guard !row.id.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty,
              !row.label.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty,
              ids.insert(row.id).inserted,
              row.value?.isFinite != false, row.reference?.isFinite != false else { return invalid }
        for value in ([row.value] + (paired ? [row.reference] : [])).compactMap({ $0 }) {
            minimum = min(minimum, value); maximum = max(maximum, value)
        }
    }
    let resolved = domain ?? minimum...(maximum == minimum ? maximum + 1 : maximum)
    guard resolved.lowerBound.isFinite, resolved.upperBound.isFinite, resolved.lowerBound < resolved.upperBound,
          resolved.lowerBound <= minimum, resolved.upperBound >= maximum else { return invalid }
    return LumenComparisonModel(domain: resolved, valid: true)
}

private struct LumenComparisonChart: View {
    @Environment(\.lumenTheme) private var theme
    let data: [LumenComparisonDatum]
    let label: String
    let paired: Bool
    let domain: ClosedRange<Double>?
    let heading: String?
    let description: String?
    let labels: LumenChartLabels
    let referenceLabel: String
    let valueLabel: String
    let showData: Bool
    private func format(_ value: Double?) -> String { value.map(labels.formatValue) ?? labels.notAvailable }
    var body: some View {
        let model = lumenComparisonModel(data, paired: paired, domain: domain)
        LumenChartFrame(label: label, heading: heading, description: description, summary: model.valid ? "\(labels.count): \(data.count)." : labels.invalidData) {
            if !model.valid || data.isEmpty {
                Text(model.valid ? labels.empty : labels.invalidData).foregroundStyle(theme.colors.inkSoft)
            } else {
                Text(paired ? "\(referenceLabel) → \(valueLabel)" : valueLabel).font(.caption).foregroundStyle(theme.colors.inkSoft)
                ForEach(Array(data.enumerated()), id: \.element.id) { index, row in
                    VStack(alignment: .leading, spacing: LumenSpacing.xs) {
                        ViewThatFits(in: .horizontal) {
                            HStack { Text(row.label); Spacer(); values(row) }
                            VStack(alignment: .leading) { Text(row.label); values(row) }
                        }.font(.callout).foregroundStyle(theme.colors.ink)
                        plot(row, model: model, tone: row.tone ?? lumenComparisonTone(index))
                    }
                }
                HStack {
                    ForEach(Array(model.ticks.enumerated()), id: \.offset) { index, tick in
                        Text(labels.formatValue(tick)).font(.caption).monospacedDigit().foregroundStyle(theme.colors.inkSoft)
                            .frame(maxWidth: .infinity, alignment: index == 0 ? .leading : index == 2 ? .trailing : .center)
                    }
                }
                if showData {
                    LumenStructuredChartDataList(labels: labels, rows: data.map { row in
                        LumenChartDataRow(id: row.id, label: "\(row.label). \(paired ? "\(referenceLabel): \(format(row.reference)). " : "")\(valueLabel): \(format(row.value)).")
                    })
                }
            }
        }
    }
    private func values(_ row: LumenComparisonDatum) -> some View {
        HStack(spacing: LumenSpacing.xs) {
            if paired { Text("\(format(row.reference)) →").foregroundStyle(theme.colors.inkSoft) }
            Text(format(row.value)).bold()
        }.monospacedDigit()
    }
    private func plot(_ row: LumenComparisonDatum, model: LumenComparisonModel, tone: LumenChartTone) -> some View {
        Canvas { context, size in
            let width = max(0, size.width - 16)
            let color = theme.chartColor(tone)
            let value = row.value.map { 8 + model.position($0) * width }
            let reference = (paired ? row.reference : 0).map { 8 + model.position($0) * width }
            context.fill(Path(CGRect(x: 8, y: 11.5, width: width, height: 1)), with: .color(theme.colors.line))
            if let value, let reference {
                context.fill(Path(roundedRect: CGRect(x: min(value, reference), y: 10, width: abs(value - reference), height: 4), cornerRadius: 2), with: .color(color.opacity(0.5)))
            }
            if paired, let reference {
                let circle = Path(ellipseIn: CGRect(x: reference - 5, y: 7, width: 10, height: 10))
                context.fill(circle, with: .color(theme.colors.surface)); context.stroke(circle, with: .color(color), lineWidth: 2)
            }
            if let value {
                let circle = Path(ellipseIn: CGRect(x: value - 7, y: 5, width: 14, height: 14))
                context.fill(circle, with: .color(color)); context.stroke(circle, with: .color(theme.colors.surface), lineWidth: 2)
            }
        }.frame(height: 24).accessibilityHidden(true)
    }
}
private func lumenComparisonTone(_ index: Int) -> LumenChartTone { [.series1, .series2, .series3, .series4, .series5, .series6, .series7, .series8][index % 8] }

public struct LumenLollipopChart: View {
    private let content: LumenComparisonChart
    public init(data: [LumenComparisonDatum], label: String, domain: ClosedRange<Double>? = nil, heading: String? = nil, description: String? = nil, labels: LumenChartLabels = .english, valueLabel: String? = nil, showData: Bool = true) {
        content = LumenComparisonChart(data: data, label: label, paired: false, domain: domain, heading: heading, description: description, labels: labels, referenceLabel: "", valueLabel: valueLabel ?? labels.value, showData: showData)
    }
    public var body: some View { content }
}
public struct LumenDumbbellChart: View {
    private let content: LumenComparisonChart
    public init(data: [LumenComparisonDatum], label: String, domain: ClosedRange<Double>? = nil, heading: String? = nil, description: String? = nil, labels: LumenChartLabels = .english, referenceLabel: String = "Before", valueLabel: String? = nil, showData: Bool = true) {
        content = LumenComparisonChart(data: data, label: label, paired: true, domain: domain, heading: heading, description: description, labels: labels, referenceLabel: referenceLabel, valueLabel: valueLabel ?? labels.value, showData: showData)
    }
    public var body: some View { content }
}
