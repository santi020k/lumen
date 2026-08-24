import SwiftUI

public enum LumenWatchTone: Sendable {
    case accent
    case brand
    case danger
    case neutral
    case success
    case warning
}

public struct LumenWatchProgressValue: Equatable, Sendable {
    public let maximum: Double
    public let value: Double

    public static func resolve(_ value: Double, maximum: Double) -> LumenWatchProgressValue {
        let safeMaximum = maximum.isFinite && maximum > 0 ? maximum : 1
        let safeValue = value.isFinite ? min(max(value, 0), safeMaximum) : 0
        return LumenWatchProgressValue(maximum: safeMaximum, value: safeValue)
    }

    public var fraction: Double {
        value / maximum
    }
}

public struct LumenWatchActionMetrics: Equatable, Sendable {
    public let dimension: CGFloat
    public let ringWidth: CGFloat

    public static func resolve(dimension: CGFloat, ringWidth: CGFloat) -> LumenWatchActionMetrics {
        let safeDimension = dimension.isFinite ? min(max(dimension, 44), 180) : 120
        let safeRingWidth = ringWidth.isFinite ? min(max(ringWidth, 2), 12) : 4
        return LumenWatchActionMetrics(dimension: safeDimension, ringWidth: safeRingWidth)
    }
}

func lumenWatchColor(_ palette: LumenColorPalette, tone: LumenWatchTone) -> Color {
    switch tone {
    case .accent:
        palette.accent
    case .brand:
        palette.brandSolid
    case .danger:
        palette.danger
    case .neutral:
        palette.inkMuted
    case .success:
        palette.success
    case .warning:
        palette.warning
    }
}

#if os(watchOS)
public struct LumenWatchActionButton<Label: View>: View {
    @Environment(\.isLuminanceReduced) private var isLuminanceReduced
    @Environment(\.lumenTheme) private var theme

    private let accessibilityLabel: LocalizedStringKey
    private let action: () -> Void
    private let dimension: CGFloat
    private let enabled: Bool
    private let label: Label
    private let tone: LumenWatchTone

    public init(
        _ accessibilityLabel: LocalizedStringKey,
        tone: LumenWatchTone = .brand,
        dimension: CGFloat = 120,
        enabled: Bool = true,
        action: @escaping () -> Void,
        @ViewBuilder label: () -> Label
    ) {
        self.accessibilityLabel = accessibilityLabel
        self.tone = tone
        self.dimension = dimension
        self.enabled = enabled
        self.action = action
        self.label = label()
    }

    public var body: some View {
        let metrics = LumenWatchActionMetrics.resolve(dimension: dimension, ringWidth: 4)
        let color = lumenWatchColor(theme.colors, tone: tone)

        Button(action: action) {
            label
                .foregroundStyle(tone == .danger ? theme.colors.onDanger : theme.colors.onBrand)
                .frame(width: metrics.dimension, height: metrics.dimension)
                .background(color.opacity(enabled ? 1 : 0.48), in: Circle())
                .shadow(color: isLuminanceReduced ? .clear : color.opacity(0.38), radius: 7)
        }
        .buttonStyle(.plain)
        .disabled(!enabled)
        .accessibilityLabel(Text(accessibilityLabel))
    }
}

public struct LumenWatchProgressRing<Content: View>: View {
    @Environment(\.isLuminanceReduced) private var isLuminanceReduced
    @Environment(\.lumenTheme) private var theme

    private let content: Content
    private let lineWidth: CGFloat
    private let maximum: Double
    private let tone: LumenWatchTone
    private let value: Double

    public init(
        value: Double,
        maximum: Double = 1,
        tone: LumenWatchTone = .brand,
        lineWidth: CGFloat = 4,
        @ViewBuilder content: () -> Content
    ) {
        self.value = value
        self.maximum = maximum
        self.tone = tone
        self.lineWidth = lineWidth
        self.content = content()
    }

    public var body: some View {
        let progress = LumenWatchProgressValue.resolve(value, maximum: maximum)
        let metrics = LumenWatchActionMetrics.resolve(dimension: 120, ringWidth: lineWidth)

        ZStack {
            if !isLuminanceReduced {
                Circle()
                    .stroke(theme.colors.line.opacity(0.5), lineWidth: metrics.ringWidth)
                Circle()
                    .trim(from: 0, to: progress.fraction)
                    .stroke(
                        lumenWatchColor(theme.colors, tone: tone),
                        style: StrokeStyle(lineWidth: metrics.ringWidth, lineCap: .round)
                    )
                    .rotationEffect(.degrees(-90))
                    .accessibilityHidden(true)
            }
            content
        }
    }
}

public struct LumenWatchStatus: View {
    @Environment(\.lumenTheme) private var theme

    private let systemName: String?
    private let title: LocalizedStringKey
    private let tone: LumenWatchTone

    public init(
        _ title: LocalizedStringKey,
        systemName: String? = nil,
        tone: LumenWatchTone = .neutral
    ) {
        self.title = title
        self.systemName = systemName
        self.tone = tone
    }

    public var body: some View {
        Group {
            if let systemName {
                Label(title, systemImage: systemName)
            } else {
                Text(title)
            }
        }
        .font(.caption2.weight(.semibold))
        .foregroundStyle(foregroundColor)
        .padding(.horizontal, LumenSpacing.sm)
        .padding(.vertical, LumenSpacing.xs)
        .background(color.opacity(0.24), in: Capsule())
    }

    private var color: Color {
        lumenWatchColor(theme.colors, tone: tone)
    }

    private var foregroundColor: Color {
        tone == .neutral ? theme.colors.inkSoft : color
    }
}

public struct LumenWatchMetric: View {
    @Environment(\.lumenTheme) private var theme

    private let detail: LocalizedStringKey?
    private let label: LocalizedStringKey
    private let tone: LumenWatchTone
    private let value: String

    public init(
        _ label: LocalizedStringKey,
        value: String,
        detail: LocalizedStringKey? = nil,
        tone: LumenWatchTone = .neutral
    ) {
        self.label = label
        self.value = value
        self.detail = detail
        self.tone = tone
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(label)
                .font(.caption2)
                .foregroundStyle(theme.colors.inkMuted)
            Text(value)
                .font(.system(.body, design: .rounded, weight: .bold))
                .foregroundStyle(lumenWatchColor(theme.colors, tone: tone))
            if let detail {
                Text(detail)
                    .font(.caption2)
                    .foregroundStyle(theme.colors.inkSoft)
            }
        }
        .padding(LumenSpacing.sm)
        .background(theme.colors.surfaceMuted.opacity(0.84), in: RoundedRectangle(cornerRadius: LumenRadius.md))
        .accessibilityElement(children: .combine)
    }
}

public struct LumenWatchListRow<Content: View, Leading: View, Trailing: View>: View {
    @Environment(\.lumenTheme) private var theme

    private let content: Content
    private let leading: Leading
    private let trailing: Trailing

    public init(
        @ViewBuilder leading: () -> Leading,
        @ViewBuilder content: () -> Content,
        @ViewBuilder trailing: () -> Trailing
    ) {
        self.leading = leading()
        self.content = content()
        self.trailing = trailing()
    }

    public var body: some View {
        HStack(spacing: LumenSpacing.sm) {
            leading
            content
                .frame(maxWidth: .infinity, alignment: .leading)
            trailing
        }
        .padding(LumenSpacing.sm)
        .background(theme.colors.surfaceMuted.opacity(0.84), in: RoundedRectangle(cornerRadius: LumenRadius.md))
    }
}

public extension LumenWatchListRow where Leading == EmptyView, Trailing == EmptyView {
    init(@ViewBuilder content: () -> Content) {
        self.init(leading: { EmptyView() }, content: content, trailing: { EmptyView() })
    }
}
#endif
