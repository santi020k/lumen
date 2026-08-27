import SwiftUI

#if canImport(WidgetKit) && !os(tvOS) && !os(visionOS)
import WidgetKit

public enum LumenWidgetTextContent {
    case localizedKey(LocalizedStringKey)
    case localizedResource(LocalizedStringResource)
    case verbatim(String)

    public static func localized(_ key: LocalizedStringKey) -> Self { .localizedKey(key) }
    public static func localized(_ resource: LocalizedStringResource) -> Self { .localizedResource(resource) }

    var text: Text {
        switch self {
        case let .localizedKey(key): Text(key)
        case let .localizedResource(resource): Text(resource)
        case let .verbatim(value): Text(verbatim: value)
        }
    }
}

public enum LumenWidgetTone: Sendable {
    case accent
    case danger
    case primary
    case secondary
    case success
    case warning
}

public enum LumenWidgetTextStyle: Sendable {
    case body
    case caption
    case label
    case metric
    case title

    var font: Font {
        switch self {
        case .body: .body
        case .caption: .caption
        case .label: .caption.weight(.semibold)
        case .metric: .title2.monospacedDigit().weight(.bold)
        case .title: .headline.weight(.bold)
        }
    }
}

enum LumenWidgetRenderingKind: Equatable, Sendable {
    case accented
    case fullColor
    case vibrant
}

enum LumenWidgetColorChoice: Equatable, Sendable {
    case accent
    case danger
    case primary
    case secondary
    case success
    case warning
}

func resolveLumenWidgetColorChoice(
    tone: LumenWidgetTone,
    rendering: LumenWidgetRenderingKind
) -> LumenWidgetColorChoice {
    guard rendering == .fullColor else {
        return tone == .secondary ? .secondary : .primary
    }

    return switch tone {
    case .accent: .accent
    case .danger: .danger
    case .primary: .primary
    case .secondary: .secondary
    case .success: .success
    case .warning: .warning
    }
}

func resolveLumenWidgetBorderWidth(increasedContrast: Bool) -> CGFloat {
    increasedContrast ? 2 : 1
}

private struct LumenWidgetForegroundModifier: ViewModifier {
    @Environment(\.colorScheme) private var colorScheme
    @Environment(\.widgetRenderingMode) private var renderingMode

    let tone: LumenWidgetTone

    func body(content: Content) -> some View {
        content
            .foregroundStyle(foreground)
            .widgetAccentable(tone != .secondary)
    }

    private var foreground: Color {
        let choice = resolveLumenWidgetColorChoice(tone: tone, rendering: renderingKind)
        let palette = colorScheme == .dark ? LumenWidgetColors.dark : LumenWidgetColors.light

        return switch choice {
        case .accent: palette.accent
        case .danger: palette.danger
        case .primary: Color.primary
        case .secondary: Color.secondary
        case .success: palette.success
        case .warning: palette.warning
        }
    }

    private var renderingKind: LumenWidgetRenderingKind {
        switch renderingMode {
        case .accented: .accented
        case .fullColor: .fullColor
        case .vibrant: .vibrant
        default: .vibrant
        }
    }
}

public struct LumenWidgetText: View {
    private let content: LumenWidgetTextContent
    private let style: LumenWidgetTextStyle
    private let tone: LumenWidgetTone

    public init(
        _ content: LocalizedStringKey,
        style: LumenWidgetTextStyle = .body,
        tone: LumenWidgetTone = .primary
    ) {
        self.content = .localized(content)
        self.style = style
        self.tone = tone
    }

    public init(
        _ content: LumenWidgetTextContent,
        style: LumenWidgetTextStyle = .body,
        tone: LumenWidgetTone = .primary
    ) {
        self.content = content
        self.style = style
        self.tone = tone
    }

    public var body: some View {
        content.text
            .font(style.font)
            .modifier(LumenWidgetForegroundModifier(tone: tone))
            .fixedSize(horizontal: false, vertical: true)
    }
}

public struct LumenWidgetIcon: View {
    private let label: LumenWidgetTextContent?
    private let size: CGFloat
    private let systemName: String
    private let tone: LumenWidgetTone

    public init(
        systemName: String,
        label: LumenWidgetTextContent? = nil,
        tone: LumenWidgetTone = .accent,
        size: CGFloat = 18
    ) {
        self.systemName = systemName
        self.label = label
        self.tone = tone
        self.size = size
    }

    public var body: some View {
        Image(systemName: systemName)
            .font(.system(size: size, weight: .semibold))
            .modifier(LumenWidgetForegroundModifier(tone: tone))
            .accessibilityHidden(label == nil)
            .accessibilityLabel(label?.text ?? Text(""))
    }
}

public struct LumenWidgetBadge: View {
    @Environment(\.colorScheme) private var colorScheme
    @Environment(\.colorSchemeContrast) private var contrast

    private let iconSystemName: String?
    private let label: LumenWidgetTextContent
    private let tone: LumenWidgetTone

    public init(
        _ label: LumenWidgetTextContent,
        iconSystemName: String? = nil,
        tone: LumenWidgetTone = .accent
    ) {
        self.label = label
        self.iconSystemName = iconSystemName
        self.tone = tone
    }

    public var body: some View {
        HStack(spacing: LumenWidgetSpacing.xs) {
            if let iconSystemName {
                Image(systemName: iconSystemName).accessibilityHidden(true)
            }
            label.text
                .lineLimit(1)
                .minimumScaleFactor(0.75)
        }
        .font(.caption2.weight(.semibold))
        .modifier(LumenWidgetForegroundModifier(tone: tone))
        .padding(.horizontal, LumenWidgetSpacing.sm)
        .padding(.vertical, LumenWidgetSpacing.xs)
        .background(.primary.opacity(contrast == .increased ? 0.16 : 0.08), in: Capsule())
        .overlay {
            Capsule().stroke(.primary.opacity(0.24), lineWidth: resolveLumenWidgetBorderWidth(increasedContrast: contrast == .increased))
        }
        .accessibilityElement(children: .combine)
    }
}

public struct LumenWidgetCompactStat: View {
    private let iconSystemName: String?
    private let label: LumenWidgetTextContent
    private let tone: LumenWidgetTone
    private let value: LumenWidgetTextContent

    public init(
        label: LumenWidgetTextContent,
        value: LumenWidgetTextContent,
        iconSystemName: String? = nil,
        tone: LumenWidgetTone = .accent
    ) {
        self.label = label
        self.value = value
        self.iconSystemName = iconSystemName
        self.tone = tone
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: LumenWidgetSpacing.xs) {
            HStack(spacing: LumenWidgetSpacing.xs) {
                if let iconSystemName {
                    LumenWidgetIcon(systemName: iconSystemName, tone: tone, size: 12)
                }
                LumenWidgetText(label, style: .label, tone: .secondary)
            }
            LumenWidgetText(value, style: .metric, tone: tone)
                .lineLimit(1)
                .minimumScaleFactor(0.65)
        }
        .accessibilityElement(children: .combine)
    }
}
#endif
