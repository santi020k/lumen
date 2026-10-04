#if os(iOS) || os(macOS) || os(visionOS)
import SwiftUI

public struct LumenTree: View {
    @Binding private var expandedIds: Set<String>
    @Environment(\.isEnabled) private var enabled
    private let label: String
    private let model: LumenTreeModel
    private let selection: Binding<Set<String>>?
    private let readOnly: Bool
    private let loading: Bool
    private let error: String?
    private let loadingLabel: String
    private let emptyLabel: String
    private let invalidLabel: String
    private let formatDisclosure: (String, Bool) -> String
    private let formatLevel: (Int) -> String

    public init(_ label: String, nodes: [LumenTreeNode], expandedIds: Binding<Set<String>>,
                selectedIds: Binding<Set<String>>? = nil, readOnly: Bool = false,
                loading: Bool = false, error: String? = nil, loadingLabel: String = "Loading",
                emptyLabel: String = "No items", invalidLabel: String = "Invalid tree data",
                formatDisclosure: @escaping (String, Bool) -> String = { "\($1 ? "Collapse" : "Expand") \($0)" },
                formatLevel: @escaping (Int) -> String = { "Level \($0 + 1)" }) {
        self.label = label; model = LumenTreeModel(nodes: nodes); _expandedIds = expandedIds
        selection = selectedIds; self.readOnly = readOnly; self.loading = loading; self.error = error
        self.loadingLabel = loadingLabel; self.emptyLabel = emptyLabel; self.invalidLabel = invalidLabel
        self.formatDisclosure = formatDisclosure; self.formatLevel = formatLevel
    }
    public var body: some View {
        VStack(alignment: .leading, spacing: LumenSpacing.md) {
            LumenText(.verbatim(label))
            if loading { ProgressView().accessibilityLabel(Text(loadingLabel)); LumenText(.verbatim(loadingLabel)) }
            else if let error { LumenText(.verbatim(error)) }
            else if !model.valid { LumenText(.verbatim(invalidLabel)) }
            else if model.childrenOf(nil).isEmpty { LumenText(.verbatim(emptyLabel)) }
            else {
                ForEach(model.visibleRows(expandedIds: expandedIds)) { row in
                    VStack(alignment: .leading, spacing: LumenSpacing.xs) {
                        if row.hasChildren {
                            LumenButton(disabled: row.disabled, action: {
                                if enabled { expandedIds = model.togglingExpansion(row.id, expandedIds: expandedIds) }
                            }) { Text(formatDisclosure(row.node.label, expandedIds.contains(row.id))) }
                        }
                        if let selection, row.node.selectable {
                            LumenCheckbox(row.node.label, isChecked: Binding(get: {
                                selection.wrappedValue.contains(row.id)
                            }, set: { _ in
                                if enabled && !readOnly { selection.wrappedValue = model.togglingSelection(row.id, selectedIds: selection.wrappedValue) }
                            })).disabled(readOnly || row.disabled)
                        } else { LumenText(.verbatim(row.node.label)) }
                        LumenText(.verbatim(formatLevel(row.depth)))
                    }.padding(.leading, CGFloat(min(row.depth, 8)) * LumenSpacing.md)
                }
            }
        }.accessibilityElement(children: .contain).accessibilityLabel(Text(label))
    }
}
#endif
