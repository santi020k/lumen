#if os(iOS) || os(macOS) || os(visionOS)
import SwiftUI

struct LumenRangeSliderModel {
    let bounds: ClosedRange<Double>
    let step: Double?

    init(bounds: ClosedRange<Double>, step: Double?) {
        precondition(bounds.lowerBound.isFinite && bounds.upperBound.isFinite &&
            bounds.lowerBound < bounds.upperBound && (bounds.upperBound - bounds.lowerBound).isFinite,
            "Range bounds must be finite, increasing, and have a finite span.")
        if let step {
            precondition(step.isFinite && step > 0 && ((bounds.upperBound - bounds.lowerBound) / step).isFinite,
                "Range step must be finite, positive, and representable within the bounds.")
        }
        self.bounds = bounds
        self.step = step.map { min($0, bounds.upperBound - bounds.lowerBound) }
    }

    func resolved(_ value: ClosedRange<Double>) -> ClosedRange<Double> {
        let start = normalized(value.lowerBound, fallback: bounds.lowerBound)
        let end = normalized(value.upperBound, fallback: bounds.upperBound)
        return min(start, end)...max(start, end)
    }

    func replacingStart(_ start: Double, in value: ClosedRange<Double>) -> ClosedRange<Double> {
        let current = resolved(value)
        return min(normalized(start, fallback: current.lowerBound), current.upperBound)...current.upperBound
    }

    func replacingEnd(_ end: Double, in value: ClosedRange<Double>) -> ClosedRange<Double> {
        let current = resolved(value)
        return current.lowerBound...max(current.lowerBound, normalized(end, fallback: current.upperBound))
    }

    private func normalized(_ value: Double, fallback: Double) -> Double {
        let clamped = min(bounds.upperBound, max(bounds.lowerBound, value.isFinite ? value : fallback))
        guard let step else { return clamped }
        let span = bounds.upperBound - bounds.lowerBound
        let index = min(((clamped - bounds.lowerBound) / step).rounded(), span / step)
        return min(bounds.upperBound, max(bounds.lowerBound, bounds.lowerBound + index * step))
    }
}

/// Two native sliders keep endpoints independently reachable at large text sizes.
/// The binding owns the interval; formatting, units, and persistence belong to the application.
public struct LumenRangeSlider: View {
    @Binding private var value: ClosedRange<Double>
    @Environment(\.isEnabled) private var isEnabled
    private let model: LumenRangeSliderModel
    private let label: LocalizedStringKey
    private let startLabel: LocalizedStringKey
    private let endLabel: LocalizedStringKey
    private let readOnly: Bool
    private let formatValue: (Double) -> String

    public init(
        _ label: LocalizedStringKey,
        value: Binding<ClosedRange<Double>>,
        in bounds: ClosedRange<Double> = 0...100,
        step: Double? = nil,
        readOnly: Bool = false,
        startLabel: LocalizedStringKey = "Minimum",
        endLabel: LocalizedStringKey = "Maximum",
        formatValue: @escaping (Double) -> String = { String($0) }
    ) {
        self.label = label
        _value = value
        model = LumenRangeSliderModel(bounds: bounds, step: step)
        self.readOnly = readOnly
        self.startLabel = startLabel
        self.endLabel = endLabel
        self.formatValue = formatValue
    }

    public var body: some View {
        let resolved = model.resolved(value)
        VStack(alignment: .leading, spacing: LumenSpacing.sm) {
            LumenText(label, variant: .label)
            LumenSlider("\(Text(label)) · \(Text(startLabel))", value: Binding(
                get: { model.resolved(value).lowerBound },
                set: { if isEnabled && !readOnly { value = model.replacingStart($0, in: value) } }
            ), in: model.bounds, step: model.step, valueLabel: formatValue(resolved.lowerBound))
            LumenSlider("\(Text(label)) · \(Text(endLabel))", value: Binding(
                get: { model.resolved(value).upperBound },
                set: { if isEnabled && !readOnly { value = model.replacingEnd($0, in: value) } }
            ), in: model.bounds, step: model.step, valueLabel: formatValue(resolved.upperBound))
        }
        .disabled(readOnly)
    }
}
#endif
