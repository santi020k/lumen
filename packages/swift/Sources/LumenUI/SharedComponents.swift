import SwiftUI

public enum LumenCardVariant: Sendable {
    case accent
    case `default`
    case destructive
    case muted
    case success
    case warning
}

public struct LumenCard<Content: View>: View {
    @Environment(\.lumenTheme) private var theme

    private let action: (() -> Void)?
    private let content: Content
    private let padding: LumenSurfacePadding
    private let radius: LumenSurfaceRadius
    private let variant: LumenCardVariant

    public init(
        variant: LumenCardVariant = .default,
        padding: LumenSurfacePadding = .xl,
        radius: LumenSurfaceRadius = .lg,
        action: (() -> Void)? = nil,
        @ViewBuilder content: () -> Content
    ) {
        self.variant = variant
        self.padding = padding
        self.radius = radius
        self.action = action
        self.content = content()
    }

    public var body: some View {
        Group {
            if let action {
                Button(action: action) {
                    cardSurface
                }
                .buttonStyle(LumenCardButtonStyle())
            } else {
                cardSurface
            }
        }
    }

    private var cardSurface: some View {
        content
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(padding.value)
            .background(backgroundColor)
            .overlay {
                RoundedRectangle(cornerRadius: radius.value, style: .continuous)
                    .stroke(borderColor, lineWidth: 1)
            }
            .clipShape(RoundedRectangle(cornerRadius: radius.value, style: .continuous))
    }

    private var accentColor: Color? {
        switch variant {
        case .accent: theme.colors.accent
        case .default, .muted: nil
        case .destructive: theme.colors.danger
        case .success: theme.colors.success
        case .warning: theme.colors.warning
        }
    }

    private var backgroundColor: Color {
        switch variant {
        case .default: theme.colors.surface
        case .muted: theme.colors.surfaceMuted
        case .accent, .destructive, .success, .warning:
            accentColor?.opacity(0.06) ?? theme.colors.surface
        }
    }

    private var borderColor: Color {
        accentColor?.opacity(0.24) ?? theme.colors.line
    }
}

private struct LumenCardButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .opacity(configuration.isPressed ? 0.84 : 1)
            .scaleEffect(configuration.isPressed ? 0.995 : 1)
    }
}

public enum LumenAlertVariant: Sendable {
    case `default`
    case destructive
    case success
    case warning
}

public struct LumenAlert<Content: View>: View {
    @Environment(\.lumenTheme) private var theme

    private let content: Content
    private let variant: LumenAlertVariant

    public init(
        variant: LumenAlertVariant = .default,
        @ViewBuilder content: () -> Content
    ) {
        self.variant = variant
        self.content = content()
    }

    public var body: some View {
        content
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.horizontal, LumenSpacing.lg)
            .padding(.vertical, LumenSpacing.md)
            .foregroundStyle(foregroundColor)
            .background(backgroundColor)
            .overlay {
                RoundedRectangle(cornerRadius: LumenRadius.md, style: .continuous)
                    .stroke(borderColor, lineWidth: 1)
            }
            .clipShape(RoundedRectangle(cornerRadius: LumenRadius.md, style: .continuous))
    }

    private var accentColor: Color {
        switch variant {
        case .default: theme.colors.ink
        case .destructive: theme.colors.danger
        case .success: theme.colors.success
        case .warning: theme.colors.warning
        }
    }

    private var backgroundColor: Color {
        variant == .default ? theme.colors.surface : accentColor.opacity(0.08)
    }

    private var borderColor: Color {
        variant == .default ? theme.colors.line : accentColor.opacity(0.36)
    }

    private var foregroundColor: Color {
        variant == .default ? theme.colors.ink : accentColor
    }
}

public struct LumenProgressValue: Equatable, Sendable {
    public let max: Double
    public let value: Double

    public var fraction: Double { value / max }

    public static func resolve(value: Double, max: Double) -> LumenProgressValue {
        let safeMax = max.isFinite && max > 0 ? max : 100
        let finiteValue = value.isFinite ? value : 0
        let safeValue = min(safeMax, Swift.max(0, finiteValue))

        return LumenProgressValue(max: safeMax, value: safeValue)
    }
}

public struct LumenProgress: View {
    @Environment(\.lumenTheme) private var theme

    private let label: String?
    private let progress: LumenProgressValue

    public init(
        value: Double = 0,
        max: Double = 100,
        label: String? = nil
    ) {
        progress = LumenProgressValue.resolve(value: value, max: max)
        self.label = label
    }

    public var body: some View {
        GeometryReader { geometry in
            ZStack(alignment: .leading) {
                Capsule().fill(theme.colors.surfaceStrong)
                Capsule()
                    .fill(theme.colors.brandSolid)
                    .frame(width: geometry.size.width * progress.fraction)
            }
        }
        .frame(height: LumenSpacing.sm)
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(Text(label ?? "Progress"))
        .accessibilityValue(Text("\(Int(progress.fraction * 100)) percent"))
    }
}

public enum LumenAvatarSize: Sendable {
    case lg
    case md
    case sm

    var dimension: CGFloat {
        switch self {
        case .lg: 56
        case .md: 40
        case .sm: 32
        }
    }
}

public struct LumenAvatar: View {
    @Environment(\.lumenTheme) private var theme

    private let fallback: String
    private let image: Image?
    private let label: String?
    private let size: LumenAvatarSize

    public init(
        image: Image? = nil,
        fallback: String = "?",
        size: LumenAvatarSize = .md,
        label: String? = nil
    ) {
        self.image = image
        self.fallback = fallback
        self.size = size
        self.label = label
    }

    public var body: some View {
        ZStack {
            Circle().fill(theme.colors.surfaceMuted)

            if let image {
                image
                    .resizable()
                    .scaledToFill()
            } else {
                Text(fallback)
                    .font(fallbackFont)
                    .foregroundStyle(theme.colors.ink)
            }
        }
        .frame(width: size.dimension, height: size.dimension)
        .clipShape(Circle())
        .overlay {
            Circle().stroke(theme.colors.line, lineWidth: 1)
        }
        .accessibilityElement(children: .ignore)
        .accessibilityHidden(label == nil)
        .accessibilityLabel(Text(label ?? ""))
    }

    private var fallbackFont: Font {
        size == .lg ? .headline.weight(.bold) : .callout.weight(.bold)
    }
}
