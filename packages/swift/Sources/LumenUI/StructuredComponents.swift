import SwiftUI

public enum LumenEmptyStateLayout: Sendable {
    case compact
    case `default`
    case page
}

public struct LumenEmptyState<Actions: View>: View {
    @Environment(\.lumenTheme) private var theme

    private let actions: Actions
    private let description: LocalizedStringKey?
    private let layout: LumenEmptyStateLayout
    private let systemName: String
    private let title: LocalizedStringKey

    public init(
        _ title: LocalizedStringKey,
        systemName: String,
        description: LocalizedStringKey? = nil,
        @ViewBuilder actions: () -> Actions
    ) {
        self.init(
            title,
            systemName: systemName,
            description: description,
            layout: .default,
            actions: actions
        )
    }

    public init(
        _ title: LocalizedStringKey,
        systemName: String,
        description: LocalizedStringKey? = nil,
        layout: LumenEmptyStateLayout = .default,
        @ViewBuilder actions: () -> Actions
    ) {
        self.title = title
        self.systemName = systemName
        self.description = description
        self.layout = layout
        self.actions = actions()
    }

    public var body: some View {
        VStack(spacing: layout == .compact ? LumenSpacing.md : LumenSpacing.lg) {
            LumenIcon(systemName: systemName, size: .lg, color: theme.colors.inkMuted)
                .padding(LumenSpacing.md)
                .background(theme.colors.surfaceMuted, in: Circle())

            VStack(spacing: LumenSpacing.sm) {
                Text(title)
                    .font(.headline)
                    .foregroundStyle(theme.colors.ink)

                if let description {
                    Text(description)
                        .font(.callout)
                        .foregroundStyle(theme.colors.inkMuted)
                        .multilineTextAlignment(.center)
                        .fixedSize(horizontal: false, vertical: true)
                }
            }

            actions
        }
        .frame(maxWidth: layout == .page ? 520 : 440)
        .padding(layout == .compact ? LumenSpacing.lg : LumenSpacing.xl)
        .frame(maxWidth: .infinity, maxHeight: layout == .compact ? nil : .infinity)
        .accessibilityElement(children: .contain)
    }
}

public extension LumenEmptyState where Actions == EmptyView {
    init(
        _ title: LocalizedStringKey,
        systemName: String,
        description: LocalizedStringKey? = nil
    ) {
        self.init(title, systemName: systemName, description: description, layout: .default) {
            EmptyView()
        }
    }

    init(
        _ title: LocalizedStringKey,
        systemName: String,
        description: LocalizedStringKey? = nil,
        layout: LumenEmptyStateLayout = .default
    ) {
        self.init(title, systemName: systemName, description: description, layout: layout) {
            EmptyView()
        }
    }
}

public enum LumenErrorStateKind: Sendable {
    case error
    case offline
}

public enum LumenErrorStateLayout: Sendable {
    case compact
    case `default`
    case page
}

/// A recoverable application or content failure.
///
/// The caller owns retry behavior and should post a platform accessibility announcement when
/// replacing existing content with this state. The state itself keeps its title and recovery
/// actions discoverable without posting repeated announcements during SwiftUI updates.
public struct LumenErrorState<Graphic: View, Actions: View>: View {
    @Environment(\.lumenTheme) private var theme

    private let actions: Actions
    private let description: LocalizedStringKey?
    private let graphic: Graphic
    private let kind: LumenErrorStateKind
    private let layout: LumenErrorStateLayout
    private let reference: String?
    private let referenceLabel: LocalizedStringKey
    private let title: LocalizedStringKey

    public init(
        _ title: LocalizedStringKey,
        description: LocalizedStringKey? = nil,
        kind: LumenErrorStateKind = .error,
        layout: LumenErrorStateLayout = .default,
        reference: String? = nil,
        referenceLabel: LocalizedStringKey = "Reference",
        @ViewBuilder graphic: () -> Graphic,
        @ViewBuilder actions: () -> Actions
    ) {
        self.title = title
        self.description = description
        self.kind = kind
        self.layout = layout
        self.reference = reference
        self.referenceLabel = referenceLabel
        self.graphic = graphic()
        self.actions = actions()
    }

    public var body: some View {
        VStack(spacing: layout == .compact ? LumenSpacing.md : LumenSpacing.lg) {
            graphic

            VStack(spacing: LumenSpacing.sm) {
                Text(title)
                    .font(.headline)
                    .foregroundStyle(theme.colors.ink)
                    .accessibilityAddTraits(.isHeader)

                if let description {
                    Text(description)
                        .font(.callout)
                        .foregroundStyle(theme.colors.inkMuted)
                        .multilineTextAlignment(.center)
                        .fixedSize(horizontal: false, vertical: true)
                }

                if let reference {
                    HStack(spacing: LumenSpacing.xs) {
                        Text(referenceLabel)
                        Text(verbatim: reference)
                    }
                    .font(.caption.monospaced())
                    .foregroundStyle(theme.colors.inkSoft)
                    #if os(iOS) || os(macOS) || os(visionOS)
                    .textSelection(.enabled)
                    #endif
                }
            }

            actions
        }
        .multilineTextAlignment(.center)
        .frame(maxWidth: 520, maxHeight: layout == .page ? .infinity : nil)
        .padding(layout == .compact ? LumenSpacing.lg : LumenSpacing.xl)
        .frame(maxWidth: .infinity, maxHeight: layout == .page ? .infinity : nil)
        .accessibilityElement(children: .contain)
    }
}

#if os(iOS) || os(macOS) || os(visionOS)
public extension LumenErrorState where Graphic == LumenIllustration {
    init(
        _ title: LocalizedStringKey,
        description: LocalizedStringKey? = nil,
        kind: LumenErrorStateKind = .error,
        layout: LumenErrorStateLayout = .default,
        reference: String? = nil,
        referenceLabel: LocalizedStringKey = "Reference",
        @ViewBuilder actions: () -> Actions
    ) {
        self.init(
            title,
            description: description,
            kind: kind,
            layout: layout,
            reference: reference,
            referenceLabel: referenceLabel,
            graphic: {
                LumenIllustration(
                    variant: kind == .error ? .error : .offline,
                    size: layout == .compact ? .sm : .md
                )
            },
            actions: actions
        )
    }
}

public extension LumenErrorState where Graphic == LumenIllustration, Actions == EmptyView {
    init(
        _ title: LocalizedStringKey,
        description: LocalizedStringKey? = nil,
        kind: LumenErrorStateKind = .error,
        layout: LumenErrorStateLayout = .default,
        reference: String? = nil,
        referenceLabel: LocalizedStringKey = "Reference"
    ) {
        self.init(
            title,
            description: description,
            kind: kind,
            layout: layout,
            reference: reference,
            referenceLabel: referenceLabel,
            actions: { EmptyView() }
        )
    }
}
#endif

public struct LumenListRow<Leading: View, Content: View, Trailing: View>: View {
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
        HStack(alignment: .center, spacing: LumenSpacing.md) {
            leading
                .fixedSize()

            content
                .frame(maxWidth: .infinity, alignment: .leading)

            trailing
                .fixedSize(horizontal: true, vertical: false)
        }
        .padding(.horizontal, LumenSpacing.lg)
        .padding(.vertical, LumenSpacing.md)
        .contentShape(Rectangle())
        .accessibilityElement(children: .contain)
    }
}

public extension LumenListRow where Trailing == EmptyView {
    init(
        @ViewBuilder leading: () -> Leading,
        @ViewBuilder content: () -> Content
    ) {
        self.init(leading: leading, content: content) {
            EmptyView()
        }
    }
}

public enum LumenBannerVariant: Sendable {
    case accent
    case `default`
    case destructive
    case success
    case warning
}

public struct LumenBanner<Actions: View>: View {
    @Environment(\.lumenTheme) private var theme

    private let actions: Actions
    private let description: LocalizedStringKey?
    private let onDismiss: (() -> Void)?
    private let systemName: String?
    private let title: LocalizedStringKey
    private let variant: LumenBannerVariant

    public init(
        _ title: LocalizedStringKey,
        description: LocalizedStringKey? = nil,
        systemName: String? = nil,
        variant: LumenBannerVariant = .default,
        onDismiss: (() -> Void)? = nil,
        @ViewBuilder actions: () -> Actions
    ) {
        self.title = title
        self.description = description
        self.systemName = systemName
        self.variant = variant
        self.onDismiss = onDismiss
        self.actions = actions()
    }

    public var body: some View {
        ViewThatFits(in: .horizontal) {
            horizontalContent
            verticalContent
        }
        .padding(.horizontal, LumenSpacing.lg)
        .padding(.vertical, LumenSpacing.md)
        .background(backgroundColor)
        .overlay(alignment: .leading) {
            Rectangle()
                .fill(accentColor)
                .frame(width: 3)
        }
        .overlay {
            RoundedRectangle(cornerRadius: LumenRadius.md, style: .continuous)
                .stroke(borderColor, lineWidth: 1)
        }
        .clipShape(RoundedRectangle(cornerRadius: LumenRadius.md, style: .continuous))
        .accessibilityElement(children: .contain)
    }

    private var message: some View {
        HStack(alignment: .top, spacing: LumenSpacing.md) {
            LumenIcon(
                systemName: systemName ?? defaultSystemName,
                size: .md,
                color: accentColor
            )

            VStack(alignment: .leading, spacing: LumenSpacing.xs) {
                Text(title)
                    .font(.callout.weight(.semibold))
                    .foregroundStyle(theme.colors.ink)

                if let description {
                    Text(description)
                        .font(.caption)
                        .foregroundStyle(theme.colors.inkSoft)
                        .fixedSize(horizontal: false, vertical: true)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    private var dismissButton: some View {
        Group {
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
    }

    private var horizontalContent: some View {
        HStack(alignment: .center, spacing: LumenSpacing.md) {
            message
            actions
            dismissButton
        }
    }

    private var verticalContent: some View {
        VStack(alignment: .leading, spacing: LumenSpacing.md) {
            HStack(alignment: .top, spacing: LumenSpacing.sm) {
                message
                dismissButton
            }
            actions
        }
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

    private var defaultSystemName: String {
        switch variant {
        case .accent: "sparkles"
        case .default: "info.circle"
        case .destructive: "xmark.octagon"
        case .success: "checkmark.circle"
        case .warning: "exclamationmark.triangle"
        }
    }
}

public extension LumenBanner where Actions == EmptyView {
    init(
        _ title: LocalizedStringKey,
        description: LocalizedStringKey? = nil,
        systemName: String? = nil,
        variant: LumenBannerVariant = .default,
        onDismiss: (() -> Void)? = nil
    ) {
        self.init(
            title,
            description: description,
            systemName: systemName,
            variant: variant,
            onDismiss: onDismiss
        ) {
            EmptyView()
        }
    }
}

public enum LumenMetricTone: Sendable {
    case accent
    case brand
    case danger
    case neutral
    case success
    case warning
}

public enum LumenStatDensity: Sendable {
    case compact
    case `default`
}

public struct LumenStat: View {
    @Environment(\.lumenTheme) private var theme

    private let detail: LocalizedStringKey?
    private let density: LumenStatDensity
    private let label: LocalizedStringKey
    private let systemName: String?
    private let tone: LumenMetricTone
    private let value: String

    public init(
        _ label: LocalizedStringKey,
        value: String,
        detail: LocalizedStringKey? = nil,
        systemName: String? = nil,
        tone: LumenMetricTone = .brand
    ) {
        self.init(
            label,
            value: value,
            detail: detail,
            density: .default,
            systemName: systemName,
            tone: tone
        )
    }

    public init(
        _ label: LocalizedStringKey,
        value: String,
        detail: LocalizedStringKey? = nil,
        density: LumenStatDensity = .default,
        systemName: String? = nil,
        tone: LumenMetricTone = .brand
    ) {
        self.label = label
        self.value = value
        self.detail = detail
        self.density = density
        self.systemName = systemName
        self.tone = tone
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: density == .compact ? LumenSpacing.xs : LumenSpacing.sm) {
            if let systemName {
                LumenIcon(systemName: systemName, size: .sm, color: accentColor)
            }

            Text(value)
                .font(density == .compact ? .headline.weight(.bold) : .title2.weight(.bold))
                .monospacedDigit()
                .foregroundStyle(theme.colors.ink)

            Text(label)
                .font(.caption.weight(.semibold))
                .foregroundStyle(theme.colors.inkSoft)

            if let detail {
                Text(detail)
                    .font(.caption)
                    .foregroundStyle(theme.colors.inkMuted)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(density == .compact ? LumenSpacing.md : LumenSpacing.lg)
        .background(accentColor.opacity(0.06))
        .overlay {
            RoundedRectangle(cornerRadius: LumenRadius.md, style: .continuous)
                .stroke(accentColor.opacity(0.18), lineWidth: 1)
        }
        .clipShape(RoundedRectangle(cornerRadius: LumenRadius.md, style: .continuous))
        .accessibilityElement(children: .combine)
    }

    private var accentColor: Color {
        metricColor(tone, theme: theme)
    }
}

public struct LumenGauge: View {
    @Environment(\.lumenTheme) private var theme

    private let label: LocalizedStringKey
    private let progress: LumenProgressValue
    private let systemName: String?
    private let tone: LumenMetricTone
    private let valueLabel: String

    public init(
        _ label: LocalizedStringKey,
        value: Double,
        max: Double = 100,
        valueLabel: String,
        systemName: String? = nil,
        tone: LumenMetricTone = .brand
    ) {
        self.label = label
        progress = LumenProgressValue.resolve(value: value, max: max)
        self.valueLabel = valueLabel
        self.systemName = systemName
        self.tone = tone
    }

    public var body: some View {
        VStack(spacing: LumenSpacing.md) {
            ZStack {
                Circle()
                    .stroke(theme.colors.surfaceStrong, lineWidth: 10)

                Circle()
                    .trim(from: 0, to: progress.fraction)
                    .stroke(accentColor, style: StrokeStyle(lineWidth: 10, lineCap: .round))
                    .rotationEffect(.degrees(-90))

                VStack(spacing: LumenSpacing.xs) {
                    if let systemName {
                        LumenIcon(systemName: systemName, size: .md, color: accentColor)
                    }
                    Text(valueLabel)
                        .font(.headline.monospacedDigit())
                        .foregroundStyle(theme.colors.ink)
                }
            }
            .frame(width: 108, height: 108)

            Text(label)
                .font(.caption.weight(.semibold))
                .foregroundStyle(theme.colors.inkSoft)
        }
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(Text(label))
        .accessibilityValue(Text(valueLabel))
    }

    private var accentColor: Color {
        metricColor(tone, theme: theme)
    }
}

public struct LumenSectionHeader<Actions: View>: View {
    @Environment(\.lumenTheme) private var theme

    private let actions: Actions
    private let count: String?
    private let subtitle: LocalizedStringKey?
    private let title: LocalizedStringKey

    public init(
        _ title: LocalizedStringKey,
        subtitle: LocalizedStringKey? = nil,
        count: String? = nil,
        @ViewBuilder actions: () -> Actions
    ) {
        self.title = title
        self.subtitle = subtitle
        self.count = count
        self.actions = actions()
    }

    public var body: some View {
        HStack(alignment: .top, spacing: LumenSpacing.md) {
            VStack(alignment: .leading, spacing: LumenSpacing.xs) {
                HStack(alignment: .firstTextBaseline, spacing: LumenSpacing.sm) {
                    Text(title)
                        .font(.headline)
                        .foregroundStyle(theme.colors.ink)

                    if let count {
                        LumenBadge(LocalizedStringKey(count), tone: .neutral)
                            .monospacedDigit()
                    }
                }

                if let subtitle {
                    Text(subtitle)
                        .font(.caption)
                        .foregroundStyle(theme.colors.inkMuted)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)

            actions
        }
        .accessibilityElement(children: .contain)
    }
}

public extension LumenSectionHeader where Actions == EmptyView {
    init(
        _ title: LocalizedStringKey,
        subtitle: LocalizedStringKey? = nil,
        count: String? = nil
    ) {
        self.init(title, subtitle: subtitle, count: count) {
            EmptyView()
        }
    }
}

public struct LumenStatusBar<Trailing: View>: View {
    @Environment(\.lumenTheme) private var theme

    private let message: LocalizedStringKey
    private let systemName: String?
    private let tone: LumenMetricTone
    private let trailing: Trailing

    public init(
        _ message: LocalizedStringKey,
        tone: LumenMetricTone = .neutral,
        @ViewBuilder trailing: () -> Trailing
    ) {
        self.init(message, tone: tone, systemName: nil, trailing: trailing)
    }

    public init(
        _ message: LocalizedStringKey,
        tone: LumenMetricTone = .neutral,
        systemName: String?,
        @ViewBuilder trailing: () -> Trailing
    ) {
        self.message = message
        self.tone = tone
        self.systemName = systemName
        self.trailing = trailing()
    }

    public var body: some View {
        HStack(alignment: .top, spacing: LumenSpacing.sm) {
            LumenIcon(
                systemName: systemName ?? defaultSystemName,
                size: .sm,
                color: metricColor(tone, theme: theme)
            )

            Text(message)
                .fixedSize(horizontal: false, vertical: true)
                .frame(maxWidth: .infinity, alignment: .leading)
                .layoutPriority(1)

            trailing
                .fixedSize(horizontal: true, vertical: false)
        }
        .font(.caption)
        .foregroundStyle(theme.colors.inkSoft)
        .padding(.horizontal, LumenSpacing.lg)
        .frame(minHeight: 36)
        .background(theme.colors.surfaceMuted)
        .accessibilityElement(children: .contain)
    }

    private var defaultSystemName: String {
        switch tone {
        case .accent, .brand: "info.circle.fill"
        case .danger: "xmark.octagon.fill"
        case .neutral: "circle.fill"
        case .success: "checkmark.circle.fill"
        case .warning: "exclamationmark.triangle.fill"
        }
    }
}

public extension LumenStatusBar where Trailing == EmptyView {
    init(_ message: LocalizedStringKey, tone: LumenMetricTone = .neutral) {
        self.init(message, tone: tone) {
            EmptyView()
        }
    }

    init(
        _ message: LocalizedStringKey,
        tone: LumenMetricTone = .neutral,
        systemName: String?
    ) {
        self.init(message, tone: tone, systemName: systemName) {
            EmptyView()
        }
    }
}

private func metricColor(_ tone: LumenMetricTone, theme: LumenTheme) -> Color {
    switch tone {
    case .accent: theme.colors.accent
    case .brand: theme.colors.brand
    case .danger: theme.colors.danger
    case .neutral: theme.colors.inkMuted
    case .success: theme.colors.success
    case .warning: theme.colors.warning
    }
}
