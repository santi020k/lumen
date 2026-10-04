import LumenUI
import SwiftUI

struct CarouselParityExample: View {
    @State private var index = 0
    @State private var spanish = false
    @State private var disabled = false
    @State private var empty = false
    @State private var status: LumenCarouselStatus = .ready
    private let slides = [LumenCarouselSlide(id: "dashboard", label: "Dashboard"), .init(id: "portfolio", label: "Portfolio"), .init(id: "storefront", label: "Storefront")]
    var body: some View {
        VStack(alignment: .leading, spacing: LumenSpacing.sm) {
            LumenButton("English / Español") { spanish.toggle() }
            LumenButton("\(spanish ? "Deshabilitado" : "Disabled"): \(String(disabled))") { disabled.toggle() }
            LumenButton("\(spanish ? "Vacío" : "Empty"): \(String(empty))") { empty.toggle() }
            LumenButton(spanish ? "Cargando" : "Loading") { status = status == .loading ? .ready : .loading }
            LumenButton("Error") { status = status == .error ? .ready : .error }
            LumenButton(spanish ? "Índice inválido" : "Invalid index") { index = 99 }
            LumenButton(spanish ? "Restaurar" : "Restore") { index = 0; empty = false; status = .ready }
            LumenCarousel(spanish ? "Diapositivas de ejemplo" : "Example slides", slides: empty ? [] : slides, index: $index,
                          disabled: disabled, status: status,
                          labels: spanish ? .init(previous: "Diapositiva anterior", next: "Diapositiva siguiente", empty: "Sin diapositivas",
                                                  invalid: "Índice inválido", loading: "Cargando diapositivas", error: "No se pudieron cargar las diapositivas",
                                                  position: { "\($0.label), diapositiva \($1 + 1) de \($2)" }) : .init()) { slide, _ in
                LumenCard { Text(slide.label).frame(maxWidth: .infinity, maxHeight: .infinity) }
            }
            Text("\(index)")
        }
    }
}
