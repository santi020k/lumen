import SwiftUI
import LumenUI

private struct TourExampleAnchorKey: PreferenceKey {
    static var defaultValue: [String: CGRect] { [:] }
    static func reduce(value: inout [String: CGRect], nextValue: () -> [String: CGRect]) { value.merge(nextValue(), uniquingKeysWith: { _, latest in latest }) }
}
private extension View {
    func exampleTourAnchor(_ id: String) -> some View {
        background(GeometryReader { geometry in Color.clear.preference(key: TourExampleAnchorKey.self, value: [id: geometry.frame(in: .named("tour-example"))]) })
    }
}
struct TourParityExample: View {
    @State private var open = false
    @State private var index = 0
    @State private var anchors: [String: LumenTourRect] = [:]
    @State private var preview = false
    @State private var message = "Start the guided tour"
    @State private var readOnly = false
    @State private var loading = false
    @State private var error = false
    @AccessibilityFocusState private var triggerFocused: Bool
    private let steps = [
        LumenTourStep(id: "preview-step", targetId: "preview", title: "Preview", content: "This control toggles the local preview."),
        LumenTourStep(id: "save-step", targetId: "save", title: "Save", content: "This control records a local example action."),
        LumenTourStep(id: "missing-step", targetId: "missing", title: "Optional control", content: "This target is intentionally absent. Guidance remains dismissible.")
    ]
    var body: some View {
        LumenTour("Example tour", steps: steps, anchors: anchors, open: $open, index: $index,
            onFinish: { step in message = "Completed \(step.title)"; open = false; triggerFocused = true }, onDismiss: { triggerFocused = true },
            readOnly: readOnly, loading: loading, error: error ? "Tour unavailable" : nil, formatProgress: { "Step \($0 + 1) of \($1)" }) {
            VStack(alignment: .leading, spacing: LumenSpacing.sm) {
                LumenCheckbox("Read only", isChecked: $readOnly)
                LumenCheckbox("Loading", isChecked: $loading)
                LumenCheckbox("Error", isChecked: $error)
                LumenButton(action: { index = 0; open = true }) { LumenText(.verbatim("Start tour")) }.accessibilityFocused($triggerFocused)
                LumenButton(action: { preview.toggle() }) { LumenText(.verbatim(preview ? "Preview enabled" : "Preview disabled")) }.exampleTourAnchor("preview")
                LumenButton(action: { message = "Local example saved" }) { LumenText(.verbatim("Save example")) }.exampleTourAnchor("save")
                LumenText(.verbatim(message))
                Spacer(minLength: 120)
            }.padding(LumenSpacing.sm).frame(maxWidth: .infinity, minHeight: 520, alignment: .topLeading)
        }.coordinateSpace(name: "tour-example").onPreferenceChange(TourExampleAnchorKey.self) { frames in
            anchors = frames.mapValues { .init(x: Double($0.minX), y: Double($0.minY), width: Double($0.width), height: Double($0.height)) }
        }
    }
}
