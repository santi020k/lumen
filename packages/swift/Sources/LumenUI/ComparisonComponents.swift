#if os(iOS) || os(macOS) || os(visionOS)
import SwiftUI

/// Controlled visible-after fraction with native slider interaction and application-owned images.
public struct LumenImageComparison<Before: View, After: View>: View {
    @Binding private var value: Double
    @Environment(\.layoutDirection) private var direction
    @Environment(\.locale) private var locale
    @Environment(\.lumenTheme) private var theme
    private let label: String
    private let beforeLabel: String
    private let afterLabel: String
    private let ratio: CGFloat
    private let before: Before
    private let after: After

    public init(_ label: String, value: Binding<Double>, beforeLabel: String = "Before", afterLabel: String = "After",
                aspectRatio: CGFloat = 16 / 9, @ViewBuilder before: () -> Before, @ViewBuilder after: () -> After) {
        self.label = label
        _value = value
        self.beforeLabel = beforeLabel
        self.afterLabel = afterLabel
        ratio = aspectRatio.isFinite && (0.1...10).contains(aspectRatio) ? aspectRatio : 16 / 9
        self.before = before()
        self.after = after()
    }
    private var position: Double { value.isFinite ? min(1, max(0, value)) : 0.5 }
    private var sliderBinding: Binding<Double> { Binding(get: { position }, set: { value = min(1, max(0, $0)) }) }
    private var valueLabel: String {
        let formatter = NumberFormatter()
        formatter.locale = locale
        formatter.numberStyle = .percent
        return afterLabel + " " + (formatter.string(from: NSNumber(value: position)) ?? "")
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: LumenSpacing.sm) {
            GeometryReader { geometry in
                ZStack {
                    before.frame(width: geometry.size.width, height: geometry.size.height).clipped()
                    after.frame(width: geometry.size.width, height: geometry.size.height).clipped()
                        .mask(alignment: direction == .rightToLeft ? .trailing : .leading) {
                            Rectangle().frame(width: geometry.size.width * position)
                        }
                    Rectangle().fill(theme.colors.ink).frame(width: LumenSpacing.xs)
                        .position(x: geometry.size.width * (direction == .rightToLeft ? 1 - position : position), y: geometry.size.height / 2)
                }
            }
            .aspectRatio(ratio, contentMode: .fit)
            .clipShape(RoundedRectangle(cornerRadius: LumenRadius.lg))
            .accessibilityHidden(true)
            HStack { Text(verbatim: afterLabel); Spacer(); Text(verbatim: beforeLabel) }
            LumenSlider("\(label)", value: sliderBinding, in: 0...1, step: 0.01, valueLabel: valueLabel)
                .accessibilityLabel(Text(verbatim: label))
        }
    }
}
#endif
