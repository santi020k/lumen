import Foundation

public struct LumenTreeSelectModel: Sendable {
    public let tree: LumenTreeModel
    public let rows: [LumenTreeRow]
    public let valid: Bool
    public init(nodes: [LumenTreeNode]) {
        tree = LumenTreeModel(nodes: nodes)
        valid = tree.valid && nodes.allSatisfy { !$0.id.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty }
        rows = valid ? tree.visibleRows(expandedIds: Set(nodes.map(\.id))) : []
    }
    public func canSelect(_ id: String) -> Bool {
        guard valid, let node = tree.node(id) else { return false }
        return node.selectable && !tree.isDisabled(id)
    }
    public func selecting(_ id: String, current: String?) -> String? { canSelect(id) ? id : current }
    public func selectionLabel(_ value: String?, placeholder: String, unknownLabel: String) -> String {
        guard let value else { return placeholder }
        guard valid else { return unknownLabel }
        return tree.node(value)?.label ?? unknownLabel
    }
}
