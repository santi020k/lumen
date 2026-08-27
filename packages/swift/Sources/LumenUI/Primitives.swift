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

    private let content: LumenTextContent
    private let tone: LumenTextTone
    private let variant: LumenTextVariant

    public init(
        _ content: LocalizedStringKey,
        variant: LumenTextVariant = .body,
        tone: LumenTextTone = .default
    ) {
        self.content = .localized(content)
        self.variant = variant
        self.tone = tone
    }

    public init(
        _ content: LumenTextContent,
        variant: LumenTextVariant = .body,
        tone: LumenTextTone = .default
    ) {
        self.content = content
        self.variant = variant
        self.tone = tone
    }

    public var body: some View {
        content.text
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
    case xl

    var value: CGFloat {
        switch self {
        case .lg: LumenSpacing.lg
        case .md: LumenSpacing.md
        case .none: 0
        case .sm: LumenSpacing.sm
        case .xl: LumenSpacing.xl
        }
    }
}

public enum LumenSurfaceRadius: Sendable {
    case size2xl
    case size3xl
    case lg
    case md
    case none
    case sm
    case xl

    var value: CGFloat {
        switch self {
        case .size2xl: LumenRadius.size2xl
        case .size3xl: LumenRadius.size3xl
        case .lg: LumenRadius.lg
        case .md: LumenRadius.md
        case .none: 0
        case .sm: LumenRadius.sm
        case .xl: LumenRadius.xl
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

public enum LumenIconSize: Sendable {
    case lg
    case md
    case sm

    var dimension: CGFloat {
        switch self {
        case .lg: 24
        case .md: 20
        case .sm: 16
        }
    }
}

public struct LumenIcon: View {
    @Environment(\.lumenTheme) private var theme

    private let color: Color?
    private let label: LocalizedStringKey?
    private let name: LumenIconName?
    private let size: LumenIconSize
    private let systemName: String?

    public init(
        name: LumenIconName,
        size: LumenIconSize = .md,
        color: Color? = nil,
        label: LocalizedStringKey? = nil
    ) {
        self.name = name
        self.systemName = nil
        self.size = size
        self.color = color
        self.label = label
    }

    public init(
        systemName: String,
        size: LumenIconSize = .md,
        color: Color? = nil,
        label: LocalizedStringKey? = nil
    ) {
        self.name = nil
        self.systemName = systemName
        self.size = size
        self.color = color
        self.label = label
    }

    public var body: some View {
        iconImage
            .foregroundStyle(color ?? theme.colors.ink)
            .frame(width: size.dimension, height: size.dimension)
            .accessibilityHidden(label == nil)
            .accessibilityLabel(label ?? "")
    }

    @ViewBuilder private var iconImage: some View {
        if let name {
            Image(name.assetName, bundle: .module)
                .resizable()
                .scaledToFit()
        } else if let systemName {
            Image(systemName: systemName)
                .font(.system(size: size.dimension, weight: .medium))
        }
    }
}

public struct LumenIconButtonMetrics: Equatable, Sendable {
    public let iconSize: LumenIconSize
    public let touchTarget: CGFloat

    public static func resolve(
        _ size: LumenControlSize,
        density: LumenControlDensity = .platformDefault
    ) -> LumenIconButtonMetrics {
        switch (density, size) {
        case (.compact, .lg): LumenIconButtonMetrics(iconSize: .lg, touchTarget: 40)
        case (.compact, .md): LumenIconButtonMetrics(iconSize: .md, touchTarget: 32)
        case (.compact, .sm): LumenIconButtonMetrics(iconSize: .sm, touchTarget: 28)
        case (.regular, .lg): LumenIconButtonMetrics(iconSize: .lg, touchTarget: 52)
        case (.regular, .md): LumenIconButtonMetrics(iconSize: .md, touchTarget: 44)
        case (.regular, .sm): LumenIconButtonMetrics(iconSize: .sm, touchTarget: 44)
        }
    }
}

public struct LumenIconButtonStyle: ButtonStyle {
    @Environment(\.lumenControlDensity) private var density
    @Environment(\.isEnabled) private var isEnabled
    @Environment(\.lumenTheme) private var theme

    private let intent: LumenButtonIntent
    private let size: LumenControlSize

    public init(intent: LumenButtonIntent = .quiet, size: LumenControlSize = .md) {
        self.intent = intent
        self.size = size
    }

    public func makeBody(configuration: Configuration) -> some View {
        let metrics = LumenIconButtonMetrics.resolve(size, density: density)

        configuration.label
            .frame(width: metrics.touchTarget, height: metrics.touchTarget)
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
}

public struct LumenIconButton: View {
    @Environment(\.lumenControlDensity) private var density
    @Environment(\.lumenTheme) private var theme

    private let action: () -> Void
    private let disabled: Bool
    private let intent: LumenButtonIntent
    private let label: LocalizedStringKey
    private let name: LumenIconName?
    private let size: LumenControlSize
    private let systemName: String?

    public init(
        name: LumenIconName,
        label: LocalizedStringKey,
        intent: LumenButtonIntent = .quiet,
        size: LumenControlSize = .md,
        disabled: Bool = false,
        action: @escaping () -> Void
    ) {
        self.name = name
        self.systemName = nil
        self.label = label
        self.intent = intent
        self.size = size
        self.disabled = disabled
        self.action = action
    }

    public init(
        systemName: String,
        label: LocalizedStringKey,
        intent: LumenButtonIntent = .quiet,
        size: LumenControlSize = .md,
        disabled: Bool = false,
        action: @escaping () -> Void
    ) {
        self.name = nil
        self.systemName = systemName
        self.label = label
        self.intent = intent
        self.size = size
        self.disabled = disabled
        self.action = action
    }

    public var body: some View {
        let metrics = LumenIconButtonMetrics.resolve(size, density: density)

        Button(action: action) {
            icon(size: metrics.iconSize)
        }
        .buttonStyle(LumenIconButtonStyle(intent: intent, size: size))
        .disabled(disabled)
        .accessibilityLabel(label)
    }

    @ViewBuilder private func icon(size: LumenIconSize) -> some View {
        if let name {
            LumenIcon(name: name, size: size, color: foregroundColor)
        } else if let systemName {
            LumenIcon(systemName: systemName, size: size, color: foregroundColor)
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

public struct LumenButtonMetrics: Equatable, Sendable {
    public let horizontalPadding: CGFloat
    public let minHeight: CGFloat

    public static func resolve(
        _ size: LumenControlSize,
        density: LumenControlDensity = .platformDefault
    ) -> LumenButtonMetrics {
        switch (density, size) {
        case (.compact, .lg):
            LumenButtonMetrics(horizontalPadding: LumenSpacing.lg, minHeight: 40)
        case (.compact, .md):
            LumenButtonMetrics(horizontalPadding: LumenSpacing.md, minHeight: 32)
        case (.compact, .sm):
            LumenButtonMetrics(horizontalPadding: LumenSpacing.md, minHeight: 28)
        case (.regular, .lg):
            LumenButtonMetrics(horizontalPadding: LumenSpacing.xl, minHeight: 52)
        case (.regular, .md):
            LumenButtonMetrics(horizontalPadding: LumenSpacing.lg, minHeight: 44)
        case (.regular, .sm):
            LumenButtonMetrics(horizontalPadding: LumenSpacing.md, minHeight: 36)
        }
    }
}

public struct LumenButtonStyle: ButtonStyle {
    @Environment(\.lumenControlDensity) private var density
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
        let metrics = LumenButtonMetrics.resolve(size, density: density)

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
#if os(tvOS)
                    ProgressView()
#else
                    ProgressView()
                        .controlSize(.small)
#endif
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

    init(
        _ title: LumenTextContent,
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
            title.text
        }
    }
}

public struct LumenTextField: View {
    @Binding private var text: String
    @Environment(\.isEnabled) private var isEnabled
    @Environment(\.lumenControlDensity) private var density
    @Environment(\.lumenTheme) private var theme

    private let error: Bool
    private let errorMessage: LumenTextContent?
    private let size: LumenControlSize
    private let title: LumenTextContent

    public init(
        _ title: String,
        text: Binding<String>,
        size: LumenControlSize = .md,
        error: Bool = false,
        errorMessage: String? = nil
    ) {
        self.title = .verbatim(title)
        _text = text
        self.size = size
        self.error = error
        self.errorMessage = errorMessage.map(LumenTextContent.verbatim)
    }

    public init(
        _ title: LumenTextContent,
        text: Binding<String>,
        size: LumenControlSize = .md,
        error: Bool = false,
        errorMessage: LumenTextContent? = nil
    ) {
        self.title = title
        _text = text
        self.size = size
        self.error = error
        self.errorMessage = errorMessage
    }

    public var body: some View {
        let validationMessage = error || errorMessage != nil
            ? errorMessage ?? .localized(LocalizedStringKey("Invalid value"))
            : nil

        TextField(text: $text) {
            title.text
        }
            .textFieldStyle(.plain)
            .font(size == .lg ? .body : .callout)
            .foregroundStyle(theme.colors.ink)
            .frame(minHeight: LumenButtonMetrics.resolve(size, density: density).minHeight)
            .padding(.horizontal, LumenSpacing.md)
            .background(theme.colors.surface)
            .overlay {
                RoundedRectangle(cornerRadius: LumenRadius.sm, style: .continuous)
                    .stroke(validationMessage == nil ? theme.colors.line : theme.colors.danger, lineWidth: 1)
            }
            .clipShape(RoundedRectangle(cornerRadius: LumenRadius.sm, style: .continuous))
            .opacity(isEnabled ? 1 : 0.52)
            .lumenAccessibilityHint(validationMessage)
            .accessibilityValue(Text(verbatim: text))
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

    private let content: LumenTextContent
    private let tone: LumenBadgeTone

    public init(
        _ content: LocalizedStringKey,
        tone: LumenBadgeTone = .neutral
    ) {
        self.content = .localized(content)
        self.tone = tone
    }

    public init(
        _ content: LumenTextContent,
        tone: LumenBadgeTone = .neutral
    ) {
        self.content = content
        self.tone = tone
    }

    public var body: some View {
        content.text
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

    private let label: LumenTextContent

    public init(_ label: LocalizedStringKey = "Loading") {
        self.label = .localized(label)
    }

    public init(_ label: LumenTextContent) {
        self.label = label
    }

    public var body: some View {
        ProgressView()
            .tint(theme.colors.brand)
            .accessibilityLabel(label.text)
    }
}
