import Foundation

public struct LumenCascaderModel: Sendable {
    public let tree: LumenTreeModel
    public init(nodes: [LumenTreeNode]) { tree = LumenTreeModel(nodes: nodes) }
    public func canSelect(_ id: String) -> Bool {
        guard tree.valid, let node = tree.node(id) else { return false }
        return node.selectable && !tree.isDisabled(id) && tree.childrenOf(id).isEmpty
    }
    public func isPathValid(_ path: [String]) -> Bool {
        guard let last = path.last else { return tree.valid }
        return tree.valid && tree.path(last).map(\.id) == path
    }
    public func selecting(_ id: String, current: [String]) -> [String] {
        canSelect(id) ? tree.path(id).map(\.id) : current
    }
}
