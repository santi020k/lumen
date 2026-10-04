import SwiftUI
import LumenUI

struct BreadcrumbParityExample: View {
    @State private var disabled = false
    @State private var spanish = false
    @State private var longPath = false
    @State private var lastId = "none"

    private var items: [LumenBreadcrumbItem] {
        var path = [
            LumenBreadcrumbItem(id: "home", label: spanish ? "Inicio" : "Home"),
            LumenBreadcrumbItem(id: "library", label: spanish ? "Biblioteca" : "Library"),
            LumenBreadcrumbItem(id: "locked", label: spanish ? "Archivo bloqueado" : "Locked archive", isDisabled: true)
        ]
        if longPath {
            path += [
                LumenBreadcrumbItem(id: "platforms", label: spanish ? "Plataformas y componentes compartidos" : "Platforms and shared components"),
                LumenBreadcrumbItem(id: "guides", label: spanish ? "Guías de navegación accesible" : "Accessible navigation guides")
            ]
        }
        path.append(LumenBreadcrumbItem(id: "current", label: spanish ? "Ruta actual" : "Current location"))
        return path
    }

    var body: some View {
        VStack(alignment: .leading) {
            LumenCheckbox("Disable trail", isChecked: $disabled)
            LumenCheckbox("Long trail", isChecked: $longPath)
            LumenCheckbox("Español", isChecked: $spanish)
            LumenBreadcrumb(spanish ? "Ubicación" : "Location", items: items,
                            currentLabel: spanish ? "Página actual" : "Current page",
                            onNavigate: { lastId = $0 }).disabled(disabled)
            LumenText(.verbatim("Host navigation ID: \(lastId)"))
        }
    }
}
