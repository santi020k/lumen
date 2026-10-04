import Foundation

public struct LumenTreeNode: Identifiable, Equatable, Sendable {
    public let id: String
    public let label: String
    public let parentId: String?
    public let disabled: Bool
    public let selectable: Bool
    public init(id: String, label: String, parentId: String? = nil, disabled: Bool = false, selectable: Bool = true) {
        self.id = id; self.label = label; self.parentId = parentId
        self.disabled = disabled; self.selectable = selectable
    }
}

public struct LumenTreeRow: Identifiable, Equatable, Sendable {
    public var id: String { node.id }
    public let node: LumenTreeNode
    public let depth: Int
    public let hasChildren: Bool
    public let disabled: Bool
}

public struct LumenTreeModel: Sendable {
    public let valid: Bool
    private let byId: [String: LumenTreeNode]
    private let children: [String: [LumenTreeNode]]
    private let roots: [LumenTreeNode]
    private let disabledIds: Set<String>
    public init(nodes: [LumenTreeNode]) {
        var byId: [String: LumenTreeNode] = [:]
        var children: [String: [LumenTreeNode]] = [:]
        var roots: [LumenTreeNode] = []
        var valid = true
        for node in nodes {
            if node.id.isEmpty || byId[node.id] != nil { valid = false }
            byId[node.id] = node
            if let parent = node.parentId { children[parent, default: []].append(node) }
            else { roots.append(node) }
        }
        var stack = roots
        var visited = Set<String>()
        var disabled = Set<String>()
        while let node = stack.popLast() {
            if !visited.insert(node.id).inserted { valid = false; break }
            if node.disabled || node.parentId.map({ disabled.contains($0) }) == true { disabled.insert(node.id) }
            for child in children[node.id] ?? [] { stack.append(child) }
        }
        self.valid = valid && visited.count == nodes.count
        self.byId = byId; self.children = children; self.roots = roots; disabledIds = disabled
    }
    public func node(_ id: String) -> LumenTreeNode? { byId[id] }
    public func childrenOf(_ parentId: String?) -> [LumenTreeNode] { parentId.map { children[$0] ?? [] } ?? roots }
    public func isDisabled(_ id: String) -> Bool { disabledIds.contains(id) }
    public func path(_ id: String) -> [LumenTreeNode] {
        guard valid else { return [] }
        var result: [LumenTreeNode] = []; var current = node(id)
        while let item = current { result.append(item); current = item.parentId.flatMap { node($0) } }
        return result.reversed()
    }
    public func visibleRows(expandedIds: Set<String>) -> [LumenTreeRow] {
        guard valid else { return [] }
        var stack = roots.reversed().map { ($0, 0) }
        var result: [LumenTreeRow] = []
        while let (node, depth) = stack.popLast() {
            let children = childrenOf(node.id)
            result.append(LumenTreeRow(node: node, depth: depth, hasChildren: !children.isEmpty, disabled: isDisabled(node.id)))
            if expandedIds.contains(node.id) { for child in children.reversed() { stack.append((child, depth + 1)) } }
        }
        return result
    }
    public func togglingExpansion(_ id: String, expandedIds: Set<String>) -> Set<String> {
        guard valid, !isDisabled(id), !childrenOf(id).isEmpty else { return expandedIds }
        var next = expandedIds
        if next.contains(id) { next.remove(id) } else { next.insert(id) }; return next
    }
    public func togglingSelection(_ id: String, selectedIds: Set<String>) -> Set<String> {
        guard valid, let node = node(id), !isDisabled(id), node.selectable else { return selectedIds }
        var next = selectedIds
        if next.contains(id) { next.remove(id) } else { next.insert(id) }; return next
    }
}
