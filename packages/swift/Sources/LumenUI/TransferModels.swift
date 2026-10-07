import Foundation

public struct LumenTransferItem: Equatable, Sendable, Identifiable {
    public let id: String
    public let label: String
    public let detail: String?
    public let disabled: Bool
    public init(id: String, label: String, detail: String? = nil, disabled: Bool = false) {
        self.id = id; self.label = label; self.detail = detail; self.disabled = disabled
    }
}
public struct LumenTransferValue: Equatable, Sendable {
    public var selectedIds: [String]
    public var checkedIds: [String]
    public init(selectedIds: [String] = [], checkedIds: [String] = []) { self.selectedIds = selectedIds; self.checkedIds = checkedIds }
}
public enum LumenTransferSide: String, Sendable { case source, target }
public struct LumenTransferLists: Equatable, Sendable {
    public let source: [LumenTransferItem]
    public let target: [LumenTransferItem]
}
private func validTransferIds(_ ids: [String]) -> Bool {
    ids.allSatisfy { !$0.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty } && Set(ids).count == ids.count
}
public func isLumenTransferItemsValid(_ items: [LumenTransferItem]) -> Bool { validTransferIds(items.map(\.id)) }
public func isLumenTransferValueValid(_ value: LumenTransferValue) -> Bool { validTransferIds(value.selectedIds) && validTransferIds(value.checkedIds) }
public func lumenTransferLists(items: [LumenTransferItem], value: LumenTransferValue) -> LumenTransferLists? {
    guard isLumenTransferItemsValid(items), isLumenTransferValueValid(value) else { return nil }
    let selected = Set(value.selectedIds)
    return .init(source: items.filter { !selected.contains($0.id) }, target: items.filter { selected.contains($0.id) })
}
public func toggleLumenTransferItem(items: [LumenTransferItem], value: LumenTransferValue, id: String, checked: Bool) -> LumenTransferValue? {
    guard lumenTransferLists(items: items, value: value) != nil, let item = items.first(where: { $0.id == id }), !item.disabled,
          value.checkedIds.contains(id) != checked else { return nil }
    var checks = value.checkedIds.filter { $0 != id }
    if checked { checks.append(id) }
    return .init(selectedIds: value.selectedIds, checkedIds: checks)
}
public func moveLumenTransferItems(items: [LumenTransferItem], value: LumenTransferValue, to: LumenTransferSide) -> LumenTransferValue? {
    guard let lists = lumenTransferLists(items: items, value: value) else { return nil }
    let checked = Set(value.checkedIds)
    let candidates = to == .target ? lists.source : lists.target
    let moved = candidates.filter { !$0.disabled && checked.contains($0.id) }.map(\.id)
    guard !moved.isEmpty else { return nil }
    let movedSet = Set(moved)
    let selected = to == .target ? value.selectedIds + moved : value.selectedIds.filter { !movedSet.contains($0) }
    return .init(selectedIds: selected, checkedIds: value.checkedIds.filter { !movedSet.contains($0) })
}
