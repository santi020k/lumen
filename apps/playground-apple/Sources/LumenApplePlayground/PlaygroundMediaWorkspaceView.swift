// cspell:words Inspeccionar fotografía Acercar Alejar Ajustar izquierda derecha arriba Fotografías Compensación exposición ilustrativa paisaje ilustrativo seleccionada
import LumenUI
import SwiftUI

/// Illustrative consumer composition; image services and export remain application-owned.
struct PlaygroundMediaWorkspaceView: View {
    let matches: (String) -> Bool
    @State private var viewport = LumenMediaViewportValue()
    @State private var selected = true
    @State private var exposure = 0.0
    @State private var spanish = false
    private func copy(_ english: String, _ translated: String) -> String { spanish ? translated : english }
    private var photo: some View {
        Rectangle().fill(.blue.gradient).overlay(Image(systemName: "mountain.2.fill").font(.largeTitle))
    }
    var body: some View {
        if ["Media viewport", "Media thumbnail", "Media filmstrip"].contains(where: matches) {
            PlaygroundSection("Studio media", description: "Illustrative media with host-controlled values.") {
                VStack(alignment: .leading, spacing: LumenSpacing.lg) {
                    LumenToggle("Español", isOn: $spanish)
                    if matches("Media viewport") {
                        LumenMediaViewport(copy("Inspect the landscape", "Inspeccionar los detalles de la fotografía"), value: $viewport,
                            aspectRatio: 1.6, labels: .init(
                                zoomIn: copy("Zoom in", "Acercar"), zoomOut: copy("Zoom out", "Alejar"),
                                fit: copy("Fit to view", "Ajustar a la vista"), left: copy("Pan left", "Mover a la izquierda"),
                                right: copy("Pan right", "Mover a la derecha"), up: copy("Pan up", "Mover hacia arriba"),
                                down: copy("Pan down", "Mover hacia abajo"))) { photo }
                    }
                    if matches("Media thumbnail") { thumbnail }
                    if matches("Media filmstrip") {
                        LumenMediaFilmstrip(copy("Photos", "Fotografías"), selectionLabel: selected ? "1 selected" : "0 selected") {
                            VStack { thumbnail; LumenButton(intent: .secondary, disabled: true, action: {}) { Text("Move earlier") } }
                                .frame(width: 160)
                            VStack {
                                LumenMediaThumbnail("Unavailable example", selected: false, state: .error,
                                    stateLabel: "Could not load preview", onSelectionChange: { _ in }) { photo }
                                LumenButton(intent: .secondary, disabled: true, action: {}) { Text("Move later") }
                            }.frame(width: 160)
                        }
                    }
                    LumenSlider(LocalizedStringKey(copy("Exposure", "Compensación de la exposición de la fotografía")), value: $exposure, in: -1...1)
                    LumenText(.verbatim(exposure.formatted(.number.precision(.fractionLength(1))) + " EV"))
                    if exposure != 0 { LumenBadge("Modified") }
                    LumenButton(intent: .secondary, disabled: exposure == 0, action: { exposure = 0 }) { Text("Reset exposure") }
                }
                .environment(\.locale, Locale(identifier: spanish ? "es_CO" : "en_US"))
            }
        }
    }
    private var thumbnail: some View {
        LumenMediaThumbnail(copy("Landscape", "Fotografía ilustrativa del paisaje"), selected: selected, order: 1,
                            onSelectionChange: { selected = $0 }) { photo }
    }
}

/// Copyable layout recipe. The host supplies controlled media, editing and task presentation.
struct StudioMediaWorkspaceRecipe<Preview: View, Inspector: View, Tools: View, Media: View, Bottom: View>: View {
    let preview: Preview
    let inspector: Inspector
    let tools: Tools
    let media: Media
    let bottom: Bottom

    init(@ViewBuilder preview: () -> Preview, @ViewBuilder inspector: () -> Inspector,
         @ViewBuilder tools: () -> Tools, @ViewBuilder media: () -> Media,
         @ViewBuilder bottom: () -> Bottom) {
        self.preview = preview()
        self.inspector = inspector()
        self.tools = tools()
        self.media = media()
        self.bottom = bottom()
    }

    var body: some View {
        VStack(alignment: .leading, spacing: LumenSpacing.lg) {
            ViewThatFits(in: .horizontal) {
                HStack(alignment: .top, spacing: LumenSpacing.lg) {
                    preview.frame(minWidth: 320).layoutPriority(1)
                    inspector.frame(width: 240)
                }
                VStack(alignment: .leading, spacing: LumenSpacing.lg) { preview; inspector }
            }
            tools
            media
            bottom
        }
    }
}
