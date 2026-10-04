import SwiftUI
import LumenUI

struct TreeSelectParityExample: View {
    @State private var value: String? = "retained-record"
    @State private var disabled = false
    @State private var readOnly = false
    @State private var loading = false
    @State private var error = false
    @State private var empty = false
    private let nodes: [LumenTreeNode] = [
        .init(id: "workspace", label: "Workspace"), .init(id: "design", label: "Design", parentId: "workspace"),
        .init(id: "mobile", label: "Mobile", parentId: "design"), .init(id: "archive", label: "Locked archive", disabled: true),
        .init(id: "past", label: "Past project", parentId: "archive")
    ]
    var body: some View {
        VStack(alignment: .leading) {
            LumenCheckbox("Disable picker", isChecked: $disabled)
            LumenCheckbox("Read-only picker", isChecked: $readOnly)
            LumenCheckbox("Loading", isChecked: $loading)
            LumenCheckbox("Error", isChecked: $error)
            LumenCheckbox("Empty options", isChecked: $empty)
            LumenTreeSelect("Project", nodes: empty ? [] : nodes, value: $value, readOnly: readOnly,
                loading: loading, error: error ? "Projects unavailable" : nil).disabled(disabled)
            LumenText(.verbatim("Controlled ID: \(value ?? "none")"))
            LumenButton(action: { value = "retained-record" }) { Text("Restore unknown ID") }
            LumenButton(action: { value = nil }) { Text("Clear selection") }
        }
    }
}
