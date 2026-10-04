import Testing
import SwiftUI
@testable import LumenUI

@Test func treeSelectFlattensHierarchyAndSelectsParentOrLeaf() {
    let model = LumenTreeSelectModel(nodes: [.init(id: "root", label: "Root"), .init(id: "leaf", label: "Leaf", parentId: "root")])
    #expect(model.rows.map(\.id) == ["root", "leaf"])
    #expect(model.rows.map(\.depth) == [0, 1])
    #expect(model.selecting("root", current: "unknown") == "root")
    #expect(model.selecting("leaf", current: nil) == "leaf")
    #expect(model.selectionLabel("unknown", placeholder: "Choose", unknownLabel: "Missing") == "Missing")
    #expect(model.selectionLabel(nil, placeholder: "Choose", unknownLabel: "Missing") == "Choose")
}
@Test func treeSelectRetainsUnknownAndRejectsDisabledAncestry() {
    let model = LumenTreeSelectModel(nodes: [.init(id: "r", label: "Root", disabled: true), .init(id: "c", label: "Child", parentId: "r"), .init(id: "group", label: "Group", selectable: false)])
    for id in ["r", "c", "group", "missing"] { #expect(model.selecting(id, current: "host-only") == "host-only") }
    #expect(model.selectionLabel("c", placeholder: "Choose", unknownLabel: "Missing") == "Child")
}
@Test func treeSelectRejectsInvalidAndTraversesDeepGraphsIteratively() {
    for nodes in [[LumenTreeNode(id: " ", label: "")], [.init(id: "a", label: ""), .init(id: "a", label: "")], [.init(id: "a", label: "", parentId: "missing")], [.init(id: "a", label: "", parentId: "a")]] {
        let model = LumenTreeSelectModel(nodes: nodes)
        #expect(!model.valid)
        #expect(model.rows.isEmpty)
        #expect(model.selecting("a", current: "unknown") == "unknown")
    }
    let deepNodes: [LumenTreeNode] = (0..<10000).map { index in
        let parent: String? = index == 0 ? nil : String(index - 1)
        return LumenTreeNode(id: String(index), label: String(index), parentId: parent)
    }
    let deep = LumenTreeSelectModel(nodes: deepNodes)
    #expect(deep.rows.count == 10000)
    #expect(deep.rows.last?.depth == 9999)
}
@MainActor @Test func treeSelectControlledViewCompiles() {
    _ = LumenTreeSelect("Team", nodes: [], value: .constant("retained"), readOnly: true, expandedLabel: "Open", collapsedLabel: "Closed", formatOption: { label, _, level in "\(label): \(level)" })
}
