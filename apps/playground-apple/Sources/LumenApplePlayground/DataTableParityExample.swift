import SwiftUI
import LumenUI

struct DataTableParityExample: View {
    @State private var sort: LumenTableSort?
    @State private var selected: Set<String> = ["archived", "filtered-out"]
    @State private var client = true
    @State private var scroll = false
    @State private var hideReact = false
    @State private var readOnly = false
    @State private var disabled = false
    @State private var loading = false
    @State private var error = false
    @State private var empty = false
    @State private var spanish = false
    private func copy(_ english: String, _ translated: String) -> String { spanish ? translated : english }
    private var columns: [LumenTableColumn] { [
        LumenTableColumn(key: "package", label: copy("Package", "Paquete"), sortable: true),
        LumenTableColumn(key: "target", label: copy("Target", "Plataforma")),
        LumenTableColumn(key: "downloads", label: copy("Downloads", "Descargas"), sortable: true),
        LumenTableColumn(key: "status", label: copy("Status", "Estado"))
    ] }
    private var rows: [LumenTableRow] {
        if empty { return [] }
        return [
            LumenTableRow(id: "astro", label: "Astro", cells: ["package": LumenTableCell("@santi020k/lumen-astro"),
                "target": LumenTableCell("Astro"), "downloads": LumenTableCell(copy("24,800", "24.800"), sortValue: .number(24800)),
                "status": LumenTableCell(copy("Ready", "Listo"))]),
            LumenTableRow(id: "react", label: "React", cells: ["package": LumenTableCell("@santi020k/lumen-react"),
                "target": LumenTableCell("React"), "downloads": LumenTableCell(copy("8,450", "8.450"), sortValue: .number(8450)),
                "status": LumenTableCell(copy("In review", "En revisión"))]),
            LumenTableRow(id: "elements", label: "Elements", cells: ["package": LumenTableCell("@santi020k/lumen-elements"),
                "target": LumenTableCell(copy("Custom elements for responsive product interfaces", "Elementos personalizados para interfaces adaptables")),
                "downloads": LumenTableCell(copy("5,120", "5.120"), sortValue: .number(5120)), "status": LumenTableCell(copy("Ready", "Listo"))]),
            LumenTableRow(id: "archived", label: copy("Locked archive", "Archivo bloqueado"), cells: [
                "package": LumenTableCell(copy("Synthetic archived package", "Paquete sintético archivado")),
                "target": LumenTableCell(copy("Archive", "Archivo")), "downloads": LumenTableCell("—", sortValue: .missing)], isDisabled: true)
        ].filter { !hideReact || $0.id != "react" }
    }
    private func formatSort(_ value: LumenTableSort?) -> String {
        guard let value else { return copy("Unsorted", "Sin orden") }
        return value.direction == .ascending ? copy("Ascending", "Ascendente") : copy("Descending", "Descendente")
    }
    var body: some View {
        VStack(alignment: .leading, spacing: LumenSpacing.sm) {
            LumenCheckbox(copy("Sort locally", "Ordenar aquí"), isChecked: $client)
            LumenCheckbox(copy("Horizontal table", "Tabla horizontal"), isChecked: $scroll)
            LumenCheckbox(copy("Hide React", "Ocultar React"), isChecked: $hideReact)
            LumenCheckbox(copy("Read only", "Solo lectura"), isChecked: $readOnly)
            LumenCheckbox(copy("Disable table", "Deshabilitar tabla"), isChecked: $disabled)
            LumenCheckbox(copy("Loading", "Cargando"), isChecked: $loading)
            LumenCheckbox("Error", isChecked: $error)
            LumenCheckbox(copy("Empty records", "Sin registros"), isChecked: $empty)
            LumenCheckbox("Español", isChecked: $spanish)
            LumenText(.verbatim("\(copy("Selected IDs", "IDs seleccionados")): \(selected.sorted().joined(separator: ", "))"))
            LumenText(.verbatim("\(client ? "Client" : "Manual"): \(formatSort(sort))"))
            LumenDataTable(copy("Synthetic packages", "Paquetes sintéticos"), columns: columns, rows: rows,
                layout: scroll ? .scroll : .records, sort: $sort, sortMode: client ? .client : .manual, selection: $selected,
                readOnly: readOnly, loading: loading, error: error ? copy("Packages unavailable", "Paquetes no disponibles") : nil,
                onRetry: { error = false }, loadingLabel: copy("Loading packages", "Cargando paquetes"),
                emptyLabel: copy("No packages", "No hay paquetes"), missingLabel: copy("Unavailable", "Sin datos"),
                retryLabel: copy("Retry packages", "Reintentar paquetes"), selectAllLabel: copy("Select visible packages", "Seleccionar visibles"),
                deselectAllLabel: copy("Deselect visible packages", "Deseleccionar visibles"), formatSort: formatSort)
                .disabled(disabled).environment(\.locale, Locale(identifier: spanish ? "es" : "en"))
        }
    }
}
