import LumenUI
import SwiftUI

struct PlaygroundAdvancedInputsView: View {
    let matches: (String) -> Bool
    @State private var spanish = false
    @State private var readOnly = false
    @State private var amount = "12.5"
    @State private var password = "synthetic-example"
    @State private var code = ""
    @State private var query = ""
    @State private var city: String?
    @State private var resultState = "ready"
    @State private var time: LumenTimeSelection? = LumenTimeSelection(hour: 9, minute: 30)
    @State private var comparison = 0.5

    private let names = ["Number field", "Time field", "Autocomplete", "Password field", "Input OTP", "Image comparison"]
    private func copy(_ english: String, _ spanishCopy: String) -> String { spanish ? spanishCopy : english }
    private var cities: [LumenAutocompleteOption<String>] {
        if resultState == "empty" { return [] }
        return [LumenAutocompleteOption(value: "bogota", label: "Bogotá"), LumenAutocompleteOption(value: "medellin", label: "Medellín")]
            .filter { query.isEmpty || $0.label.localizedCaseInsensitiveContains(query) }
    }

    var body: some View {
        if names.contains(where: matches) {
            PlaygroundSection("Advanced inputs", description: "Synthetic local values exercise native editing, validation and comparison.") {
                VStack(alignment: .leading, spacing: LumenSpacing.lg) {
                    LumenToggle("Español", isOn: $spanish)
                    LumenToggle(LocalizedStringKey(copy("Read-only examples", "Ejemplos de solo lectura")), isOn: $readOnly)
                    if matches("Number field") { numberField }
                    if matches("Password field") {
                        LumenPasswordField(copy("Example password", "Contraseña de ejemplo"), text: $password,
                                           showLabel: copy("Show password", "Mostrar contraseña"), hideLabel: copy("Hide password", "Ocultar contraseña"),
                                           newPassword: true, readOnly: readOnly)
                    }
                    if matches("Input OTP") {
                        LumenInputOTP(copy("One-time code", "Código de un solo uso"), text: $code, readOnly: readOnly)
                    }
                    if matches("Time field") {
                        LumenTimeField(copy("Appointment time", "Hora de la cita"), selection: $time,
                                       minTime: LumenTimeSelection(hour: 9, minute: 0), maxTime: LumenTimeSelection(hour: 17, minute: 0),
                                       placeholder: copy("Choose a time", "Elige una hora"), confirmLabel: copy("Confirm", "Confirmar"),
                                       dismissLabel: copy("Cancel", "Cancelar"), rangeErrorLabel: copy("Choose a time between 09:00 and 17:00", "Elige una hora entre las 09:00 y las 17:00"), readOnly: readOnly)
                    }
                    if matches("Autocomplete") { autocomplete }
                    if matches("Image comparison") {
                        LumenImageComparison(copy("Compare images", "Comparar imágenes"), value: $comparison,
                                             beforeLabel: copy("Before", "Antes"), afterLabel: copy("After", "Después")) {
                            Rectangle().fill(.gray.gradient).overlay(Image(systemName: "mountain.2").font(.largeTitle))
                        } after: {
                            Rectangle().fill(.blue.gradient).overlay(Image(systemName: "mountain.2.fill").font(.largeTitle))
                        }
                        .disabled(readOnly)
                    }
                }
                .environment(\.locale, Locale(identifier: spanish ? "es_CO" : "en_US"))
            }
        }
    }

    private var numberField: some View {
        LumenNumberField(copy("Quantity", "Cantidad"), text: $amount, min: "0", max: "100", step: "0.1",
                         invalidNumberLabel: copy("Enter a valid number", "Ingresa un número válido"),
                         outOfRangeLabel: copy("Enter a number between 0 and 100", "Ingresa un número entre 0 y 100"),
                         incrementLabel: copy("Increase value", "Aumentar valor"), decrementLabel: copy("Decrease value", "Disminuir valor"), readOnly: readOnly)
    }

    private var autocomplete: some View {
        VStack(alignment: .leading, spacing: LumenSpacing.md) {
            LumenSegmentedControl("Result state", selection: $resultState, options: [
                LumenSelectionOption(copy("Ready", "Listo"), value: "ready"),
                LumenSelectionOption(copy("Loading", "Cargando"), value: "loading"),
                LumenSelectionOption(copy("Empty", "Vacío"), value: "empty"),
                LumenSelectionOption(copy("Error", "Error"), value: "error")
            ])
            LumenAutocomplete(copy("City", "Ciudad"), query: $query, selection: $city, options: cities,
                              loading: resultState == "loading", resultsErrorMessage: resultState == "error" ? copy("Could not load cities", "No se pudieron cargar las ciudades") : nil,
                              onRetry: { resultState = "ready" }, loadingLabel: copy("Loading results", "Cargando resultados"), emptyLabel: copy("No results", "Sin resultados"),
                              retryLabel: copy("Retry", "Reintentar"), dismissLabel: copy("Close results", "Cerrar resultados"), readOnly: readOnly)
        }
    }
}
