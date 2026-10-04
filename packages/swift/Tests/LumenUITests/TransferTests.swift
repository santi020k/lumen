import Testing
@testable import LumenUI

@Test func transferPreservesHiddenDisabledAndControlledState() throws {
    let items = [LumenTransferItem(id: "a", label: "Alpha"), LumenTransferItem(id: "b", label: "Beta", disabled: true), LumenTransferItem(id: "c", label: "Gamma")]
    let value = LumenTransferValue(selectedIds: ["missing", "c"], checkedIds: ["unknown-check", "b", "a", "c"])
    let next = try #require(moveLumenTransferItems(items: items, value: value, to: .target))
    #expect(next == LumenTransferValue(selectedIds: ["missing", "c", "a"], checkedIds: ["unknown-check", "b", "c"]))
    #expect(value.selectedIds == ["missing", "c"])
    #expect(moveLumenTransferItems(items: items, value: next, to: .source) == LumenTransferValue(selectedIds: ["missing", "a"], checkedIds: ["unknown-check", "b"]))
    #expect(toggleLumenTransferItem(items: items, value: value, id: "b", checked: false) == nil)
    #expect(toggleLumenTransferItem(items: items, value: value, id: "missing", checked: true) == nil)
    #expect(toggleLumenTransferItem(items: items, value: value, id: "a", checked: true) == nil)
    #expect(toggleLumenTransferItem(items: items, value: value, id: "a", checked: false)?.checkedIds == ["unknown-check", "b", "c"])
}
@Test func transferRejectsIdentityAmbiguityAndHandlesMissingData() {
    let item = LumenTransferItem(id: "a", label: "Alpha")
    let value = LumenTransferValue(selectedIds: ["missing"], checkedIds: ["unknown-check"])
    #expect(lumenTransferLists(items: [item, item], value: value) == nil)
    #expect(!isLumenTransferItemsValid([.init(id: " ", label: "Blank")]))
    #expect(!isLumenTransferValueValid(.init(selectedIds: ["a", "a"])))
    #expect(!isLumenTransferValueValid(.init(checkedIds: [" "])))
    #expect(lumenTransferLists(items: [], value: value)?.target.isEmpty == true)
    #expect(moveLumenTransferItems(items: [], value: value, to: .target) == nil)
    #expect(isLumenTransferItemsValid([.init(id: String(repeating: "x", count: 100000), label: "Long")]))
}
