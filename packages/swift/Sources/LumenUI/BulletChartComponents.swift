// cspell:words subheadline
import SwiftUI

public struct LumenBulletRange: Sendable {
    public let end: Double
    public let label: String
    public let tone: LumenChartTone?

    public init(end: Double, label: String, tone: LumenChartTone? = nil) {
        self.end = end
        self.label = label
        self.tone = tone
    }
}

struct LumenBulletBand {
    let start: Double
    let range: LumenBulletRange
}

struct LumenBulletModel {
    let domain: ClosedRange<Double>
    let ranges: [LumenBulletBand]
    let valid: Bool
    func position(_ value: Double) -> Double { lumenChartRatio(value, domain: domain) }
    var ticks: [Double] { [domain.lowerBound, domain.lowerBound / 2 + domain.upperBound / 2, domain.upperBound] }
}

func lumenBulletModel(value: Double?, target: Double, ranges: [LumenBulletRange], domain: ClosedRange<Double>?) -> LumenBulletModel {
    let invalid = LumenBulletModel(domain: 0...1, ranges: [], valid: false)
    let values = [0, target] + ranges.map(\.end) + (value.map { [$0] } ?? [])
    guard values.allSatisfy(\.isFinite) else { return invalid }
    let minimum = values.min() ?? 0
    let maximum = values.max() ?? 1
    let resolved = domain ?? minimum...(minimum == maximum ? minimum + 1 : maximum)
    guard resolved.lowerBound.isFinite, resolved.upperBound.isFinite,
          resolved.lowerBound < resolved.upperBound, resolved.contains(0),
          values.allSatisfy({ resolved.contains($0) }) else { return invalid }
    var previous = resolved.lowerBound
    var bands: [LumenBulletBand] = []
    for range in ranges.sorted(by: { $0.end < $1.end }) {
        guard !range.label.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty, range.end > previous else { return invalid }
        bands.append(LumenBulletBand(start: previous, range: range))
        previous = range.end
    }
    return LumenBulletModel(domain: resolved, ranges: bands, valid: true)
}

public struct LumenBulletChart: View {
    @Environment(\.lumenTheme) private var theme
    private let label: String
    private let value: Double?
    private let target: Double
    private let ranges: [LumenBulletRange]
    private let domain: ClosedRange<Double>?
    private let heading: String?
    private let description: String?
    private let labels: LumenChartLabels
    private let targetLabel: String
    private let valueLabel: String
    private let tone: LumenChartTone
    private let showData: Bool

    public init(label: String, value: Double?, target: Double, ranges: [LumenBulletRange] = [], domain: ClosedRange<Double>? = nil, heading: String? = nil, description: String? = nil, labels: LumenChartLabels = .english, targetLabel: String = "Target", valueLabel: String? = nil, tone: LumenChartTone = .series1, showData: Bool = true) {
        self.label = label
        self.value = value
        self.target = target
        self.ranges = ranges
        self.domain = domain
        self.heading = heading
        self.description = description
        self.labels = labels
        self.targetLabel = targetLabel
        self.valueLabel = valueLabel ?? labels.value
        self.tone = tone
        self.showData = showData
    }

    public var body: some View {
        let model = lumenBulletModel(value: value, target: target, ranges: ranges, domain: domain)
        let actual = value.map(labels.formatValue) ?? labels.notAvailable
        let summary = model.valid ? "\(valueLabel): \(actual). \(targetLabel): \(labels.formatValue(target))." : labels.invalidData
        LumenChartFrame(label: label, heading: heading, description: description, summary: summary) {
            if model.valid {
                ViewThatFits(in: .horizontal) {
                    HStack(alignment: .bottom) { valueView(actual); Spacer(minLength: LumenSpacing.md); targetView }
                    VStack(alignment: .leading, spacing: LumenSpacing.sm) { valueView(actual); targetView }
                }
                plot(model)
                if !model.ranges.isEmpty {
                    ViewThatFits(in: .horizontal) {
                        HStack(alignment: .top, spacing: LumenSpacing.lg) { rangeLabels(model) }
                        VStack(alignment: .leading, spacing: LumenSpacing.sm) { rangeLabels(model) }
                    }
                }
                if showData {
                    LumenStructuredChartDataList(labels: labels, rows: [
                        LumenChartDataRow(id: "actual", label: "\(valueLabel): \(actual)"),
                        LumenChartDataRow(id: "target", label: "\(targetLabel): \(labels.formatValue(target))")
                    ] + model.ranges.map { LumenChartDataRow(id: "range:\($0.range.end)", label: "\($0.range.label): \(labels.formatValue($0.start))–\(labels.formatValue($0.range.end))") })
                }
            } else {
                Text(labels.invalidData).foregroundStyle(theme.colors.inkSoft)
            }
        }
    }

    private func valueView(_ actual: String) -> some View {
        VStack(alignment: .leading, spacing: LumenSpacing.xs) {
            Text(valueLabel).font(.caption).foregroundStyle(theme.colors.inkSoft)
            Text(actual).font(.largeTitle.bold()).monospacedDigit().foregroundStyle(theme.colors.ink)
        }
    }

    private var targetView: some View {
        HStack(spacing: LumenSpacing.xs) {
            Rectangle().fill(theme.colors.ink).frame(width: 3, height: 16).accessibilityHidden(true)
            Text("\(targetLabel): \(labels.formatValue(target))").font(.subheadline).foregroundStyle(theme.colors.inkSoft)
        }
    }

    private func rangeLabels(_ model: LumenBulletModel) -> some View {
        ForEach(model.ranges.indices, id: \.self) { index in
            let band = model.ranges[index]
            VStack(alignment: .leading, spacing: LumenSpacing.xs) {
                Text(band.range.label).font(.caption.bold()).foregroundStyle(theme.colors.ink)
                Text("\(labels.formatValue(band.start))–\(labels.formatValue(band.range.end))").font(.caption).monospacedDigit().foregroundStyle(theme.colors.inkSoft)
            }
        }
    }

    private func plot(_ model: LumenBulletModel) -> some View {
        VStack(spacing: LumenSpacing.md) {
            Canvas { context, size in
                let top = 6.0
                let height = 48.0
                context.fill(Path(roundedRect: CGRect(x: 0, y: top, width: size.width, height: height), cornerRadius: 3), with: .color(theme.colors.surfaceMuted))
                for (index, band) in model.ranges.enumerated() {
                    let left = model.position(band.start) * size.width
                    let width = (model.position(band.range.end) - model.position(band.start)) * size.width
                    let opacity = 0.12 + Double(index) / Double(max(1, model.ranges.count - 1)) * 0.2
                    context.fill(Path(CGRect(x: left, y: top, width: max(0, width - 1), height: height)), with: .color(theme.chartColor(band.range.tone ?? .neutral).opacity(opacity)))
                }
                if let value {
                    let zero = model.position(0) * size.width
                    let actual = model.position(value) * size.width
                    context.fill(Path(roundedRect: CGRect(x: min(zero, actual), y: 22, width: abs(actual - zero), height: 16), cornerRadius: 2), with: .color(theme.chartColor(tone)))
                }
                let marker = model.position(target) * size.width
                context.fill(Path(CGRect(x: marker - 2.5, y: 0, width: 5, height: 60)), with: .color(theme.colors.surface))
                context.fill(Path(CGRect(x: marker - 1.5, y: 0, width: 3, height: 60)), with: .color(theme.colors.ink))
            }.frame(height: 60)
            HStack(alignment: .top, spacing: LumenSpacing.sm) {
                ForEach(Array(model.ticks.enumerated()), id: \.offset) { index, tick in
                    Text(labels.formatValue(tick)).font(.caption).monospacedDigit().foregroundStyle(theme.colors.inkSoft)
                        .frame(maxWidth: .infinity, alignment: index == 0 ? .leading : index == 2 ? .trailing : .center)
                }
            }
        }.accessibilityHidden(true)
    }
}
