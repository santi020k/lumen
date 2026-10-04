#if os(iOS) || os(macOS) || os(visionOS)
import SwiftUI

public struct LumenTreeSelect: View {
    @Binding private var value: String?
    @State private var open = false
    @Environment(\.isEnabled) private var enabled
    private let label: String
    private let model: LumenTreeSelectModel
    private let readOnly: Bool
    private let loading: Bool
    private let error: String?
    private let placeholder: String
    private let unknownSelectionLabel: String
    private let loadingLabel: String
    private let emptyLabel: String
    private let invalidLabel: String
    private let expandedLabel: String
    private let collapsedLabel: String
    private let formatOption: (String, [String], Int) -> String

    public init(_ label: String, nodes: [LumenTreeNode], value: Binding<String?>,
                readOnly: Bool = false, loading: Bool = false, error: String? = nil,
                placeholder: String = "Select…", unknownSelectionLabel: String = "Unavailable selection",
                loadingLabel: String = "Loading", emptyLabel: String = "No options",
                invalidLabel: String = "Invalid options", expandedLabel: String = "Expanded", collapsedLabel: String = "Collapsed",
                formatOption: @escaping (String, [String], Int) -> String = { _, path, level in "\(path.joined(separator: " / ")), level \(level)" }) {
        self.label = label; model = LumenTreeSelectModel(nodes: nodes); _value = value
        self.readOnly = readOnly; self.loading = loading; self.error = error
        self.placeholder = placeholder; self.unknownSelectionLabel = unknownSelectionLabel
        self.loadingLabel = loadingLabel; self.emptyLabel = emptyLabel; self.invalidLabel = invalidLabel
        self.expandedLabel = expandedLabel; self.collapsedLabel = collapsedLabel; self.formatOption = formatOption
    }
    private var selection: String { model.selectionLabel(value, placeholder: placeholder, unknownLabel: unknownSelectionLabel) }
    public var body: some View {
        VStack(alignment: .leading, spacing: LumenSpacing.sm) {
            LumenText(.verbatim(label))
            if loading || error != nil || !model.valid { LumenText(.verbatim(selection)) }
            if loading { LumenText(.verbatim(loadingLabel)) }
            else if let error { LumenText(.verbatim(error)) }
            else if !model.valid { LumenText(.verbatim(invalidLabel)) }
            else {
                LumenButton(action: { if enabled { open.toggle() } }) { Text(selection) }
                    .accessibilityLabel(Text("\(label): \(selection)"))
                    .accessibilityValue(Text(open ? expandedLabel : collapsedLabel))
                if open {
                    ScrollView {
                        LazyVStack(alignment: .leading, spacing: LumenSpacing.xs) {
                            if model.rows.isEmpty { LumenText(.verbatim(emptyLabel)) }
                            ForEach(model.rows) { row in
                                let blocked = readOnly || !model.canSelect(row.id)
                                LumenButton(disabled: blocked, action: {
                                    guard enabled && !blocked else { return }
                                    let next = model.selecting(row.id, current: value)
                                    if next != value { value = next }
                                    open = false
                                }) { Text(row.node.label) }
                                .accessibilityLabel(Text(formatOption(row.node.label, model.tree.path(row.id).map(\.label), row.depth + 1)))
                                .accessibilityAddTraits(value == row.id ? .isSelected : [])
                                .padding(.leading, CGFloat(min(row.depth, 8)) * LumenSpacing.sm)
                            }
                        }
                    }.frame(maxHeight: 320)
                }
            }
        }.accessibilityElement(children: .contain).accessibilityLabel(Text(label))
    }
}
#endif
