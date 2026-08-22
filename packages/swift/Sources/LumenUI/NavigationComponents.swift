import SwiftUI

public struct LumenNavigationItem<Value: Hashable>: Identifiable {
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
        disabled: Bool = false
    ) {
        self.label = label
        self.value = value
        self.systemName = systemName
        self.selectedSystemName = selectedSystemName
        self.disabled = disabled
    }
}

/// A controlled destination bar that leaves navigation paths and presented content app-owned.
public struct LumenNavigationBar<Selection: Hashable>: View {
    @Binding private var selection: Selection
    @Environment(\.lumenTheme) private var theme

    private let items: [LumenNavigationItem<Selection>]
    private let label: LocalizedStringKey

    public init(
        _ label: LocalizedStringKey = "Primary navigation",
        selection: Binding<Selection>,
        items: [LumenNavigationItem<Selection>]
    ) {
        self.label = label
        _selection = selection
        self.items = items
    }

    public var body: some View {
        HStack(spacing: LumenSpacing.xs) {
            ForEach(items) { item in
                let selected = selection == item.value

                Button {
                    selection = item.value
                } label: {
                    VStack(spacing: LumenSpacing.xs) {
                        if let systemName = selected ? item.selectedSystemName ?? item.systemName : item.systemName {
                            LumenIcon(
                                systemName: systemName,
                                size: .md,
                                color: selected ? theme.colors.brand : theme.colors.inkMuted
                            )
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
