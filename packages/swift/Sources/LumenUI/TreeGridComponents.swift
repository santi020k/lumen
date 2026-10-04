#if os(iOS) || os(macOS) || os(visionOS)
import SwiftUI

public struct LumenTreeGrid: View {
    @Binding private var expandedIds: Set<String>
    @Environment(\.isEnabled) private var enabled
    private let label: String
    private let columns: [LumenTreeGridColumn]
    private let model: LumenTreeGridModel
    private let readOnly: Bool
    private let loading: Bool
    private let error: String?
    private let loadingLabel: String
    private let emptyLabel: String
    private let invalidLabel: String
    private let missingCellLabel: String
    private let formatDisclosure: (String, Bool) -> String
    private let formatLevel: (Int) -> String
    private let cellContent: ((LumenTreeGridRecord, LumenTreeGridColumn, LumenTableCell?) -> AnyView)?

    public init(_ label: String, columns: [LumenTreeGridColumn], records: [LumenTreeGridRecord],
                expandedIds: Binding<Set<String>>, readOnly: Bool = false, loading: Bool = false,
                error: String? = nil, loadingLabel: String = "Loading", emptyLabel: String = "No records",
                invalidLabel: String = "Invalid tree grid data", missingCellLabel: String = "—",
                formatDisclosure: @escaping (String, Bool) -> String = { "\($1 ? "Collapse" : "Expand") \($0)" },
                formatLevel: @escaping (Int) -> String = { "Level \($0 + 1)" },
                cellContent: ((LumenTreeGridRecord, LumenTreeGridColumn, LumenTableCell?) -> AnyView)? = nil) {
        self.label = label; self.columns = columns; model = LumenTreeGridModel(columns: columns, records: records)
        _expandedIds = expandedIds; self.readOnly = readOnly; self.loading = loading; self.error = error
        self.loadingLabel = loadingLabel; self.emptyLabel = emptyLabel; self.invalidLabel = invalidLabel
        self.missingCellLabel = missingCellLabel; self.formatDisclosure = formatDisclosure
        self.formatLevel = formatLevel; self.cellContent = cellContent
    }
    public var body: some View {
        VStack(alignment: .leading, spacing: LumenSpacing.sm) {
            LumenText(.verbatim(label))
            if loading { ProgressView().accessibilityLabel(Text(loadingLabel)); LumenText(.verbatim(loadingLabel)) }
            else if let error { LumenText(.verbatim(error)) }
            else if !model.valid || label.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                LumenText(.verbatim(invalidLabel))
            } else if model.visibleRows(expandedIds: expandedIds).isEmpty { LumenText(.verbatim(emptyLabel)) }
            else {
                ScrollView {
                    LazyVStack(alignment: .leading, spacing: LumenSpacing.sm) {
                        ForEach(model.visibleRows(expandedIds: expandedIds)) { row in record(row) }
                    }
                }.frame(maxHeight: 480)
            }
        }.accessibilityElement(children: .contain).accessibilityLabel(Text(label))
    }
    private func record(_ row: LumenTreeGridRow) -> some View {
        VStack(alignment: .leading, spacing: LumenSpacing.sm) {
            LumenText(.verbatim(row.tree.node.label))
            LumenText(.verbatim(formatLevel(row.tree.depth)))
            if row.tree.hasChildren {
                let expanded = expandedIds.contains(row.id)
                LumenButton(disabled: row.tree.disabled, action: {
                    if enabled { expandedIds = model.togglingExpansion(row.id, expandedIds: expandedIds) }
                }) { Text(formatDisclosure(row.tree.node.label, expanded)) }
                    .accessibilityValue(Text(formatDisclosure(row.tree.node.label, expanded)))
            }
            ForEach(columns) { column in
                VStack(alignment: .leading, spacing: LumenSpacing.xs) {
                    LumenText(.verbatim(column.label))
                    if let cellContent { cellContent(row.record, column, row.record.cells[column.key]) }
                    else { LumenText(.verbatim(row.record.cells[column.key]?.text ?? missingCellLabel)) }
                }.disabled(!enabled || row.tree.disabled || readOnly)
            }
        }.padding(LumenSpacing.sm)
            .padding(.leading, CGFloat(min(row.tree.depth, 4)) * LumenSpacing.sm)
            .frame(maxWidth: .infinity, alignment: .leading)
            .accessibilityElement(children: .contain).accessibilityLabel(Text(row.tree.node.label))
    }
}
#endif
