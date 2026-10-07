#if os(iOS) || os(macOS) || os(visionOS)
import LumenUI
import SwiftUI

private struct TimelineExampleEvent: Identifiable {
    let id: String; let time: String; let title: String; let detail: String
}
struct TimelineParityExample: View {
    @State private var spanish = false
    @State private var custom = false
    @State private var reverse = false
    @State private var empty = false
    @State private var disabled = false
    @State private var selected = ""
    private var events: [TimelineExampleEvent] {
        let source = [TimelineExampleEvent(id: "design", time: "10:00", title: spanish ? "Aprobación de diseño" : "Design approval",
            detail: spanish ? "Revisión de diseño sintética con contenido extenso para pantallas pequeñas.\nSegunda línea: Unicode 😀." :
                "Synthetic design review with long content for narrow screens.\nSecond line: Unicode 😀."),
            .init(id: "build", time: "12:20", title: spanish ? "Revisión de compilación" : "Build review",
                  detail: spanish ? "Revisión de compilación sintética. El contenido conserva sus controles." : "Synthetic build review. Host content retains its own controls."),
            .init(id: "release", time: "14:30", title: spanish ? "Preparación del lanzamiento" : "Release preparation",
                  detail: spanish ? "Preparación del lanzamiento sintética. El marcador final no tiene conector." : "Synthetic release preparation. The terminal marker has no connector.")]
        return empty ? [] : (reverse ? source.reversed() : source)
    }
    var body: some View {
        VStack(alignment: .leading, spacing: LumenSpacing.sm) {
            LumenButton("English / Español") { spanish.toggle() }
            LumenButton(spanish ? "Marcador personalizado" : "Custom marker") { custom.toggle() }
            LumenButton(spanish ? "Invertir orden" : "Reverse order") { reverse.toggle() }
            LumenButton(spanish ? "Vacío" : "Empty") { empty.toggle() }
            LumenButton(spanish ? "Deshabilitar acciones" : "Disable actions") { disabled.toggle() }
            LumenButton(spanish ? "Restaurar" : "Restore") { empty = false; reverse = false; custom = false; disabled = false; selected = "" }
            LumenTimeline(spanish ? "Cronología de ejemplo" : "Example timeline") {
                ForEach(events) { event in
                    if custom {
                        LumenTimelineItem(isLast: event.id == events.last?.id, dot: { LumenText("✓", variant: .caption) }) { content(event) }
                    } else {
                        LumenTimelineItem(isLast: event.id == events.last?.id) { content(event) }
                    }
                }
                if empty { Text(spanish ? "Sin eventos" : "No events") }
            }
            Text("\(spanish ? "Acción elegida" : "Selected action"): \(selected)")
        }
    }
    private func content(_ event: TimelineExampleEvent) -> some View {
        VStack(alignment: .leading, spacing: LumenSpacing.sm) {
            LumenText(.verbatim(event.time + " " + event.title), variant: .title)
            Text(event.detail)
            LumenButton(disabled: disabled, action: { selected = event.id }) { Text((spanish ? "Ver detalles " : "View details ") + event.time) }
        }
    }
}
#endif
