#if os(iOS) || os(visionOS)
import LumenUI
import SwiftUI

struct MentionsParityExample: View {
    @State private var value = LumenMentionsValue(text: "Hello 😀 @al!", selection: .init(start: 12, end: 12))
    @State private var spanish = false
    @State private var disabled = false
    @State private var readOnly = false
    @State private var status: LumenMentionsStatus = .ready
    private let options = [LumenMentionOption(id: "alice", label: "Alice — Design", value: "alice"),
                           .init(id: "alex", label: "Alex — Engineering", value: "alex"),
                           .init(id: "archived", label: "Albert — Archived", value: "albert", disabled: true)]
    var body: some View {
        VStack(alignment: .leading, spacing: LumenSpacing.sm) {
            LumenButton("English / Español") { spanish.toggle() }
            LumenButton("\(spanish ? "Deshabilitado" : "Disabled"): \(String(disabled))") { disabled.toggle() }
            LumenButton("\(spanish ? "Solo lectura" : "Read-only"): \(String(readOnly))") { readOnly.toggle() }
            LumenButton("Loading") { status = status == .loading ? .ready : .loading }
            LumenButton("Error") { status = status == .error ? .ready : .error }
            LumenButton(spanish ? "Selección inválida" : "Invalid selection") { value.selection = .init(start: -1, end: -1) }
            LumenButton(spanish ? "Restaurar" : "Restore") {
                value = .init(text: "Hello 😀 @al!", selection: .init(start: 12, end: 12))
                disabled = false; readOnly = false; status = .ready
            }
            LumenMentions(spanish ? "Menciones de ejemplo" : "Example mentions", value: $value, options: options,
                          disabled: disabled, readOnly: readOnly, status: status,
                          labels: spanish ? .init(suggestions: "Sugerencias", empty: "Sin coincidencias", loading: "Cargando sugerencias",
                                                  error: "No se pudieron cargar las sugerencias", invalid: "Selección inválida", readOnly: "Solo lectura") : .init())
            Text(value.text)
        }
    }
}

#endif
