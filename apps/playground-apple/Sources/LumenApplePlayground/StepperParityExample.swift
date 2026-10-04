import SwiftUI
import LumenUI

struct StepperParityExample: View {
    @State private var current = 0
    @State private var horizontal = false
    @State private var invalid = false
    @State private var spanish = false
    private var steps: [LumenStepItem] {
        let titles = spanish ? ["Elegir una experiencia accesible con un título largo", "Revisar los detalles", "Confirmar"] : ["Choose an accessible experience with a longer title", "Review the details", "Confirm"]
        return titles.enumerated().map { index, title in .init(id: invalid ? "duplicate" : "step-\(index)", title: title, description: spanish ? "La aplicación controla el progreso." : "The host owns navigation and saves progress.") }
    }
    var body: some View {
        VStack(alignment: .leading, spacing: LumenSpacing.sm) {
            LumenButton(intent: .secondary, action: { spanish.toggle() }) { LumenText(.verbatim("English / Español")) }
            LumenCheckbox(spanish ? "Vista horizontal" : "Horizontal layout", isChecked: $horizontal)
            LumenCheckbox(spanish ? "IDs duplicados" : "Duplicate IDs", isChecked: $invalid)
            LumenStepper(spanish ? "Progreso del ejemplo" : "Example progress", steps: steps, currentStep: current, horizontal: horizontal, invalidText: spanish ? "Pasos no disponibles" : "Steps unavailable", formatState: { state in
                switch state {
                case .complete: spanish ? "Completado" : "Complete"
                case .current: spanish ? "Actual" : "Current"
                case .upcoming: spanish ? "Pendiente" : "Upcoming"
                }
            })
            LumenText(.verbatim(spanish ? "Índice del host: \(current)" : "Host index: \(current)"))
            LumenButton(intent: .secondary, action: { current = max(0, min(3, current - 1)) }) { LumenText(.verbatim(spanish ? "Atrás" : "Back")) }
            LumenButton(action: { current = max(0, min(3, current + 1)) }) { LumenText(.verbatim(spanish ? "Siguiente" : "Next")) }
            LumenButton(intent: .secondary, action: { current = 0 }) { LumenText(.verbatim(spanish ? "Reiniciar" : "Reset progress")) }
            LumenButton(intent: .secondary, action: { current = 99 }) { LumenText(.verbatim(spanish ? "Después del final" : "Past the end")) }
            LumenButton(intent: .secondary, action: { current = -3 }) { LumenText(.verbatim(spanish ? "Índice negativo" : "Negative index")) }
        }
    }
}
