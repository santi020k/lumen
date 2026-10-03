import LumenUI
import SwiftUI

private struct WorkspaceRecord: Identifiable {
    let id: Int
    var name: String
    var note = ""
}

/// App-owned split navigation keeps list virtualization outside surrounding page scroll views.
struct PlaygroundWorkspaceView: View {
    let onBack: () -> Void
    @State private var records = (1...200).map { WorkspaceRecord(id: $0, name: String(format: "Lumen %03d", $0)) }
    @State private var query = ""
    @State private var selection: Int?
    @State private var editing = false
    @State private var draftName = ""
    @State private var draftNote = ""
    @State private var saved = false
    @State private var spanish = false
    @State private var state = "success"
    @Environment(\.dynamicTypeSize) private var dynamicTypeSize
    @FocusState private var nameFocused: Bool

    private func copy(_ english: String, _ spanish: String) -> LocalizedStringKey {
        LocalizedStringKey(self.spanish ? spanish : english)
    }

    private var selectedRecord: WorkspaceRecord? { records.first { $0.id == selection } }
    private var visibleRecords: [WorkspaceRecord] {
        guard state == "success" else { return [] }
        return records.filter { query.isEmpty || $0.name.localizedCaseInsensitiveContains(query) }
    }

    private var chartLabels: LumenChartLabels {
        guard spanish else { return .english }
        return LumenChartLabels(
            empty: "No hay datos disponibles.",
            notAvailable: "No disponible",
            size: "Tamaño",
            viewData: "Ver datos del gráfico",
            formatSummary: { _ in "Actividad semanal, cinco valores." }
        )
    }

    private var chartSeries: [LumenChartSeries] {
        let data: [LumenChartDatum] = [3, 7, 4, 8, 5].enumerated().map { index, value in
            LumenChartDatum(id: String(index), x: .category(String(index + 1)), y: Double(value))
        }
        return [LumenChartSeries(id: "activity", label: spanish ? "Cambios" : "Changes", data: data)]
    }

    var body: some View {
        NavigationSplitView {
            VStack(alignment: .leading, spacing: LumenSpacing.md) {
                LumenButton(copy("Back to examples", "Volver a ejemplos"), intent: .quiet, action: onBack)
                LumenButton(spanish ? "English" : "Español", intent: .secondary) { spanish.toggle() }
                LumenTextField(spanish ? "Buscar registros" : "Search records", text: $query)
                LumenButtonGroup {
                    LumenButton(copy("Ready", "Listo"), intent: .quiet) { state = "success" }
                    LumenButton(copy("Loading", "Cargando"), intent: .quiet) { state = "loading" }
                    LumenButton(copy("Empty", "Vacío"), intent: .quiet) { state = "empty" }
                    LumenButton("Error", intent: .quiet) { state = "error" }
                }
                List(visibleRecords, selection: $selection) { record in
                    LumenText(LocalizedStringKey(record.name)).tag(record.id)
                }
                if visibleRecords.isEmpty { placeholder }
            }
            .padding(LumenSpacing.md)
            .navigationTitle(spanish ? "Registros" : "Records")
        } detail: {
            ScrollView {
                if let record = selectedRecord {
                    VStack(alignment: .leading, spacing: LumenSpacing.lg) {
                        LumenText(LocalizedStringKey(record.name), variant: .title)
                        LumenText(LocalizedStringKey(record.note))
                        LumenButton(copy("Edit record", "Editar registro")) {
                            draftName = record.name
                            draftNote = record.note
                            saved = false
                            editing = true
                        }
                        if saved { LumenText(copy("Changes saved locally", "Cambios guardados localmente"), tone: .success) }
                        if state == "success" {
                            LumenBarChart(
                                label: spanish ? "Actividad semanal" : "Weekly activity",
                                series: chartSeries,
                                labels: chartLabels
                            )
                        } else { placeholder }
                    }
                    .padding(LumenSpacing.lg)
                } else {
                    LumenText(copy("Select a record", "Selecciona un registro"))
                        .padding(LumenSpacing.lg)
                }
            }
        }
        .navigationSplitViewStyle(.balanced)
        .lumenSheet(isPresented: $editing, title: copy("Edit record", "Editar registro"), dismissible: false) {
            LumenButtonGroup(orientation: dynamicTypeSize.isAccessibilitySize ? .vertical : .horizontal) {
                LumenButton(copy("Cancel", "Cancelar"), intent: .quiet) { editing = false }
                LumenButton(copy("Save", "Guardar"), disabled: draftName.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty) { save() }
            }
        } content: {
            VStack(alignment: .leading, spacing: LumenSpacing.lg) {
                LumenTextField(spanish ? "Nombre" : "Name", text: $draftName)
                    .focused($nameFocused)
                LumenTextarea(copy("Notes", "Notas"), text: $draftNote)
            }
            .task { nameFocused = true }
        }
    }

    @ViewBuilder
    private var placeholder: some View {
        switch state {
        case "loading": LumenSpinner(copy("Loading", "Cargando"))
        case "error":
            VStack(spacing: LumenSpacing.md) {
                LumenText(copy("Records could not load", "No se pudieron cargar los registros"), tone: .danger)
                LumenButton(copy("Retry", "Reintentar")) { state = "success" }
            }
        default: LumenText(copy("No records found", "No se encontraron registros"))
        }
    }

    private func save() {
        guard let index = records.firstIndex(where: { $0.id == selection }) else { return }
        let name = draftName.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !name.isEmpty else { return }
        records[index].name = name
        records[index].note = draftNote
        editing = false
        saved = true
    }
}
