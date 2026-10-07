#if os(iOS) || os(macOS) || os(visionOS)
import SwiftUI

public struct LumenCommand: View {
    @Binding private var open: Bool
    @Binding private var query: String
    @Binding private var activeId: String?
    @Environment(\.isEnabled) private var enabled
    @Environment(\.lumenTheme) private var theme
    @FocusState private var searchFocused: Bool
    private let label: String
    private let groups: [LumenCommandGroup]
    private let onSelect: (LumenCommandItem) -> Void
    private let readOnly: Bool
    private let autoFocus: Bool
    private let loading: Bool
    private let error: String?
    private let searchLabel: String
    private let closeLabel: String
    private let previousLabel: String
    private let nextLabel: String
    private let selectLabel: String
    private let noActiveLabel: String
    private let emptyLabel: String
    private let loadingLabel: String
    private let invalidLabel: String
    private let formatCount: (Int) -> String
    private let formatActive: (LumenCommandItem) -> String
    public init(_ label: String, groups: [LumenCommandGroup], open: Binding<Bool>, query: Binding<String>, activeId: Binding<String?>,
        onSelect: @escaping (LumenCommandItem) -> Void, readOnly: Bool = false, autoFocus: Bool = true, loading: Bool = false, error: String? = nil,
        searchLabel: String = "Search commands", closeLabel: String = "Close commands", previousLabel: String = "Previous command",
        nextLabel: String = "Next command", selectLabel: String = "Run highlighted command", noActiveLabel: String = "No command highlighted",
        emptyLabel: String = "No matching commands", loadingLabel: String = "Loading", invalidLabel: String = "Invalid commands",
        formatCount: @escaping (Int) -> String = { String($0) }, formatActive: @escaping (LumenCommandItem) -> String = { $0.label.isEmpty ? $0.id : $0.label }) {
        self.label = label; self.groups = groups; _open = open; _query = query; _activeId = activeId; self.onSelect = onSelect
        self.readOnly = readOnly; self.autoFocus = autoFocus; self.loading = loading; self.error = error; self.searchLabel = searchLabel; self.closeLabel = closeLabel
        self.previousLabel = previousLabel; self.nextLabel = nextLabel; self.selectLabel = selectLabel; self.noActiveLabel = noActiveLabel
        self.emptyLabel = emptyLabel; self.loadingLabel = loadingLabel; self.invalidLabel = invalidLabel; self.formatCount = formatCount; self.formatActive = formatActive
    }
    private var status: String? {
        if let error { return error }
        if loading { return loadingLabel }
        if lumenCommandGroups(groups, query: query) == nil { return invalidLabel }
        return nil
    }
    private var locked: Bool { !enabled || readOnly || status != nil || !open }
    private func navigate(_ direction: LumenCommandNavigation) {
        if !locked, let next = moveLumenCommandActive(groups, query: query, activeId: activeId, direction: direction) { activeId = next }
    }
    private func select(_ id: String?) {
        if !locked, let item = resolveLumenCommandActive(groups, query: query, activeId: id) { activeId = item.id; onSelect(item) }
    }
    public var body: some View {
        if open {
            VStack(alignment: .leading, spacing: LumenSpacing.sm) {
                LumenText(.verbatim(label)).accessibilityAddTraits(.isHeader)
                LumenButton(intent: .quiet, action: { open = false }) { LumenText(.verbatim(closeLabel)) }.keyboardShortcut(.escape, modifiers: []).frame(minHeight: 44)
                if let status { LumenText(.verbatim(status)) }
                else if let filtered = lumenCommandGroups(groups, query: query) {
                    let active = resolveLumenCommandActive(groups, query: query, activeId: activeId)
                    LumenTextField(searchLabel, text: Binding(get: { query }, set: { if !locked { query = $0 } }))
                        .disabled(locked).focused($searchFocused).onSubmit { select(activeId) }
                        .task { if autoFocus && !locked { searchFocused = true } }
                    LumenText(.verbatim(formatCount(filtered.reduce(0) { $0 + $1.items.count })))
                    HStack {
                        LumenButton(intent: .secondary, disabled: locked || moveLumenCommandActive(groups, query: query, activeId: activeId, direction: .previous) == nil, action: { navigate(.previous) }) { LumenText(.verbatim(previousLabel)) }.keyboardShortcut(.upArrow, modifiers: [])
                        LumenButton(intent: .secondary, disabled: locked || moveLumenCommandActive(groups, query: query, activeId: activeId, direction: .next) == nil, action: { navigate(.next) }) { LumenText(.verbatim(nextLabel)) }.keyboardShortcut(.downArrow, modifiers: [])
                    }
                    LumenText(.verbatim(active.map(formatActive) ?? noActiveLabel))
                    if filtered.isEmpty { LumenText(.verbatim(emptyLabel)) }
                    ScrollViewReader { proxy in
                        ScrollView {
                            VStack(alignment: .leading, spacing: LumenSpacing.sm) {
                                ForEach(filtered) { group in
                                    LumenText(.verbatim(group.label.isEmpty ? group.id : group.label)).accessibilityAddTraits(.isHeader)
                                    ForEach(group.items) { item in
                                        LumenButton(intent: .quiet, disabled: locked || item.disabled, action: { select(item.id) }) {
                                            VStack(alignment: .leading) {
                                                LumenText(.verbatim(item.label.isEmpty ? item.id : item.label))
                                                if let detail = item.detail { LumenText(.verbatim(detail)) }
                                                if let shortcut = item.shortcut { LumenText(.verbatim(shortcut)) }
                                            }.frame(maxWidth: .infinity, alignment: .leading)
                                        }.frame(minHeight: 44).background(item.id == active?.id ? theme.colors.brandSoft : theme.colors.surface)
                                            .accessibilityLabel([item.label.isEmpty ? item.id : item.label, item.detail ?? "", item.shortcut ?? ""].filter { !$0.isEmpty }.joined(separator: ", "))
                                            .accessibilityAddTraits(item.id == active?.id ? .isSelected : []).id(item.id)
                                    }
                                }
                            }
                        }.frame(maxHeight: 240).task(id: activeId) { if let active { proxy.scrollTo(active.id, anchor: .center) } }
                    }
                    LumenButton(disabled: locked || active == nil, action: { select(activeId) }) { LumenText(.verbatim(selectLabel)) }.frame(minHeight: 44)
                }
            }.accessibilityElement(children: .contain).accessibilityLabel(label)
        }
    }
}
#endif
