#if os(iOS) || os(macOS) || os(visionOS)
import SwiftUI

public struct LumenTour<Content: View>: View {
    @Binding private var open: Bool
    @Binding private var index: Int
    @Environment(\.isEnabled) private var enabled
    @Environment(\.lumenTheme) private var theme
    @AccessibilityFocusState private var focused: Bool
    private let label: String
    private let steps: [LumenTourStep]
    private let anchors: [String: LumenTourRect]
    private let onFinish: (LumenTourStep) -> Void
    private let onDismiss: () -> Void
    private let readOnly: Bool
    private let loading: Bool
    private let error: String?
    private let closeLabel: String
    private let previousLabel: String
    private let nextLabel: String
    private let finishLabel: String
    private let emptyLabel: String
    private let invalidLabel: String
    private let disabledLabel: String
    private let loadingLabel: String
    private let unavailableLabel: String
    private let formatProgress: (Int, Int) -> String
    private let content: Content
    public init(_ label: String, steps: [LumenTourStep], anchors: [String: LumenTourRect], open: Binding<Bool>, index: Binding<Int>,
        onFinish: @escaping (LumenTourStep) -> Void, onDismiss: @escaping () -> Void = {}, readOnly: Bool = false, loading: Bool = false, error: String? = nil,
        closeLabel: String = "Close tour", previousLabel: String = "Previous", nextLabel: String = "Next", finishLabel: String = "Finish",
        emptyLabel: String = "No tour steps", invalidLabel: String = "Invalid tour step", disabledLabel: String = "Tour step unavailable",
        loadingLabel: String = "Loading tour", unavailableLabel: String = "Target unavailable", formatProgress: @escaping (Int, Int) -> String = { "\($0 + 1) / \($1)" },
        @ViewBuilder content: () -> Content) {
        self.label = label; self.steps = steps; self.anchors = anchors; _open = open; _index = index
        self.onFinish = onFinish; self.onDismiss = onDismiss; self.readOnly = readOnly; self.loading = loading; self.error = error
        self.closeLabel = closeLabel; self.previousLabel = previousLabel; self.nextLabel = nextLabel; self.finishLabel = finishLabel
        self.emptyLabel = emptyLabel; self.invalidLabel = invalidLabel; self.disabledLabel = disabledLabel; self.loadingLabel = loadingLabel
        self.unavailableLabel = unavailableLabel; self.formatProgress = formatProgress; self.content = content()
    }
    private var step: LumenTourStep? { resolveLumenTourStep(steps, index: index) }
    private var status: String? {
        if let error { return error }
        if loading { return loadingLabel }
        if !isLumenTourStepsValid(steps) { return invalidLabel }
        if steps.isEmpty { return emptyLabel }
        guard let step else { return invalidLabel }
        return step.disabled ? disabledLabel : nil
    }
    private var locked: Bool { !enabled || readOnly || status != nil || !open }
    private func close() { open = false; onDismiss() }
    private func navigate(_ target: Int?) { if !locked, let target { index = target } }
    private func advance() {
        guard !locked, let step else { return }
        if let next = moveLumenTourStep(steps, index: index, direction: .next) { index = next } else { onFinish(step) }
    }
    private func rectangle(_ rect: LumenTourRect, color: Color) -> some View {
        Rectangle().fill(color).frame(width: CGFloat(rect.width), height: CGFloat(rect.height)).offset(x: CGFloat(rect.x), y: CGFloat(rect.y)).accessibilityHidden(true).allowsHitTesting(false)
    }
    public var body: some View {
        ZStack(alignment: .topLeading) {
            content.disabled(open).accessibilityHidden(open)
            if open {
                GeometryReader { proxy in
                    let viewport = LumenTourRect(x: 0, y: 0, width: Double(proxy.size.width), height: Double(proxy.size.height))
                    let layout = resolveLumenTourLayout(status == nil ? step.flatMap { anchors[$0.targetId] } : nil, viewport: viewport)
                    ZStack(alignment: .topLeading) {
                        Color.clear.contentShape(Rectangle()).onTapGesture { close() }.accessibilityHidden(true)
                        if let target = layout?.highlight {
                            rectangle(.init(x: 0, y: 0, width: viewport.width, height: target.y), color: theme.colors.ink.opacity(0.45))
                            rectangle(.init(x: 0, y: target.y, width: target.x, height: target.height), color: theme.colors.ink.opacity(0.45))
                            rectangle(.init(x: target.x + target.width, y: target.y, width: viewport.width - target.x - target.width, height: target.height), color: theme.colors.ink.opacity(0.45))
                            rectangle(.init(x: 0, y: target.y + target.height, width: viewport.width, height: viewport.height - target.y - target.height), color: theme.colors.ink.opacity(0.45))
                            RoundedRectangle(cornerRadius: LumenRadius.sm).stroke(theme.colors.brand, lineWidth: 3)
                                .frame(width: CGFloat(target.width), height: CGFloat(target.height)).offset(x: CGFloat(target.x), y: CGFloat(target.y)).accessibilityHidden(true).allowsHitTesting(false)
                        } else { theme.colors.ink.opacity(0.45).allowsHitTesting(false).accessibilityHidden(true) }
                        panel(unavailable: layout?.highlight == nil)
                            .frame(width: CGFloat(layout?.panel.width ?? viewport.width), height: CGFloat(layout?.panel.height ?? viewport.height))
                            .background(theme.colors.surface).clipShape(RoundedRectangle(cornerRadius: LumenRadius.md))
                            .offset(x: CGFloat(layout?.panel.x ?? 0), y: CGFloat(layout?.panel.y ?? 0))
                    }.environment(\.isEnabled, true)
                }.accessibilityElement(children: .contain).accessibilityLabel(label).accessibilityAddTraits(.isModal)
            }
        }
    }
    private func panel(unavailable: Bool) -> some View {
        ScrollView {
            VStack(alignment: .leading, spacing: LumenSpacing.sm) {
                LumenText(.verbatim(status ?? step?.title ?? label)).accessibilityAddTraits(.isHeader).accessibilityFocused($focused)
                if status == nil, let step {
                    LumenText(.verbatim(formatProgress(index, steps.count)))
                    LumenText(.verbatim(step.content))
                    if unavailable { LumenText(.verbatim(unavailableLabel)) }
                    HStack {
                        LumenButton(disabled: locked || moveLumenTourStep(steps, index: index, direction: .previous) == nil, action: { navigate(moveLumenTourStep(steps, index: index, direction: .previous)) }) { LumenText(.verbatim(previousLabel)) }.frame(minHeight: 44)
                        LumenButton(disabled: locked, action: advance) { LumenText(.verbatim(moveLumenTourStep(steps, index: index, direction: .next) == nil ? finishLabel : nextLabel)) }.frame(minHeight: 44)
                    }
                }
                LumenButton(intent: .quiet, action: close) { LumenText(.verbatim(closeLabel)) }.frame(minHeight: 44).keyboardShortcut(.escape, modifiers: [])
            }.padding(LumenSpacing.sm)
        }.task(id: status ?? step?.id ?? label) { focused = true }
    }
}
#endif
