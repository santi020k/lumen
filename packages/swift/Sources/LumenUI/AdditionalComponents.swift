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
    private let description: LocalizedStringKey?
    private let errorMessage: LocalizedStringKey?
    private let required: Bool
    private let title: LocalizedStringKey

    public init(
        _ title: LocalizedStringKey,
        description: LocalizedStringKey? = nil,
        errorMessage: LocalizedStringKey? = nil,
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
                Text(title)
                    .font(.callout.weight(.semibold))
                    .foregroundStyle(theme.colors.ink)
                if required {
                    Text("*").foregroundStyle(theme.colors.danger).accessibilityLabel("Required")
                }
            }
            if let description {
                Text(description)
                    .font(.caption)
                    .foregroundStyle(theme.colors.inkMuted)
            }
            content
            if let errorMessage {
                Text(errorMessage)
                    .font(.caption)
                    .foregroundStyle(theme.colors.danger)
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

    private let description: LocalizedStringKey?
    private let errorMessage: LocalizedStringKey?
    private let minHeight: CGFloat
    private let title: LocalizedStringKey

    public init(
        _ title: LocalizedStringKey,
        text: Binding<String>,
        description: LocalizedStringKey? = nil,
        errorMessage: LocalizedStringKey? = nil,
        minHeight: CGFloat = 112
    ) {
        self.title = title
        _text = text
        self.description = description
        self.errorMessage = errorMessage
        self.minHeight = minHeight
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: LumenSpacing.xs) {
            Text(title)
                .font(.callout.weight(.semibold))
                .foregroundStyle(theme.colors.ink)
            TextEditor(text: $text)
                .scrollContentBackground(.hidden)
                .font(.callout)
                .foregroundStyle(theme.colors.ink)
                .frame(minHeight: minHeight)
                .padding(LumenSpacing.sm)
                .background(theme.colors.surface)
                .overlay {
                    RoundedRectangle(cornerRadius: LumenRadius.sm, style: .continuous)
                        .stroke(errorMessage == nil ? theme.colors.line : theme.colors.danger, lineWidth: 1)
                }
                .clipShape(RoundedRectangle(cornerRadius: LumenRadius.sm, style: .continuous))
                .opacity(isEnabled ? 1 : 0.52)
                .accessibilityLabel(title)
                .accessibilityValue(errorMessage ?? LocalizedStringKey(text))
            if let errorMessage {
                Text(errorMessage).font(.caption).foregroundStyle(theme.colors.danger)
            } else if let description {
                Text(description).font(.caption).foregroundStyle(theme.colors.inkMuted)
            }
        }
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
                .accessibilityAddTraits(selected ? .isSelected : [])
            } else {
                Text(label).font(.caption.weight(.semibold))
            }
            if let onRemove {
                Button(action: onRemove) {
                    Image(systemName: "xmark").font(.caption2.weight(.bold))
                }
                .buttonStyle(.plain)
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
