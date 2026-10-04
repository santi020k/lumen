#if os(iOS) || os(macOS) || os(visionOS)
import SwiftUI

func lumenTooltipCanShow(label: String, text: String, enabled: Bool, disabled: Bool) -> Bool {
    enabled && !disabled && !label.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty &&
        !text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
}

/// A labeled help anchor with controlled native popover presentation.
public struct LumenTooltip: View {
    @Binding private var isPresented: Bool
    @Environment(\.isEnabled) private var enabled
    private let label: String
    private let text: String
    private let disabled: Bool
    private let dismissLabel: String

    public init(_ label: String, text: String, isPresented: Binding<Bool>, disabled: Bool = false,
                dismissLabel: String = "Dismiss help") {
        self.label = label; self.text = text; _isPresented = isPresented
        self.disabled = disabled; self.dismissLabel = dismissLabel
    }
    private var canShow: Bool { lumenTooltipCanShow(label: label, text: text, enabled: enabled, disabled: disabled) }
    private var presentation: Binding<Bool> {
        Binding(get: { isPresented && canShow }, set: { next in
            if !next || canShow { isPresented = next }
        })
    }
    public var body: some View {
        if !label.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            LumenButton(disabled: !canShow, action: { if canShow { isPresented.toggle() } }) { Text(label) }
                .accessibilityLabel(Text(label)).accessibilityHint(Text(text))
                .onLongPressGesture { if canShow { isPresented = true } }
                .onHover { hovering in if canShow && hovering { isPresented = true } }
                .popover(isPresented: presentation, arrowEdge: .bottom) {
                    VStack(alignment: .leading, spacing: LumenSpacing.sm) {
                        LumenText(.verbatim(text))
                        LumenButton(action: { isPresented = false }) { Text(dismissLabel) }
                    }.padding(LumenSpacing.md).frame(maxWidth: 320)
                        .accessibilityElement(children: .contain)
            }
        }
    }
}
#endif
