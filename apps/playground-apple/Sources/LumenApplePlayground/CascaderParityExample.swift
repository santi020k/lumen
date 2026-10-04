import SwiftUI
import LumenUI

struct CascaderParityExample: View {
    @State private var path = ["missing"]
    @State private var disabled = false
    @State private var readOnly = false
    @State private var loading = false
    @State private var error = false
    private let nodes: [LumenTreeNode] = [.init(id: "americas", label: "Americas"),
        .init(id: "colombia", label: "Colombia", parentId: "americas"), .init(id: "bogota", label: "Bogotá", parentId: "colombia"),
        .init(id: "locked", label: "Unavailable region", disabled: true)]
    var body: some View {
        VStack(alignment: .leading) {
            LumenCheckbox("Disable cascader", isChecked: $disabled)
            LumenCheckbox("Read-only selection", isChecked: $readOnly)
            LumenCheckbox("Loading", isChecked: $loading)
            LumenCheckbox("Error", isChecked: $error)
            LumenCascader("Destination", nodes: nodes, selectedPath: $path, readOnly: readOnly,
                          loading: loading, error: error ? "Destinations unavailable" : nil).disabled(disabled)
            LumenText(.verbatim("Selected path: \(path.joined(separator: " / "))"))
        }
    }
}
