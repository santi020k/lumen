import SwiftUI
import LumenUI

struct CommandParityExample: View {
    @State private var open = false
    @State private var query = ""
    @State private var activeId: String? = "note"
    @State private var readOnly = false
    @State private var loading = false
    @State private var error = false
    @State private var empty = false
    @State private var preview = false
    @State private var message = "Choose a command"
    private let groups = [LumenCommandGroup(id: "navigation", label: "Navigation", items: [
        .init(id: "note", label: "Show documentation note", detail: "Read local guidance", keywords: ["guide", "manual"], shortcut: "⌘D")
    ]), LumenCommandGroup(id: "actions", label: "Actions", items: [
        .init(id: "preview", label: "Toggle preview"), .init(id: "reset", label: "Reset example"), .init(id: "unavailable", label: "Unavailable command", disabled: true)
    ])]
    var body: some View {
        VStack(alignment: .leading) {
            LumenCheckbox("Read only", isChecked: $readOnly)
            LumenCheckbox("Loading", isChecked: $loading)
            LumenCheckbox("Error", isChecked: $error)
            LumenCheckbox("Empty", isChecked: $empty)
            LumenButton(action: { open = true }) { LumenText(.verbatim("Open commands")) }
            LumenText(.verbatim(message))
            LumenText(.verbatim(preview ? "Preview enabled" : "Preview disabled"))
        }.lumenSheet(isPresented: $open) {
            LumenCommand("Project commands", groups: empty ? [] : groups, open: $open, query: Binding(get: { query }, set: { query = $0; activeId = nil }), activeId: $activeId,
                onSelect: select, readOnly: readOnly, loading: loading, error: error ? "Commands unavailable" : nil, formatCount: { "\($0) commands" })
        }
    }
    private func select(_ item: LumenCommandItem) {
        if item.id == "preview" { preview.toggle() }
        if item.id == "reset" { preview = false; query = ""; activeId = nil }
        message = item.id == "note" ? "Documentation: search for a component and inspect its public contract." : "Selected \(item.label)"
        open = false
    }
}
