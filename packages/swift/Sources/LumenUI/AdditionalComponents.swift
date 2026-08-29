import SwiftUI

public enum LumenButtonGroupOrientation: Sendable {
    case horizontal
    case vertical
}

public struct LumenButtonGroup<Content: View>: View {
    private let content: Content
    private let orientation: LumenButtonGroupOrientation

    public init(
        orientation: LumenButtonGroupOrientation = .horizontal,
        @ViewBuilder content: () -> Content
    ) {
        self.orientation = orientation
        self.content = content()
    }

    public var body: some View {
        Group {
            if orientation == .horizontal {
                HStack(spacing: LumenSpacing.sm) { content }
            } else {
                VStack(alignment: .leading, spacing: LumenSpacing.sm) { content }
            }
        }
        .accessibilityElement(children: .contain)
    }
}

public struct LumenFieldGroup<Content: View>: View {
    @Environment(\.lumenTheme) private var theme

    private let content: Content
    private let description: LumenTextContent?
    private let errorMessage: LumenTextContent?
    private let required: Bool
    private let title: LumenTextContent

    public init(
        _ title: LocalizedStringKey,
        description: LocalizedStringKey? = nil,
        errorMessage: LocalizedStringKey? = nil,
        required: Bool = false,
        @ViewBuilder content: () -> Content
    ) {
        self.title = .localized(title)
        self.description = description.map(LumenTextContent.localized)
        self.errorMessage = errorMessage.map(LumenTextContent.localized)
        self.required = required
        self.content = content()
    }

    public init(
        _ title: LumenTextContent,
        description: LumenTextContent? = nil,
        errorMessage: LumenTextContent? = nil,
        required: Bool = false,
        @ViewBuilder content: () -> Content
    ) {
        self.title = title
        self.description = description
        self.errorMessage = errorMessage
        self.required = required
        self.content = content()
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: LumenSpacing.sm) {
            HStack(spacing: LumenSpacing.xs) {
                title.text
                    .font(.callout.weight(.semibold))
                    .foregroundStyle(theme.colors.ink)
                if required {
                    Text("*").foregroundStyle(theme.colors.danger).accessibilityLabel("Required")
                }
            }
            if let description {
                description.text
                    .font(.caption)
                    .foregroundStyle(theme.colors.inkMuted)
            }
            content
            if let errorMessage {
                errorMessage.text
                    .font(.caption)
                    .foregroundStyle(theme.colors.danger)
                    .accessibilityAddTraits(.updatesFrequently)
            }
        }
        .accessibilityElement(children: .contain)
    }
}

#if !os(watchOS) && !os(tvOS)
public struct LumenTextarea: View {
    @Binding private var text: String
    @Environment(\.isEnabled) private var isEnabled
    @Environment(\.lumenTheme) private var theme

    private let description: LumenTextContent?
    private let errorMessage: LumenTextContent?
    private let lineLimit: ClosedRange<Int>?
    private let minHeight: CGFloat
    private let title: LumenTextContent
    private let trailingAccessory: AnyView?

    public init(
        _ title: LocalizedStringKey,
        text: Binding<String>,
        description: LocalizedStringKey? = nil,
        errorMessage: LocalizedStringKey? = nil,
        minHeight: CGFloat = 112,
        lineLimit: ClosedRange<Int>? = nil
    ) {
        self.title = .localized(title)
        _text = text
        self.description = description.map(LumenTextContent.localized)
        self.errorMessage = errorMessage.map(LumenTextContent.localized)
        self.minHeight = minHeight
        self.lineLimit = lineLimit
        trailingAccessory = nil
    }

    public init(
        _ title: LumenTextContent,
        text: Binding<String>,
        description: LumenTextContent? = nil,
        errorMessage: LumenTextContent? = nil,
        minHeight: CGFloat = 112,
        lineLimit: ClosedRange<Int>? = nil
    ) {
        self.title = title
        _text = text
        self.description = description
        self.errorMessage = errorMessage
        self.minHeight = minHeight
        self.lineLimit = lineLimit
        trailingAccessory = nil
    }

    public init<Accessory: View>(
        _ title: LumenTextContent,
        text: Binding<String>,
        description: LumenTextContent? = nil,
        errorMessage: LumenTextContent? = nil,
        minHeight: CGFloat = 72,
        lineLimit: ClosedRange<Int>? = 2...6,
        @ViewBuilder trailingAccessory: () -> Accessory
    ) {
        self.title = title
        _text = text
        self.description = description
        self.errorMessage = errorMessage
        self.minHeight = minHeight
        self.lineLimit = lineLimit
        self.trailingAccessory = AnyView(trailingAccessory())
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: LumenSpacing.xs) {
            title.text
                .font(.callout.weight(.semibold))
                .foregroundStyle(theme.colors.ink)
            HStack(alignment: .bottom, spacing: LumenSpacing.sm) {
                editor

                if let trailingAccessory {
                    trailingAccessory
                        .frame(minWidth: 44, minHeight: 44)
                }
            }
                .padding(LumenSpacing.sm)
                .background(theme.colors.surface)
                .overlay {
                    RoundedRectangle(cornerRadius: LumenRadius.sm, style: .continuous)
                        .stroke(errorMessage == nil ? theme.colors.line : theme.colors.danger, lineWidth: 1)
                }
                .clipShape(RoundedRectangle(cornerRadius: LumenRadius.sm, style: .continuous))
                .opacity(isEnabled ? 1 : 0.52)
            if let errorMessage {
                errorMessage.text.font(.caption).foregroundStyle(theme.colors.danger)
            } else if let description {
                description.text.font(.caption).foregroundStyle(theme.colors.inkMuted)
            }
        }
    }

    @ViewBuilder
    private var editor: some View {
        let editor = TextEditor(text: $text)
            .scrollContentBackground(.hidden)
            .font(.callout)
            .foregroundStyle(theme.colors.ink)
            .frame(minHeight: minHeight)
            .lumenAccessibilityHint(errorMessage ?? description)
            .accessibilityLabel(title.text)
            .accessibilityValue(Text(verbatim: text))

        if let lineLimit { editor.lineLimit(lineLimit) } else { editor }
    }
}
#endif

public struct LumenChip: View {
    @Environment(\.isEnabled) private var isEnabled
    @Environment(\.lumenTheme) private var theme

    private let label: LocalizedStringKey
    private let onPress: (() -> Void)?
    private let onRemove: (() -> Void)?
    private let removeLabel: LocalizedStringKey
    private let selected: Bool

    public init(
        _ label: LocalizedStringKey,
        selected: Bool = false,
        removeLabel: LocalizedStringKey = "Remove",
        onPress: (() -> Void)? = nil,
        onRemove: (() -> Void)? = nil
    ) {
        self.label = label
        self.selected = selected
        self.removeLabel = removeLabel
        self.onPress = onPress
        self.onRemove = onRemove
    }

    public var body: some View {
        HStack(spacing: LumenSpacing.xs) {
            if let onPress {
                Button(action: onPress) {
                    Text(label).font(.caption.weight(.semibold))
                }
                .buttonStyle(.plain)
                .frame(minHeight: 24)
                .accessibilityAddTraits(selected ? .isSelected : [])
            } else {
                Text(label).font(.caption.weight(.semibold))
            }
            if let onRemove {
                Button(action: onRemove) {
                    Image(systemName: "xmark").font(.caption2.weight(.bold))
                }
                .buttonStyle(.plain)
                .frame(minWidth: 24, minHeight: 24)
                .accessibilityLabel(removeLabel)
            }
        }
        .foregroundStyle(selected ? theme.colors.brand : theme.colors.inkSoft)
        .padding(.horizontal, LumenSpacing.md)
        .frame(minHeight: 32)
        .background(selected ? theme.colors.brandSoft : theme.colors.surfaceMuted)
        .overlay {
            Capsule().stroke(selected ? theme.colors.brand : theme.colors.line, lineWidth: 1)
        }
        .clipShape(Capsule())
        .opacity(isEnabled ? 1 : 0.52)
        .accessibilityElement(children: .contain)
    }
}

public struct LumenToast<Actions: View>: View {
    @Environment(\.lumenTheme) private var theme

    private let actions: Actions
    private let description: LocalizedStringKey?
    private let onDismiss: (() -> Void)?
    private let title: LocalizedStringKey
    private let variant: LumenBannerVariant

    public init(
        _ title: LocalizedStringKey,
        description: LocalizedStringKey? = nil,
        variant: LumenBannerVariant = .default,
        onDismiss: (() -> Void)? = nil,
        @ViewBuilder actions: () -> Actions
    ) {
        self.title = title
        self.description = description
        self.variant = variant
        self.onDismiss = onDismiss
        self.actions = actions()
    }

    public var body: some View {
        HStack(spacing: LumenSpacing.md) {
            VStack(alignment: .leading, spacing: LumenSpacing.xs) {
                Text(title).font(.callout.weight(.semibold)).foregroundStyle(accentColor)
                if let description {
                    Text(description).font(.caption).foregroundStyle(theme.colors.inkSoft)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            actions
            if let onDismiss {
                LumenIconButton(
                    systemName: "xmark",
                    label: "Dismiss",
                    intent: .quiet,
                    size: .sm,
                    action: onDismiss
                )
            }
        }
        .padding(.horizontal, LumenSpacing.lg)
        .padding(.vertical, LumenSpacing.md)
        .background(backgroundColor)
        .overlay {
            RoundedRectangle(cornerRadius: LumenRadius.md, style: .continuous)
                .stroke(borderColor, lineWidth: 1)
        }
        .clipShape(RoundedRectangle(cornerRadius: LumenRadius.md, style: .continuous))
        .accessibilityElement(children: .contain)
        .accessibilityAddTraits(.updatesFrequently)
    }

    private var accentColor: Color {
        switch variant {
        case .accent: theme.colors.accent
        case .default: theme.colors.brand
        case .destructive: theme.colors.danger
        case .success: theme.colors.success
        case .warning: theme.colors.warning
        }
    }

    private var backgroundColor: Color {
        variant == .default ? theme.colors.surface : accentColor.opacity(0.08)
    }

    private var borderColor: Color {
        variant == .default ? theme.colors.line : accentColor.opacity(0.32)
    }
}

public extension LumenToast where Actions == EmptyView {
    init(
        _ title: LocalizedStringKey,
        description: LocalizedStringKey? = nil,
        variant: LumenBannerVariant = .default,
        onDismiss: (() -> Void)? = nil
    ) {
        self.init(title, description: description, variant: variant, onDismiss: onDismiss) {
            EmptyView()
        }
    }
}
