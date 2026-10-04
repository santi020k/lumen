import LumenUI
import SwiftUI

struct ColorPickerParityExample: View {
    @State private var value = "#3366cc80"
    @State private var spanish = false
    @State private var readOnly = false
    @State private var disabled = false
    var body: some View {
        VStack(alignment: .leading, spacing: LumenSpacing.sm) {
            LumenButton("English / Español") { spanish.toggle() }
            LumenButton(spanish ? "Color inválido" : "Invalid color") { value = "bad" }
            LumenButton(spanish ? "Restaurar" : "Restore") { value = "#3366cc80" }
            LumenButton(spanish ? "Transparente" : "Transparent black") { value = "#00000000" }
            LumenButton("\(spanish ? "Solo lectura" : "Read only"): \(readOnly)") { readOnly.toggle() }
            LumenButton("\(spanish ? "Deshabilitado" : "Disabled"): \(disabled)") { disabled.toggle() }
            LumenColorPicker(spanish ? "Color de acento" : "Accent color", value: $value, allowAlpha: true,
                             disabled: disabled, readOnly: readOnly,
                             palette: [.init(id: "blue", label: spanish ? "Azul" : "Blue", value: "#3366cc80"),
                                       .init(id: "red", label: spanish ? "Rojo" : "Red", value: "#cc3333ff")],
                             labels: spanish ? .init(field: "Color hexadecimal o RGBA", hue: "Matiz", saturation: "Saturación",
                                                     brightness: "Brillo", alpha: "Opacidad", invalid: "Introduce un color válido",
                                                     preview: "Color seleccionado") : .init())
            Text(value)
        }
    }
}
