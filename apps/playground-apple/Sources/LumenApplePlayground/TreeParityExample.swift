import SwiftUI
import LumenUI

struct TreeParityExample: View {
    @State private var expanded: Set<String> = ["work"]
    @State private var selected: Set<String> = ["missing-record"]
    @State private var disabled = false
    @State private var readOnly = false
    @State private var loading = false
    @State private var error = false
    private let nodes: [LumenTreeNode] = [
        .init(id: "work", label: "Workspace"),
        .init(id: "reports", label: "Reports", parentId: "work"),
        .init(id: "quarter", label: "Quarterly report", parentId: "reports"),
        .init(id: "archive", label: "Locked archive", disabled: true),
        .init(id: "past", label: "Past report", parentId: "archive")
    ]
    var body: some View {
        VStack(alignment: .leading) {
            LumenCheckbox("Disable tree", isChecked: $disabled)
            LumenCheckbox("Read-only selection", isChecked: $readOnly)
            LumenCheckbox("Loading", isChecked: $loading)
            LumenCheckbox("Error", isChecked: $error)
            LumenTree("Project files", nodes: nodes, expandedIds: $expanded, selectedIds: $selected,
                      readOnly: readOnly, loading: loading, error: error ? "Files unavailable" : nil,
                      formatDisclosure: { "\($1 ? "Collapse" : "Expand") \($0)" },
                      formatLevel: { "Level \($0 + 1)" }).disabled(disabled)
            LumenText(.verbatim("Expanded: \(expanded.sorted().joined(separator: ", "))"))
            LumenText(.verbatim("Selected: \(selected.sorted().joined(separator: ", "))"))
        }
    }
}
