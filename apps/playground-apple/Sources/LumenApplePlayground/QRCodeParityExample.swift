import LumenUI
import SwiftUI

struct QRCodeParityExample: View {
    @State private var value = "https://lumen.santi020k.com"
    @State private var spanish = false
    var body: some View {
        VStack(alignment: .leading, spacing: LumenSpacing.sm) {
            LumenButton("English / Español") { spanish.toggle() }
            LumenButton("Unicode") { value = "https://lumen.santi020k.com/日本語?name=Molina🌞" }
            LumenButton(spanish ? "Vacío" : "Empty") { value = "" }
            LumenButton(spanish ? "Exceso" : "Oversize") { value = String(repeating: "A", count: 10000) }
            LumenButton(spanish ? "Restaurar" : "Restore") { value = "https://lumen.santi020k.com" }
            LumenQRCode(spanish ? "Código QR de ejemplo" : "Example QR code", value: value,
                        errorLabel: spanish ? "No se pudo generar el código QR" : "Unable to generate QR code",
                        showValue: value.count < 200)
        }
    }
}
