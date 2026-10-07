import SwiftUI
import LumenUI

struct KanbanBoardParityExample: View {
    @State private var columns: [LumenKanbanColumnData] = [
        .init(id: "todo", label: "To do", cards: [.init(id: "design", label: "Design mobile board"), .init(id: "test", label: "Test keyboard moves")]),
        .init(id: "done", label: "Done (capacity 1)", cards: [], capacity: 1)
    ]
    @State private var disabled = false
    @State private var empty = false
    @State private var readOnly = false
    @State private var loading = false
    @State private var error = false
    var body: some View {
        VStack(alignment: .leading) {
            LumenCheckbox("Disable board", isChecked: $disabled)
            LumenCheckbox("Empty board", isChecked: $empty)
            LumenCheckbox("Read-only board", isChecked: $readOnly)
            LumenCheckbox("Loading", isChecked: $loading)
            LumenCheckbox("Error", isChecked: $error)
            LumenKanbanBoard("Project board", columns: empty ? .constant([]) : $columns, readOnly: readOnly,
                             loading: loading, error: error ? "Board unavailable" : nil).disabled(disabled)
        }
    }
}
