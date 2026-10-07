#if os(iOS) || os(macOS) || os(visionOS)
import SwiftUI

public struct LumenTransfer: View {
    @Binding private var value: LumenTransferValue
    @Environment(\.isEnabled) private var enabled
    @Environment(\.lumenTheme) private var theme
    private let label: String
    private let items: [LumenTransferItem]
    private let readOnly: Bool
    private let loading: Bool
    private let error: String?
    private let sourceTitle: String
    private let targetTitle: String
    private let moveToTargetLabel: String
    private let moveToSourceLabel: String
    private let emptyLabel: String
    private let loadingLabel: String
    private let invalidLabel: String
    private let checkedLabel: String
    private let uncheckedLabel: String
    private let formatCount: (Int) -> String
    public init(_ label: String, items: [LumenTransferItem], value: Binding<LumenTransferValue>, readOnly: Bool = false,
        loading: Bool = false, error: String? = nil, sourceTitle: String = "Available", targetTitle: String = "Selected",
        moveToTargetLabel: String = "Move to selected", moveToSourceLabel: String = "Move to available", emptyLabel: String = "No items",
        loadingLabel: String = "Loading", invalidLabel: String = "Invalid transfer", checkedLabel: String = "Checked", uncheckedLabel: String = "Not checked",
        formatCount: @escaping (Int) -> String = { String($0) }) {
        self.label = label; self.items = items; _value = value; self.readOnly = readOnly; self.loading = loading; self.error = error
        self.sourceTitle = sourceTitle; self.targetTitle = targetTitle; self.moveToTargetLabel = moveToTargetLabel; self.moveToSourceLabel = moveToSourceLabel
        self.emptyLabel = emptyLabel; self.loadingLabel = loadingLabel; self.invalidLabel = invalidLabel
        self.checkedLabel = checkedLabel; self.uncheckedLabel = uncheckedLabel; self.formatCount = formatCount
    }
    private var status: String? {
        if let error { return error }
        if loading { return loadingLabel }
        if lumenTransferLists(items: items, value: value) == nil { return invalidLabel }
        return nil
    }
    private var locked: Bool { !enabled || readOnly || status != nil }
    public var body: some View {
        VStack(alignment: .leading, spacing: LumenSpacing.sm) {
            LumenText(.verbatim(label)).accessibilityAddTraits(.isHeader)
            if let status { LumenText(.verbatim(status)) }
            else if let lists = lumenTransferLists(items: items, value: value) {
                panel(sourceTitle, items: lists.source)
                panel(targetTitle, items: lists.target)
                VStack(alignment: .leading, spacing: LumenSpacing.sm) {
                    moveButton(.target, label: moveToTargetLabel)
                    moveButton(.source, label: moveToSourceLabel)
                }
            }
        }.accessibilityElement(children: .contain).accessibilityLabel(label)
    }
    private func panel(_ title: String, items panelItems: [LumenTransferItem]) -> some View {
        VStack(alignment: .leading, spacing: LumenSpacing.xs) {
            LumenText(.verbatim(title)).accessibilityAddTraits(.isHeader)
            LumenText(.verbatim(formatCount(panelItems.count)))
            if panelItems.isEmpty { LumenText(.verbatim(emptyLabel)) }
            else {
                ScrollView {
                    VStack(alignment: .leading) {
                        ForEach(panelItems) { item in
                            let checked = value.checkedIds.contains(item.id)
                            let name = item.label.isEmpty ? item.id : item.label
                            LumenCheckbox(name, isChecked: Binding(get: { value.checkedIds.contains(item.id) }, set: { next in
                                if !locked, let update = toggleLumenTransferItem(items: items, value: value, id: item.id, checked: next) { value = update }
                            }), description: item.detail)
                                .frame(minHeight: 44).disabled(locked || item.disabled)
                                .accessibilityLabel([name, item.detail ?? ""].filter { !$0.isEmpty }.joined(separator: ", "))
                                .accessibilityValue(checked ? checkedLabel : uncheckedLabel)
                        }
                    }
                }.frame(maxHeight: 240)
            }
        }.padding(LumenSpacing.sm).frame(maxWidth: .infinity, alignment: .leading)
            .overlay { RoundedRectangle(cornerRadius: LumenRadius.sm).stroke(theme.colors.line) }
            .accessibilityElement(children: .contain).accessibilityLabel(title)
    }
    private func moveButton(_ side: LumenTransferSide, label: String) -> some View {
        LumenButton(intent: .secondary, disabled: locked || moveLumenTransferItems(items: items, value: value, to: side) == nil, action: {
            if !locked, let next = moveLumenTransferItems(items: items, value: value, to: side) { value = next }
        }) { LumenText(.verbatim(label)) }.frame(minWidth: 44, minHeight: 44)
    }
}
#endif
