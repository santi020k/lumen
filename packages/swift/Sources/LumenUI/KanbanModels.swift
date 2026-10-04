import Foundation

public struct LumenKanbanCard: Identifiable, Equatable, Sendable {
    public let id: String
    public var label: String
    public var disabled: Bool
    public init(id: String, label: String, disabled: Bool = false) {
        self.id = id; self.label = label; self.disabled = disabled
    }
}
public struct LumenKanbanColumnData: Identifiable, Equatable, Sendable {
    public let id: String
    public var label: String
    public var cards: [LumenKanbanCard]
    public var capacity: Int?
    public var disabled: Bool
    public init(id: String, label: String, cards: [LumenKanbanCard], capacity: Int? = nil, disabled: Bool = false) {
        self.id = id; self.label = label; self.cards = cards; self.capacity = capacity; self.disabled = disabled
    }
}
/// Destination indices are measured after removing the moving card.
public struct LumenKanbanModel: Sendable {
    public let columns: [LumenKanbanColumnData]
    public let valid: Bool
    public init(columns: [LumenKanbanColumnData]) {
        self.columns = columns
        var columnIds: Set<String> = []; var cardIds: Set<String> = []
        valid = columns.allSatisfy { column in
            guard !column.id.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty,
                  columnIds.insert(column.id).inserted,
                  column.capacity.map({ $0 >= column.cards.count }) ?? true else { return false }
            return column.cards.allSatisfy { card in
                !card.id.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty && cardIds.insert(card.id).inserted
            }
        }
    }
    public func moving(_ cardId: String, toColumnId: String, toIndex: Int) -> [LumenKanbanColumnData]? {
        guard valid, let source = columns.first(where: { $0.cards.contains(where: { $0.id == cardId }) }),
              let target = columns.first(where: { $0.id == toColumnId }),
              let card = source.cards.first(where: { $0.id == cardId }), !source.disabled, !target.disabled, !card.disabled else { return nil }
        var destination = target.cards.filter { $0.id != cardId }
        guard toIndex >= 0, toIndex <= destination.count,
              target.capacity.map({ destination.count < $0 }) ?? true else { return nil }
        if source.id == target.id && source.cards.firstIndex(where: { $0.id == cardId }) == toIndex { return nil }
        destination.insert(card, at: toIndex)
        return columns.map { column in
            var next = column
            if column.id == target.id { next.cards = destination }
            else if column.id == source.id { next.cards.removeAll { $0.id == cardId } }
            return next
        }
    }
}
