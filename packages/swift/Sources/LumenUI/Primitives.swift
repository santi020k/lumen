import SwiftUI

public enum LumenTextTone: Sendable {
    case danger
    case `default`
    case muted
    case soft
    case success
    case warning
}

public enum LumenTextVariant: Sendable {
    case body
    case caption
    case label
    case title
}

public struct LumenText: View {
    @Environment(\.lumenTheme) private var theme

    private let content: LocalizedStringKey
    private let tone: LumenTextTone
    private let variant: LumenTextVariant

    public init(
        _ content: LocalizedStringKey,
        variant: LumenTextVariant = .body,
        tone: LumenTextTone = .default
    ) {
        self.content = content
        self.variant = variant
        self.tone = tone
    }

    public var body: some View {
        Text(content)
            .font(font)
            .foregroundStyle(foregroundColor)
    }

    private var font: Font {
        switch variant {
        case .body: .body
        case .caption: .caption
        case .label: .callout.weight(.semibold)
        case .title: .title2.weight(.bold)
        }
    }

    private var foregroundColor: Color {
        switch tone {
        case .danger: theme.colors.danger
        case .default: theme.colors.ink
        case .muted: theme.colors.inkMuted
        case .soft: theme.colors.inkSoft
        case .success: theme.colors.success
        case .warning: theme.colors.warning
        }
    }
}

public enum LumenSurfacePadding: Sendable {
    case lg
    case md
    case none
    case sm

    var value: CGFloat {
        switch self {
        case .lg: LumenSpacing.lg
        case .md: LumenSpacing.md
        case .none: 0
        case .sm: LumenSpacing.sm
        }
    }
}

public enum LumenSurfaceRadius: Sendable {
    case lg
    case md
    case none
    case sm

    var value: CGFloat {
        switch self {
        case .lg: LumenRadius.lg
        case .md: LumenRadius.md
        case .none: 0
        case .sm: LumenRadius.sm
        }
    }
}

public enum LumenSurfaceTone: Sendable {
    case canvas
    case muted
    case strong
    case surface
}

public struct LumenSurface<Content: View>: View {
    @Environment(\.lumenTheme) private var theme

    private let content: Content
    private let padding: LumenSurfacePadding
    private let radius: LumenSurfaceRadius
    private let tone: LumenSurfaceTone

    public init(
        tone: LumenSurfaceTone = .surface,
        padding: LumenSurfacePadding = .md,
        radius: LumenSurfaceRadius = .md,
        @ViewBuilder content: () -> Content
    ) {
        self.content = content()
        self.padding = padding
        self.radius = radius
        self.tone = tone
    }

    public var body: some View {
        content
            .padding(padding.value)
            .background(backgroundColor)
            .clipShape(RoundedRectangle(cornerRadius: radius.value, style: .continuous))
    }

    private var backgroundColor: Color {
        switch tone {
        case .canvas: theme.colors.canvas
        case .muted: theme.colors.surfaceMuted
        case .strong: theme.colors.surfaceStrong
        case .surface: theme.colors.surface
        }
    }
}

public enum LumenButtonIntent: Sendable {
    case danger
    case primary
    case quiet
    case secondary
}

public enum LumenControlSize: Sendable {
    case lg
    case md
    case sm
}

public struct LumenButtonMetrics: Equatable, Sendable {
    public let horizontalPadding: CGFloat
    public let minHeight: CGFloat

    public static func resolve(_ size: LumenControlSize) -> LumenButtonMetrics {
        switch size {
        case .lg:
            LumenButtonMetrics(horizontalPadding: LumenSpacing.xl, minHeight: 52)
        case .md:
            LumenButtonMetrics(horizontalPadding: LumenSpacing.lg, minHeight: 44)
        case .sm:
            LumenButtonMetrics(horizontalPadding: LumenSpacing.md, minHeight: 36)
        }
    }
}

public struct LumenButtonStyle: ButtonStyle {
    @Environment(\.isEnabled) private var isEnabled
    @Environment(\.lumenTheme) private var theme

    private let intent: LumenButtonIntent
    private let size: LumenControlSize

    public init(
        intent: LumenButtonIntent = .primary,
        size: LumenControlSize = .md
    ) {
        self.intent = intent
        self.size = size
    }

    public func makeBody(configuration: Configuration) -> some View {
        let metrics = LumenButtonMetrics.resolve(size)

        configuration.label
            .font(size == .lg ? .body.weight(.semibold) : .callout.weight(.semibold))
            .foregroundStyle(foregroundColor)
            .frame(minHeight: metrics.minHeight)
            .padding(.horizontal, metrics.horizontalPadding)
            .background(backgroundColor)
            .overlay {
                RoundedRectangle(cornerRadius: LumenRadius.sm, style: .continuous)
                    .stroke(borderColor, lineWidth: 1)
            }
            .clipShape(RoundedRectangle(cornerRadius: LumenRadius.sm, style: .continuous))
            .opacity(isEnabled ? (configuration.isPressed ? 0.84 : 1) : 0.52)
    }

    private var backgroundColor: Color {
        switch intent {
        case .danger: theme.colors.danger
        case .primary: theme.colors.brandSolid
        case .quiet: .clear
        case .secondary: theme.colors.surfaceMuted
        }
    }

    private var borderColor: Color {
        switch intent {
        case .danger: theme.colors.danger
        case .primary: theme.colors.brandSolid
        case .quiet: .clear
        case .secondary: theme.colors.line
        }
    }

    private var foregroundColor: Color {
        switch intent {
        case .danger: theme.colors.onDanger
        case .primary: theme.colors.onBrand
        case .quiet: theme.colors.inkSoft
        case .secondary: theme.colors.ink
        }
    }
}

public struct LumenButton<Label: View>: View {
    private let action: () -> Void
    private let disabled: Bool
    private let intent: LumenButtonIntent
    private let label: Label
    private let loading: Bool
    private let size: LumenControlSize

    public init(
        intent: LumenButtonIntent = .primary,
        size: LumenControlSize = .md,
        loading: Bool = false,
        disabled: Bool = false,
        action: @escaping () -> Void,
        @ViewBuilder label: () -> Label
    ) {
        self.action = action
        self.disabled = disabled
        self.intent = intent
        self.label = label()
        self.loading = loading
        self.size = size
    }

    public var body: some View {
        Button(action: action) {
            HStack(spacing: LumenSpacing.sm) {
                if loading {
                    ProgressView()
                        .controlSize(.small)
                }
                label
            }
        }
        .buttonStyle(LumenButtonStyle(intent: intent, size: size))
        .disabled(disabled || loading)
        .accessibilityValue(loading ? "Loading" : "")
    }
}

public extension LumenButton where Label == Text {
    init(
        _ title: LocalizedStringKey,
        intent: LumenButtonIntent = .primary,
        size: LumenControlSize = .md,
        loading: Bool = false,
        disabled: Bool = false,
        action: @escaping () -> Void
    ) {
        self.init(
            intent: intent,
            size: size,
            loading: loading,
            disabled: disabled,
            action: action
        ) {
            Text(title)
        }
    }
}

public struct LumenTextField: View {
    @Binding private var text: String
    @Environment(\.isEnabled) private var isEnabled
    @Environment(\.lumenTheme) private var theme

    private let error: Bool
    private let errorMessage: String?
    private let size: LumenControlSize
    private let title: String

    public init(
        _ title: String,
        text: Binding<String>,
        size: LumenControlSize = .md,
        error: Bool = false,
        errorMessage: String? = nil
    ) {
        self.title = title
        _text = text
        self.size = size
        self.error = error
        self.errorMessage = errorMessage
    }

    public var body: some View {
        TextField(title, text: $text)
            .textFieldStyle(.plain)
            .font(size == .lg ? .body : .callout)
            .foregroundStyle(theme.colors.ink)
            .frame(minHeight: LumenButtonMetrics.resolve(size).minHeight)
            .padding(.horizontal, LumenSpacing.md)
            .background(theme.colors.surface)
            .overlay {
                RoundedRectangle(cornerRadius: LumenRadius.sm, style: .continuous)
                    .stroke(error ? theme.colors.danger : theme.colors.line, lineWidth: 1)
            }
            .clipShape(RoundedRectangle(cornerRadius: LumenRadius.sm, style: .continuous))
            .opacity(isEnabled ? 1 : 0.52)
            .accessibilityValue(error ? errorMessage ?? "Invalid value" : text)
    }
}

public enum LumenBadgeTone: Sendable {
    case accent
    case danger
    case neutral
    case success
    case warning
}

public struct LumenBadge: View {
    @Environment(\.lumenTheme) private var theme

    private let content: LocalizedStringKey
    private let tone: LumenBadgeTone

    public init(
        _ content: LocalizedStringKey,
        tone: LumenBadgeTone = .neutral
    ) {
        self.content = content
        self.tone = tone
    }

    public var body: some View {
        Text(content)
            .font(.caption.weight(.semibold))
            .foregroundStyle(foregroundColor)
            .padding(.horizontal, LumenSpacing.sm)
            .padding(.vertical, LumenSpacing.xs)
            .background(backgroundColor)
            .clipShape(Capsule())
    }

    private var foregroundColor: Color {
        switch tone {
        case .accent: theme.colors.accent
        case .danger: theme.colors.danger
        case .neutral: theme.colors.inkSoft
        case .success: theme.colors.success
        case .warning: theme.colors.warning
        }
    }

    private var backgroundColor: Color {
        tone == .neutral ? theme.colors.surfaceMuted : foregroundColor.opacity(0.12)
    }
}

public struct LumenDivider: View {
    @Environment(\.lumenTheme) private var theme

    public init() {}

    public var body: some View {
        Rectangle()
            .fill(theme.colors.line)
            .frame(height: 1)
            .accessibilityHidden(true)
    }
}

public struct LumenSpinner: View {
    @Environment(\.lumenTheme) private var theme

    private let label: LocalizedStringKey

    public init(_ label: LocalizedStringKey = "Loading") {
        self.label = label
    }

    public var body: some View {
        ProgressView()
            .tint(theme.colors.brand)
            .accessibilityLabel(label)
    }
}
