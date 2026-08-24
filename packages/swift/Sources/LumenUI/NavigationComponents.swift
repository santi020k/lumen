import SwiftUI

/// Cross-version policy for the native SwiftUI tab bar on iPhone.
public enum LumenTabBarMinimizeBehavior: Sendable {
    /// Let SwiftUI choose the platform-appropriate behavior.
    case automatic
    /// Keep the tab bar at its regular size.
    case never
    /// Minimize while scrolling toward later content and expand in the opposite direction.
    case onScrollDown
    /// Minimize while scrolling toward earlier content and expand in the opposite direction.
    case onScrollUp
}

/// Content that adapts to the expanded or inline placement of an iOS tab-view bottom accessory.
public struct LumenTabAccessory<Expanded: View, Compact: View>: View {
    private let compact: Compact
    private let expanded: Expanded

    public init(
        @ViewBuilder expanded: () -> Expanded,
        @ViewBuilder compact: () -> Compact
    ) {
        self.expanded = expanded()
        self.compact = compact()
    }

    public var body: some View {
        #if os(iOS)
        if #available(iOS 26.0, *) {
            LumenAdaptiveTabAccessory(expanded: expanded, compact: compact)
        } else {
            expanded
        }
        #else
        expanded
        #endif
    }
}

public extension View {
    /// Applies SwiftUI's native tab-bar minimization on iOS 26 and later.
    ///
    /// Earlier iOS versions and other Apple platforms retain their system-default tab behavior.
    @ViewBuilder
    func lumenTabBarMinimizeBehavior(
        _ behavior: LumenTabBarMinimizeBehavior
    ) -> some View {
        #if os(iOS)
        if #available(iOS 26.0, *) {
            tabBarMinimizeBehavior(behavior.swiftUIValue)
        } else {
            self
        }
        #else
        self
        #endif
    }

    /// Adds an adaptive bottom accessory to a native `TabView`.
    ///
    /// iOS 26 uses the native tab accessory placement. Earlier versions present the same content
    /// in a token-aware safe-area inset above the system tab bar.
    @ViewBuilder
    func lumenTabViewBottomAccessory<Accessory: View>(
        isEnabled: Bool = true,
        @ViewBuilder content: () -> Accessory
    ) -> some View {
        #if os(iOS)
        if #available(iOS 26.0, *) {
            if isEnabled {
                tabViewBottomAccessory {
                    content()
                }
            } else {
                self
            }
        } else {
            safeAreaInset(edge: .bottom, spacing: 0) {
                if isEnabled {
                    LumenLegacyTabAccessorySurface {
                        content()
                    }
                }
            }
        }
        #else
        self
        #endif
    }
}

#if os(iOS)
@available(iOS 26.0, *)
private extension LumenTabBarMinimizeBehavior {
    var swiftUIValue: TabBarMinimizeBehavior {
        switch self {
        case .automatic: .automatic
        case .never: .never
        case .onScrollDown: .onScrollDown
        case .onScrollUp: .onScrollUp
        }
    }
}

@available(iOS 26.0, *)
private struct LumenAdaptiveTabAccessory<Expanded: View, Compact: View>: View {
    @Environment(\.tabViewBottomAccessoryPlacement) private var placement

    let expanded: Expanded
    let compact: Compact

    var body: some View {
        if placement == .inline {
            compact
        } else {
            expanded
        }
    }
}

private struct LumenLegacyTabAccessorySurface<Content: View>: View {
    @Environment(\.lumenTheme) private var theme

    let content: Content

    init(@ViewBuilder content: () -> Content) {
        self.content = content()
    }

    var body: some View {
        content
            .frame(maxWidth: .infinity)
            .padding(.horizontal, LumenSpacing.lg)
            .padding(.vertical, LumenSpacing.sm)
            .background(theme.colors.surface)
            .overlay(alignment: .top) {
                Rectangle()
                    .fill(theme.colors.line)
                    .frame(height: 1)
                    .accessibilityHidden(true)
            }
    }
}
#endif

public struct LumenNavigationItem<Value: Hashable>: Identifiable {
    public let badge: LumenNavigationBadge?
    public let disabled: Bool
    public let label: LocalizedStringKey
    public let selectedSystemName: String?
    public let systemName: String?
    public let value: Value

    public var id: Value { value }

    public init(
        _ label: LocalizedStringKey,
        value: Value,
        systemName: String? = nil,
        selectedSystemName: String? = nil,
        badge: LumenNavigationBadge? = nil,
        disabled: Bool = false
    ) {
        self.label = label
        self.value = value
        self.systemName = systemName
        self.selectedSystemName = selectedSystemName
        self.badge = badge
        self.disabled = disabled
    }
}

/// Compact destination status presented as a dot or short text value.
public enum LumenNavigationBadge: Equatable, Sendable {
    case dot(accessibilityLabel: String = "New activity")
    case text(String, accessibilityLabel: String? = nil)

    /// Produces a compact count capped at `99+` while retaining the full count for accessibility.
    public static func count(_ value: Int) -> LumenNavigationBadge {
        let safeValue = max(0, value)
        return .text(
            safeValue > 99 ? "99+" : String(safeValue),
            accessibilityLabel: "\(safeValue) new items"
        )
    }

    internal var displayText: String? {
        switch self {
        case .dot: nil
        case let .text(value, _): value
        }
    }

    internal var spokenLabel: String {
        switch self {
        case let .dot(accessibilityLabel): accessibilityLabel
        case let .text(value, accessibilityLabel): accessibilityLabel ?? value
        }
    }
}

internal func dispatchLumenNavigationSelection<Value: Equatable>(
    itemValue: Value,
    selectedValue: Value,
    onValueChange: (Value) -> Void,
    onReselect: ((Value) -> Void)?
) {
    if itemValue == selectedValue, let onReselect {
        onReselect(itemValue)
    } else {
        onValueChange(itemValue)
    }
}

/// A controlled destination bar that leaves navigation paths and presented content app-owned.
public struct LumenNavigationBar<Selection: Hashable>: View {
    @Binding private var selection: Selection
    @Environment(\.lumenTheme) private var theme

    private let items: [LumenNavigationItem<Selection>]
    private let label: LocalizedStringKey
    private let onReselect: ((Selection) -> Void)?

    public init(
        _ label: LocalizedStringKey = "Primary navigation",
        selection: Binding<Selection>,
        items: [LumenNavigationItem<Selection>],
        onReselect: ((Selection) -> Void)? = nil
    ) {
        self.label = label
        _selection = selection
        self.items = items
        self.onReselect = onReselect
    }

    public var body: some View {
        HStack(spacing: LumenSpacing.xs) {
            ForEach(items) { item in
                let selected = selection == item.value

                Button {
                    dispatchLumenNavigationSelection(
                        itemValue: item.value,
                        selectedValue: selection,
                        onValueChange: { selection = $0 },
                        onReselect: onReselect
                    )
                } label: {
                    VStack(spacing: LumenSpacing.xs) {
                        if let systemName = selected ? item.selectedSystemName ?? item.systemName : item.systemName {
                            ZStack(alignment: .topTrailing) {
                                LumenIcon(
                                    systemName: systemName,
                                    size: .md,
                                    color: selected ? theme.colors.brand : theme.colors.inkMuted
                                )

                                if let badge = item.badge {
                                    LumenNavigationBadgeView(badge: badge)
                                        .offset(x: 8, y: -6)
                                }
                            }
                        }

                        Text(item.label)
                            .font(.caption.weight(selected ? .semibold : .medium))
                            .foregroundStyle(selected ? theme.colors.brand : theme.colors.inkMuted)
                            .lineLimit(1)
                    }
                    .frame(maxWidth: .infinity, minHeight: 48)
                    .contentShape(Rectangle())
                }
                .buttonStyle(.plain)
                .disabled(item.disabled)
                .opacity(item.disabled ? 0.52 : 1)
                .accessibilityAddTraits(selected ? .isSelected : [])
                .accessibilityValue(item.badge.map { Text($0.spokenLabel) } ?? Text(""))
            }
        }
        .padding(.horizontal, LumenSpacing.sm)
        .padding(.vertical, LumenSpacing.sm)
        .background(theme.colors.surface)
        .overlay(alignment: .top) {
            Rectangle()
                .fill(theme.colors.line)
                .frame(height: 1)
                .accessibilityHidden(true)
        }
        .accessibilityElement(children: .contain)
        .accessibilityLabel(label)
    }
}

private struct LumenNavigationBadgeView: View {
    @Environment(\.lumenTheme) private var theme

    let badge: LumenNavigationBadge

    var body: some View {
        Group {
            if let displayText = badge.displayText {
                Text(displayText)
                    .font(.caption2.weight(.bold))
                    .foregroundStyle(theme.colors.onDanger)
                    .padding(.horizontal, 5)
                    .frame(minWidth: 16, minHeight: 16)
                    .lineLimit(1)
            } else {
                Circle()
                    .fill(theme.colors.danger)
                    .frame(width: 8, height: 8)
            }
        }
        .background {
            if badge.displayText != nil {
                Capsule().fill(theme.colors.danger)
            }
        }
        .accessibilityHidden(true)
    }
}
