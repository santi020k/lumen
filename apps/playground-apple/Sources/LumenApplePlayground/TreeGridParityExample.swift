import SwiftUI
import LumenUI

struct TreeGridParityExample: View {
    @State private var expanded: Set<String> = ["packages", "unknown-host-id"]
    @State private var readOnly = false
    private let records = [
        LumenTreeGridRecord(node: LumenTreeNode(id: "packages", label: "Packages"), cells: ["status": LumenTableCell("Synthetic group")]),
        LumenTreeGridRecord(node: LumenTreeNode(id: "astro", label: "Astro", parentId: "packages"), cells: ["status": LumenTableCell("Ready")]),
        LumenTreeGridRecord(node: LumenTreeNode(id: "react", label: "React", parentId: "packages"), cells: ["status": LumenTableCell("Review pending")]),
        LumenTreeGridRecord(node: LumenTreeNode(id: "locked", label: "Archived group", disabled: true), cells: ["status": LumenTableCell("Locked")]),
        LumenTreeGridRecord(node: LumenTreeNode(id: "archived", label: "Archived child", parentId: "locked"), cells: [:])
    ]
    var body: some View {
        VStack(alignment: .leading, spacing: LumenSpacing.sm) {
            LumenCheckbox("Read only cells", isChecked: $readOnly)
            LumenTreeGrid("Synthetic project status", columns: [LumenTreeGridColumn(key: "status", label: "Status")],
                records: records, expandedIds: $expanded, readOnly: readOnly,
                cellContent: { _, _, cell in AnyView(LumenText(.verbatim(cell?.text ?? "Unavailable"))) })
            LumenText(.verbatim("Host expansion IDs: \(expanded.count)"))
        }
    }
}
