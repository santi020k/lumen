import Testing
@testable import LumenUI

@Test func kanbanMovesAndPreservesHostData() {
    let columns: [LumenKanbanColumnData] = [.init(id: "todo", label: "Todo", cards: [.init(id: "a", label: "A"), .init(id: "b", label: "B")], capacity: 2), .init(id: "done", label: "Done", cards: [], capacity: 1)]
    let model = LumenKanbanModel(columns: columns)
    #expect(model.valid)
    #expect(model.moving("a", toColumnId: "todo", toIndex: 1)?[0].cards.map(\.id) == ["b", "a"])
    #expect(model.moving("b", toColumnId: "done", toIndex: 0)?[1].cards.map(\.id) == ["b"])
    #expect(columns[0].cards.map(\.id) == ["a", "b"])
    #expect(model.moving("a", toColumnId: "done", toIndex: -1) == nil)
    #expect(model.moving("a", toColumnId: "todo", toIndex: 0) == nil)
}
@Test func kanbanRejectsInvalidAndBlockedMoves() {
    #expect(!LumenKanbanModel(columns: [.init(id: "", label: "", cards: [])]).valid)
    #expect(!LumenKanbanModel(columns: [.init(id: "c", label: "", cards: [.init(id: "a", label: ""), .init(id: "a", label: "")])]).valid)
    let model = LumenKanbanModel(columns: [.init(id: "a", label: "", cards: [.init(id: "card", label: "")], disabled: true), .init(id: "b", label: "", cards: [])])
    #expect(model.moving("card", toColumnId: "b", toIndex: 0) == nil)
    #expect(!LumenKanbanModel(columns: [.init(id: "a", label: "", cards: [], capacity: -1)]).valid)
}
@Test func kanbanCapacityAndCardGuards() {
    let columns: [LumenKanbanColumnData] = [.init(id: "a", label: "", cards: [.init(id: "one", label: ""), .init(id: "two", label: "", disabled: true)], capacity: 2), .init(id: "b", label: "", cards: [], capacity: 0)]
    let model = LumenKanbanModel(columns: columns)
    #expect(model.valid)
    #expect(model.moving("one", toColumnId: "b", toIndex: 0) == nil)
    #expect(model.moving("two", toColumnId: "a", toIndex: 0) == nil)
    #expect(model.moving("one", toColumnId: "a", toIndex: 1)?[0].cards.map(\.id) == ["two", "one"])
    #expect(model.moving("one", toColumnId: "unknown", toIndex: 0) == nil)
}
