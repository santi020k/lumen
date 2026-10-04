import SwiftUI
import LumenUI

struct TooltipParityExample: View {
    @State private var presented = false
    @State private var disabled = false
    var body: some View {
        VStack(alignment: .leading) {
            LumenCheckbox("Disable help", isChecked: $disabled)
            LumenTooltip("Project privacy help", text: "This playground uses synthetic project information.",
                isPresented: $presented, disabled: disabled, dismissLabel: "Close explanation")
            LumenText(.verbatim("Host visibility: \(presented ? "shown" : "hidden")"))
            LumenButton(disabled: disabled, action: { presented = true }) { Text("Show help explicitly") }
            LumenButton(action: { presented = false }) { Text("Dismiss help explicitly") }
        }
    }
}
