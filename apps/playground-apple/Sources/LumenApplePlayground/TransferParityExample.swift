import SwiftUI
import LumenUI

struct TransferParityExample: View {
    @State private var value = LumenTransferValue(selectedIds: ["release", "external-id"])
    @State private var readOnly = false
    @State private var loading = false
    @State private var error = false
    @State private var empty = false
    private let items = [LumenTransferItem(id: "design", label: "Design", detail: "Interface library"), LumenTransferItem(id: "docs", label: "Documentation"), LumenTransferItem(id: "release", label: "Release", detail: "Managed by the host", disabled: true)]
    var body: some View {
        VStack(alignment: .leading) {
            LumenCheckbox("Read only", isChecked: $readOnly)
            LumenCheckbox("Loading", isChecked: $loading)
            LumenCheckbox("Error", isChecked: $error)
            LumenCheckbox("Empty", isChecked: $empty)
            LumenTransfer("Project transfer", items: empty ? [] : items, value: $value, readOnly: readOnly, loading: loading, error: error ? "Transfer unavailable" : nil, formatCount: { "\($0) items" })
            LumenText(.verbatim("Target IDs: \(value.selectedIds.joined(separator: ", "))"))
            LumenText(.verbatim("Checked IDs: \(value.checkedIds.joined(separator: ", "))"))
        }
    }
}
