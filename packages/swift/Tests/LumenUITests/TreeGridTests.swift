import Testing
import SwiftUI
@testable import LumenUI

private let treeGridColumns = [LumenTreeGridColumn(key: "status", label: "Status")]
private let treeGridRecords = [
    LumenTreeGridRecord(node: LumenTreeNode(id: "root", label: "Packages"), cells: ["status": LumenTableCell("Group")]),
    LumenTreeGridRecord(node: LumenTreeNode(id: "child", label: "Astro", parentId: "root"), cells: ["status": LumenTableCell("Ready")]),
    LumenTreeGridRecord(node: LumenTreeNode(id: "locked", label: "Locked", disabled: true), cells: [:]),
    LumenTreeGridRecord(node: LumenTreeNode(id: "locked-child", label: "Locked child", parentId: "locked"), cells: [:]),
    LumenTreeGridRecord(node: LumenTreeNode(id: "locked-leaf", label: "Locked leaf", parentId: "locked-child"), cells: [:])
]
@Test func treeGridPreservesCellsLevelsAndHostExpansion() {
    let model = LumenTreeGridModel(columns: treeGridColumns, records: treeGridRecords)
    let expanded: Set<String> = ["root", "child", "unknown", "locked", "locked-child"]
    #expect(model.valid)
    #expect(model.visibleRows(expandedIds: []).map(\.id) == ["root", "locked"])
    #expect(model.visibleRows(expandedIds: expanded)[1].record.cells["status"]?.text == "Ready")
    #expect(model.visibleRows(expandedIds: expanded)[1].tree.depth == 1)
    #expect(model.togglingExpansion("root", expandedIds: expanded) == ["child", "unknown", "locked", "locked-child"])
    #expect(model.togglingExpansion("locked-child", expandedIds: expanded) == expanded)
    #expect(model.visibleRows(expandedIds: expanded).first { $0.id == "locked-child" }?.tree.disabled == true)
    #expect(expanded.contains("root"))
}
@Test func treeGridRejectsInvalidGraphAndColumnIdentity() {
    for columns in [[], [treeGridColumns[0], treeGridColumns[0]], [LumenTreeGridColumn(key: " ", label: "Status")]] {
        #expect(!LumenTreeGridModel(columns: columns, records: treeGridRecords).valid)
    }
    for records in [
        [treeGridRecords[0], treeGridRecords[0]],
        [LumenTreeGridRecord(node: LumenTreeNode(id: " ", label: "Blank"), cells: [:])],
        [LumenTreeGridRecord(node: LumenTreeNode(id: "cycle", label: "Cycle", parentId: "cycle"), cells: [:])]
    ] {
        let model = LumenTreeGridModel(columns: treeGridColumns, records: records)
        #expect(!model.valid)
        #expect(model.visibleRows(expandedIds: ["cycle"]).isEmpty)
        #expect(model.togglingExpansion("cycle", expandedIds: ["unknown"]) == ["unknown"])
    }
}
@MainActor @Test func treeGridControlledCustomCellsCompile() {
    let value = Binding<Set<String>>(get: { ["unknown"] }, set: { _ in })
    _ = LumenTreeGrid("Project status", columns: treeGridColumns, records: treeGridRecords, expandedIds: value)
    _ = LumenTreeGrid("Project status", columns: treeGridColumns, records: treeGridRecords, expandedIds: value,
        readOnly: true, cellContent: { _, _, cell in AnyView(LumenText(.verbatim(cell?.text ?? "Unavailable"))) })
    #expect(value.wrappedValue == ["unknown"])
}
