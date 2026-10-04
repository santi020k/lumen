#if os(iOS) || os(macOS) || os(visionOS)
import Foundation

public struct LumenTreeGridColumn: Identifiable, Equatable, Sendable {
    public var id: String { key }
    public let key: String
    public let label: String
    public init(key: String, label: String) { self.key = key; self.label = label }
}
public struct LumenTreeGridRecord: Identifiable, Equatable, Sendable {
    public var id: String { node.id }
    public let node: LumenTreeNode
    public let cells: [String: LumenTableCell]
    public init(node: LumenTreeNode, cells: [String: LumenTableCell]) { self.node = node; self.cells = cells }
}
public struct LumenTreeGridRow: Identifiable, Equatable, Sendable {
    public var id: String { tree.node.id }
    public let tree: LumenTreeRow
    public let record: LumenTreeGridRecord
}
public struct LumenTreeGridModel: Sendable {
    public let valid: Bool
    private let tree: LumenTreeModel
    private let records: [String: LumenTreeGridRecord]
    public init(columns: [LumenTreeGridColumn], records: [LumenTreeGridRecord]) {
        tree = LumenTreeModel(nodes: records.map(\.node))
        var byId: [String: LumenTreeGridRecord] = [:]
        for record in records { byId[record.id] = record }
        self.records = byId
        valid = tree.valid && !columns.isEmpty && columns.allSatisfy {
            !$0.key.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty &&
                !$0.label.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
        } && records.allSatisfy {
            !$0.id.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty &&
                !$0.node.label.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
        } && LumenTableModel.isValid(columns: columns.map { LumenTableColumn(key: $0.key, label: $0.label) },
                                    rows: records.map { LumenTableRow(id: $0.id, label: $0.node.label, cells: $0.cells) })
    }
    public func visibleRows(expandedIds: Set<String>) -> [LumenTreeGridRow] {
        guard valid else { return [] }
        return tree.visibleRows(expandedIds: expandedIds).compactMap { row in
            records[row.node.id].map { LumenTreeGridRow(tree: row, record: $0) }
        }
    }
    public func togglingExpansion(_ id: String, expandedIds: Set<String>) -> Set<String> {
        valid ? tree.togglingExpansion(id, expandedIds: expandedIds) : expandedIds
    }
}
#endif
