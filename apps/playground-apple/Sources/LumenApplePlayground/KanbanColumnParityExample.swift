import SwiftUI
import LumenUI

struct KanbanColumnParityExample: View {
    @State private var column = LumenKanbanColumnData(id: "todo", label: "To do", cards: [
        .init(id: "todo", label: "Design mobile column"), .init(id: "test", label: "Test accessible reorder")
    ], capacity: 3)
    @State private var disabled = false
    @State private var readOnly = false
    @State private var loading = false
    @State private var error = false
    @State private var opened = "No card opened"
    var body: some View {
        VStack(alignment: .leading) {
            LumenCheckbox("Disable column", isChecked: $disabled)
            LumenCheckbox("Read-only column", isChecked: $readOnly)
            LumenCheckbox("Loading", isChecked: $loading)
            LumenCheckbox("Error", isChecked: $error)
            LumenKanbanColumn(column: $column, readOnly: readOnly, loading: loading,
                error: error ? "Column unavailable" : nil,
                onAdd: { if !column.cards.contains(where: { $0.id == "review" }) { column.cards.append(.init(id: "review", label: "Review results")) } },
                onCardPress: { opened = $0 }) { card in
                    LumenText(.verbatim("\(card.label) · App-owned content"))
                }.disabled(disabled)
            LumenText(.verbatim("Opened card: \(opened)"))
        }
    }
}
