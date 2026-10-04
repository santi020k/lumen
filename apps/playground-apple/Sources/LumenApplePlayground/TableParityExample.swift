#if os(iOS) || os(macOS) || os(visionOS)
import LumenUI
import SwiftUI

struct TableParityExample: View {
    @State private var spanish = false
    @State private var scroll = false
    @State private var empty = false
    @State private var invalid = false
    private var columns: [LumenTableColumn] {
        [.init(key: "description", label: spanish ? "Descripción y notas en varias líneas" : "Description and multiline notes"),
         .init(key: "owner", label: spanish ? "Responsable / región" : "Owner / region"),
         .init(key: "status", label: spanish ? "Estado" : "Status")]
    }
    private var rows: [LumenTableRow] {
        [.init(id: "design", label: spanish ? "Registro de diseño" : "Design record", cells: [
            "description": .init(spanish ? "Revisión del sistema de diseño para pantallas pequeñas.\nSegunda línea: ejemplo sintético 😀." :
                "Design system review for narrow screens.\nSecond line: synthetic example 😀."),
            "owner": .init("Alex — Bogotá / Design"), "status": .init(spanish ? "En revisión" : "In review")]),
         .init(id: "engineering", label: spanish ? "Registro de ingeniería" : "Engineering record", cells: [
            "description": .init(spanish ? "Verificación de etiquetas extensas y contenido sin truncar." :
                "Verification of long labels and content without truncation."), "status": .init(spanish ? "Pendiente" : "Pending")])]
    }
    var body: some View {
        VStack(alignment: .leading, spacing: LumenSpacing.sm) {
            LumenButton("English / Español") { spanish.toggle() }
            LumenButton(action: { scroll.toggle() }) { Text(spanish ? (scroll ? "Desplazamiento" : "Registros") : (scroll ? "Scroll" : "Records")) }
            LumenButton(spanish ? "Vacío" : "Empty") { empty.toggle() }
            LumenButton(spanish ? "Datos inválidos" : "Invalid data") { invalid.toggle() }
            LumenButton(spanish ? "Restaurar" : "Restore") { empty = false; invalid = false; scroll = false }
            LumenTable(spanish ? "Registros de ejemplo" : "Example records", columns: columns,
                       rows: invalid ? rows + [rows[0]] : (empty ? [] : rows), layout: scroll ? .scroll : .records,
                       emptyLabel: spanish ? "Sin registros" : "No records",
                       invalidLabel: spanish ? "Identidades de registros inválidas" : "Invalid record identities",
                       missingLabel: spanish ? "Faltante" : "Missing")
        }
    }
}
#endif
