import SwiftUI
import LumenUI

struct RatingParityExample: View {
    @State private var value = 0
    @State private var maximum = 5
    @State private var readOnly = false
    @State private var disabled = false
    @State private var invalid = false
    @State private var spanish = false
    private var model: LumenRatingModel { .init(maximum: invalid ? 0 : maximum) }
    private var rating: Binding<Int> { Binding(get: { invalid ? -3 : value }, set: { invalid = false; value = $0 }) }
    var body: some View {
        VStack(alignment: .leading, spacing: LumenSpacing.sm) {
            LumenButton(intent: .secondary, action: { spanish.toggle() }) { LumenText(.verbatim("English / Español")) }
            LumenCheckbox(spanish ? "Solo lectura" : "Read only", isChecked: $readOnly)
            LumenCheckbox(spanish ? "Deshabilitado" : "Disabled", isChecked: $disabled)
            LumenCheckbox(spanish ? "Valores inválidos" : "Invalid values", isChecked: $invalid)
            LumenButton(intent: .secondary, action: { invalid = false; maximum = maximum == 5 ? 10 : maximum == 10 ? 1 : 5 }) { LumenText(.verbatim(spanish ? "Máximo: \(maximum)" : "Maximum: \(maximum)")) }
            LumenRating(spanish ? "Calificación del ejemplo" : "Example rating", value: rating, maximum: invalid ? 0 : maximum, readOnly: readOnly,
                formatOption: { spanish ? "Calificar \($0) de \($1)" : "Rate \($0) of \($1)" }).disabled(disabled)
            LumenText(.verbatim(spanish ? "Calificación: \(model.resolved(invalid ? -3 : value)) de \(model.maximum)" : "Rating: \(model.resolved(invalid ? -3 : value)) of \(model.maximum)"))
            LumenButton(intent: .secondary, action: { invalid = false; value = 0 }) { LumenText(.verbatim(spanish ? "Sin calificar" : "Clear rating")) }
            LumenButton(intent: .secondary, action: { invalid = false; value = maximum }) { LumenText(.verbatim(spanish ? "Calificación máxima" : "Set maximum rating")) }
        }
    }
}
