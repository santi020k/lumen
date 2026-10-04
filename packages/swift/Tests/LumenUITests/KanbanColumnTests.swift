import Testing
import SwiftUI
@testable import LumenUI

@Test func kanbanStandaloneColumnReordersAtCapacity() {
    let column = LumenKanbanColumnData(id: "todo", label: "Todo", cards: [.init(id: "todo", label: "First"), .init(id: "second", label: "Second")], capacity: 2)
    let model = LumenKanbanModel(columns: [column])
    #expect(model.valid)
    let next = model.moving("second", toColumnId: column.id, toIndex: 0)?.first
    #expect(next?.id == "todo")
    #expect(next?.cards.map(\.id) == ["second", "todo"])
    #expect(column.cards.map(\.id) == ["todo", "second"])
    #expect(model.moving("todo", toColumnId: column.id, toIndex: -1) == nil)
    #expect(model.moving("second", toColumnId: column.id, toIndex: 2) == nil)
    let single = LumenKanbanModel(columns: [.init(id: "single", label: "Single", cards: [.init(id: "a", label: "A")])])
    #expect(single.moving("a", toColumnId: "single", toIndex: -1) == nil)
    #expect(single.moving("a", toColumnId: "single", toIndex: 1) == nil)
}
@Test func kanbanStandaloneColumnRejectsBlockedAndInvalidData() {
    let card = LumenKanbanCard(id: "a", label: "A", disabled: true)
    let model = LumenKanbanModel(columns: [.init(id: "c", label: "Column", cards: [card, .init(id: "b", label: "B")])])
    #expect(model.moving("a", toColumnId: "c", toIndex: 1) == nil)
    #expect(!LumenKanbanModel(columns: [.init(id: "c", label: "", cards: [card, card])]).valid)
    #expect(!LumenKanbanModel(columns: [.init(id: "c", label: "", cards: [card], capacity: 0)]).valid)
}
@MainActor @Test func kanbanStandaloneColumnDefaultAndRichContentCompile() {
    let column = Binding.constant(LumenKanbanColumnData(id: "c", label: "Column", cards: []))
    _ = LumenKanbanColumn(column: column, onAdd: {}, onCardPress: { _ in }, formatCount: { count, _ in "\(count) tasks" })
    _ = LumenKanbanColumn(column: column, readOnly: true, cardContent: { card in Text(card.label).bold() })
}
