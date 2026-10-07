#if os(iOS) || os(macOS) || os(visionOS)
import SwiftUI

public struct LumenCascader: View {
    @Binding private var selectedPath: [String]
    @State private var browsingId: String?
    @Environment(\.isEnabled) private var enabled
    private let label: String
    private let model: LumenCascaderModel
    private let readOnly: Bool
    private let loading: Bool
    private let error: String?
    private let loadingLabel: String
    private let emptyLabel: String
    private let invalidLabel: String
    private let unknownSelectionLabel: String
    private let placeholder: String
    private let backLabel: String
    private let formatDisclosure: (String) -> String
    public init(_ label: String, nodes: [LumenTreeNode], selectedPath: Binding<[String]>,
                readOnly: Bool = false, loading: Bool = false, error: String? = nil,
                loadingLabel: String = "Loading", emptyLabel: String = "No options", invalidLabel: String = "Invalid options",
                unknownSelectionLabel: String = "Unavailable selection", placeholder: String = "Select…", backLabel: String = "Back",
                formatDisclosure: @escaping (String) -> String = { "Open \($0)" }) {
        self.label = label; model = LumenCascaderModel(nodes: nodes); _selectedPath = selectedPath
        self.readOnly = readOnly; self.loading = loading; self.error = error; self.loadingLabel = loadingLabel
        self.emptyLabel = emptyLabel; self.invalidLabel = invalidLabel; self.unknownSelectionLabel = unknownSelectionLabel
        self.placeholder = placeholder; self.backLabel = backLabel; self.formatDisclosure = formatDisclosure
    }
    private var parent: LumenTreeNode? {
        guard model.tree.valid, let browsingId, !model.tree.isDisabled(browsingId) else { return nil }
        return model.tree.node(browsingId)
    }
    private var selectionLabel: String {
        if selectedPath.isEmpty { return placeholder }
        guard model.isPathValid(selectedPath) else { return unknownSelectionLabel }
        return selectedPath.map { model.tree.node($0)?.label ?? $0 }.joined(separator: " / ")
    }
    public var body: some View {
        VStack(alignment: .leading, spacing: LumenSpacing.sm) {
            LumenText(.verbatim(label))
            LumenText(.verbatim(selectionLabel))
            if loading { ProgressView().accessibilityLabel(Text(loadingLabel)); LumenText(.verbatim(loadingLabel)) }
            else if let error { LumenText(.verbatim(error)) }
            else if !model.tree.valid { LumenText(.verbatim(invalidLabel)) }
            else {
                if let parent {
                    LumenButton(action: { if enabled { browsingId = parent.parentId } }) { Text(backLabel) }
                    LumenText(.verbatim(model.tree.path(parent.id).map(\.label).joined(separator: " / ")))
                }
                let options = model.tree.childrenOf(parent?.id)
                if options.isEmpty { LumenText(.verbatim(emptyLabel)) }
                ForEach(options) { node in
                    let branch = !model.tree.childrenOf(node.id).isEmpty
                    let blocked = model.tree.isDisabled(node.id) || (!branch && (readOnly || !model.canSelect(node.id)))
                    LumenButton(disabled: blocked, action: {
                        guard enabled && !blocked else { return }
                        if branch { browsingId = node.id }
                        else { selectedPath = model.selecting(node.id, current: selectedPath) }
                    }) { Text(branch ? "\(node.label) ›" : node.label) }
                    .accessibilityLabel(Text(branch ? formatDisclosure(node.label) : node.label))
                    .accessibilityAddTraits(!branch && selectedPath.last == node.id ? .isSelected : [])
                }
            }
        }.accessibilityElement(children: .contain).accessibilityLabel(Text(label))
    }
}
#endif
