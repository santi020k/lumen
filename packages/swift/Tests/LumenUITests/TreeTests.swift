import Testing
@testable import LumenUI

@Test func treeRejectsInvalidGraphs() {
    for nodes in [[LumenTreeNode(id: "", label: "")],
                  [LumenTreeNode(id: "a", label: ""), LumenTreeNode(id: "a", label: "")],
                  [LumenTreeNode(id: "a", label: "", parentId: "missing")],
                  [LumenTreeNode(id: "a", label: "", parentId: "b"), LumenTreeNode(id: "b", label: "", parentId: "a")]] {
        let model = LumenTreeModel(nodes: nodes)
        #expect(!model.valid)
        #expect(model.visibleRows(expandedIds: []).isEmpty)
    }
}
@Test func treePreservesStateAndDisabledBranches() {
    let model = LumenTreeModel(nodes: [.init(id: "r", label: "Root"), .init(id: "c", label: "Child", parentId: "r"),
                                     .init(id: "d", label: "Disabled", disabled: true), .init(id: "x", label: "Blocked", parentId: "d")])
    #expect(model.visibleRows(expandedIds: ["r"]).map(\.id) == ["r", "c", "d"])
    #expect(model.path("c").map(\.id) == ["r", "c"])
    #expect(model.togglingSelection("c", selectedIds: ["missing"]) == ["missing", "c"])
    #expect(model.togglingSelection("x", selectedIds: ["missing"]) == ["missing"])
    #expect(model.togglingExpansion("d", expandedIds: []).isEmpty)
}
@Test func treeTraversesDeepGraphsIteratively() {
    let nodes = (0..<20000).map { LumenTreeNode(id: String($0), label: "", parentId: $0 == 0 ? nil : String($0 - 1)) }
    let model = LumenTreeModel(nodes: nodes)
    #expect(model.valid)
    #expect(model.path("19999").count == 20000)
    #expect(model.visibleRows(expandedIds: Set(nodes.map(\.id))).count == 20000)
}
@Test func treeTraversesWideGraphsIteratively() {
    let nodes = [LumenTreeNode(id: "root", label: "Root")] + (0..<20000).map {
        LumenTreeNode(id: String($0), label: "", parentId: "root")
    }
    let model = LumenTreeModel(nodes: nodes)
    #expect(model.valid)
    #expect(model.visibleRows(expandedIds: ["root"]).count == 20001)
}
