import Foundation

public struct LumenCommandItem: Equatable, Sendable, Identifiable {
    public let id: String
    public let label: String
    public let detail: String?
    public let keywords: [String]
    public let shortcut: String?
    public let disabled: Bool
    public init(id: String, label: String, detail: String? = nil, keywords: [String] = [], shortcut: String? = nil, disabled: Bool = false) {
        self.id = id; self.label = label; self.detail = detail; self.keywords = keywords; self.shortcut = shortcut; self.disabled = disabled
    }
}
public struct LumenCommandGroup: Equatable, Sendable, Identifiable {
    public let id: String
    public let label: String
    public let items: [LumenCommandItem]
    public init(id: String, label: String, items: [LumenCommandItem]) { self.id = id; self.label = label; self.items = items }
}
public enum LumenCommandNavigation: Sendable { case next, previous, first, last }
public func isLumenCommandGroupsValid(_ groups: [LumenCommandGroup]) -> Bool {
    var groupIds = Set<String>(); var itemIds = Set<String>()
    for group in groups {
        if group.id.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || !groupIds.insert(group.id).inserted { return false }
        for item in group.items {
            if item.id.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || !itemIds.insert(item.id).inserted { return false }
        }
    }
    return true
}
public func lumenCommandGroups(_ groups: [LumenCommandGroup], query: String) -> [LumenCommandGroup]? {
    guard isLumenCommandGroupsValid(groups) else { return nil }
    let search = query.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
    return groups.compactMap { group in
        let items = group.items.filter { item in
            search.isEmpty || ([item.label.isEmpty ? item.id : item.label, item.detail ?? "", item.shortcut ?? ""] + item.keywords).contains { $0.lowercased().contains(search) }
        }
        return items.isEmpty ? nil : LumenCommandGroup(id: group.id, label: group.label, items: items)
    }
}
public func resolveLumenCommandActive(_ groups: [LumenCommandGroup], query: String, activeId: String?) -> LumenCommandItem? {
    guard let activeId, let filtered = lumenCommandGroups(groups, query: query) else { return nil }
    return filtered.flatMap(\.items).first { $0.id == activeId && !$0.disabled }
}
public func moveLumenCommandActive(_ groups: [LumenCommandGroup], query: String, activeId: String?, direction: LumenCommandNavigation) -> String? {
    let items = lumenCommandGroups(groups, query: query)?.flatMap(\.items).filter { !$0.disabled } ?? []
    guard !items.isEmpty else { return nil }
    if direction == .first { return items.first?.id }
    if direction == .last { return items.last?.id }
    guard let index = items.firstIndex(where: { $0.id == activeId }) else { return direction == .next ? items.first?.id : items.last?.id }
    let delta = direction == .next ? 1 : -1
    return items[(index + delta + items.count) % items.count].id
}
