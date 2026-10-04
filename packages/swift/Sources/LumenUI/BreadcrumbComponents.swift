#if os(iOS) || os(macOS) || os(visionOS)
import SwiftUI

public struct LumenBreadcrumbItem: Identifiable, Equatable, Sendable {
    public let id: String
    public let label: String
    public let isDisabled: Bool

    public init(id: String, label: String, isDisabled: Bool = false) {
        self.id = id
        self.label = label
        self.isDisabled = isDisabled
    }
}

func lumenBreadcrumbHasValidIDs(_ items: [LumenBreadcrumbItem]) -> Bool {
    var ids = Set<String>()
    return items.allSatisfy { item in
        !item.id.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty && ids.insert(item.id).inserted
    }
}

public struct LumenBreadcrumb: View {
    @Environment(\.isEnabled) private var isEnabled
    @Environment(\.lumenTheme) private var theme
    private let label: String
    private let items: [LumenBreadcrumbItem]
    private let currentLabel: String
    private let onNavigate: (String) -> Void

    public init(_ label: String, items: [LumenBreadcrumbItem], currentLabel: String = "Current",
                onNavigate: @escaping (String) -> Void) {
        self.label = label
        self.items = items
        self.currentLabel = currentLabel
        self.onNavigate = onNavigate
    }

    public var body: some View {
        ScrollView(.horizontal) {
            HStack(spacing: LumenSpacing.xs) {
                ForEach(Array((lumenBreadcrumbHasValidIDs(items) ? items : []).enumerated()), id: \.element.id) { index, item in
                    if index > 0 { Text("/").foregroundStyle(theme.colors.inkMuted).accessibilityHidden(true) }
                    if index == items.count - 1 {
                        Text(item.label).foregroundStyle(theme.colors.ink)
                            .accessibilityValue(Text(currentLabel)).accessibilityAddTraits(.isSelected)
                    } else {
                        Button {
                            if isEnabled && !item.isDisabled { onNavigate(item.id) }
                        } label: {
                            Text(item.label).foregroundStyle(theme.colors.brandSolid)
                                .frame(minWidth: 44, minHeight: 44)
                                .padding(.horizontal, LumenSpacing.sm)
                                .contentShape(Rectangle())
                        }
                        .buttonStyle(.plain).disabled(item.isDisabled)
                    }
                }
            }
        }
        .accessibilityElement(children: .contain)
        .accessibilityLabel(Text(label))
    }
}
#endif
