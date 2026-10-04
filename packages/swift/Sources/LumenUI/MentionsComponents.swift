#if os(iOS) || os(visionOS)
import SwiftUI
import UIKit

public enum LumenMentionsStatus: Sendable { case ready, loading, error }
public struct LumenMentionsLabels: Sendable {
    public var suggestions: String; public var empty: String; public var loading: String
    public var error: String; public var invalid: String; public var readOnly: String
    public init(suggestions: String = "Mention suggestions", empty: String = "No matching mentions",
                loading: String = "Loading suggestions", error: String = "Unable to load suggestions",
                invalid: String = "Invalid text selection", readOnly: String = "Read-only") {
        self.suggestions = suggestions; self.empty = empty; self.loading = loading
        self.error = error; self.invalid = invalid; self.readOnly = readOnly
    }
}
public struct LumenMentions: View {
    @Binding private var value: LumenMentionsValue
    @Environment(\.isEnabled) private var isEnabled
    @Environment(\.lumenTheme) private var theme
    @State private var composing = false
    @State private var focused = false
    @State private var dismissed: LumenMentionsValue?
    @State private var activeID: String?
    @State private var bridge = MentionsBridge()
    private let label: String; private let options: [LumenMentionOption]; private let trigger: String
    private let disabled: Bool; private let readOnly: Bool; private let status: LumenMentionsStatus
    private let labels: LumenMentionsLabels
    public init(_ label: String, value: Binding<LumenMentionsValue>, options: [LumenMentionOption],
                trigger: String = "@", disabled: Bool = false, readOnly: Bool = false,
                status: LumenMentionsStatus = .ready, labels: LumenMentionsLabels = .init()) {
        self.label = label; _value = value; self.options = options; self.trigger = trigger
        self.disabled = disabled; self.readOnly = readOnly; self.status = status; self.labels = labels
    }
    private var editable: Bool { isEnabled && !disabled && !readOnly }
    private var query: LumenMentionQuery? {
        editable && focused && !composing && status == .ready && dismissed != value ?
            LumenMentionEngine.query(value, trigger: trigger) : nil
    }
    private var matches: [LumenMentionOption] { LumenMentionEngine.options(options, query: query) }
    private var enabled: [LumenMentionOption] { matches.filter { !$0.disabled } }
    private var active: LumenMentionOption? { enabled.first { $0.id == activeID } ?? enabled.first }
    public var body: some View {
        VStack(alignment: .leading, spacing: LumenSpacing.sm) {
            Text(label)
            NativeMentions(value: $value, composing: $composing, focused: $focused,
                editable: editable, enabled: isEnabled && !disabled, bridge: bridge,
                label: readOnly ? "\(label), \(labels.readOnly)" : label,
                color: UIColor(theme.colors.ink), tint: UIColor(theme.colors.brandSolid),
                keyboard: handleKey, commit: insert)
                .frame(minHeight: 120).background(theme.colors.surface)
            if !LumenMentionEngine.isSelectionValid(value) { Text(labels.invalid).foregroundStyle(theme.colors.danger) }
            if status == .loading { Text(labels.loading) }
            if status == .error { Text(labels.error) }
            if query != nil && matches.isEmpty { Text(labels.empty) }
            if !matches.isEmpty {
                Text(labels.suggestions)
                ForEach(matches) { option in
                    LumenButton(disabled: option.disabled, action: { insert(option.id) }) { Text(option.label) }
                        .accessibilityAddTraits(active?.id == option.id ? .isSelected : [])
                }
            }
        }.opacity(disabled ? 0.52 : 1)
    }
    private func insert(_ id: String) {
        guard editable, !composing, bridge.matches(value), status == .ready, let option = matches.first(where: { $0.id == id }),
              let next = LumenMentionEngine.inserting(option, into: value, trigger: trigger) else { return }
        value = next
    }
    private func handleKey(_ key: String) -> String? {
        guard query != nil else { return nil }
        switch key {
        case UIKeyCommand.inputEscape: dismissed = value; return ""
        case "\r": return active?.id
        case UIKeyCommand.inputUpArrow, UIKeyCommand.inputDownArrow:
            guard !enabled.isEmpty else { return nil }
            let index = enabled.firstIndex(where: { $0.id == active?.id }) ?? 0
            let delta = key == UIKeyCommand.inputDownArrow ? 1 : -1
            activeID = enabled[(index + delta + enabled.count) % enabled.count].id
            return ""
        case UIKeyCommand.inputHome: activeID = enabled.first?.id; return ""
        case UIKeyCommand.inputEnd: activeID = enabled.last?.id; return ""
        default: return nil
        }
    }
}

@MainActor
private final class MentionsBridge {
    weak var view: UITextView?
    func matches(_ value: LumenMentionsValue) -> Bool {
        guard let view, view.markedTextRange == nil else { return false }
        let range = view.selectedRange
        return view.text == value.text && range.location == value.selection.start &&
            range.length == value.selection.end - value.selection.start
    }
}
private final class MentionsTextView: UITextView {
    var keyboard: ((String) -> String?)?
    var commit: ((String) -> Void)?
    override func pressesBegan(_ presses: Set<UIPress>, with event: UIPressesEvent?) {
        if markedTextRange == nil, let key = presses.first?.key,
           let id = keyboard?(key.charactersIgnoringModifiers) {
            if !id.isEmpty { commit?(id) }
            return
        }
        super.pressesBegan(presses, with: event)
    }
}
private struct NativeMentions: UIViewRepresentable {
    @Binding var value: LumenMentionsValue
    @Binding var composing: Bool
    @Binding var focused: Bool
    let editable: Bool; let enabled: Bool; let bridge: MentionsBridge; let label: String; let color: UIColor; let tint: UIColor
    let keyboard: (String) -> String?; let commit: (String) -> Void
    func makeCoordinator() -> Coordinator { Coordinator(self) }
    func makeUIView(context: Context) -> MentionsTextView {
        let view = MentionsTextView()
        bridge.view = view
        view.delegate = context.coordinator
        view.adjustsFontForContentSizeCategory = true
        view.font = .preferredFont(forTextStyle: .body)
        view.backgroundColor = .clear
        view.autocorrectionType = .no
        return view
    }
    func updateUIView(_ view: MentionsTextView, context: Context) {
        context.coordinator.parent = self
        view.isEditable = editable; view.isSelectable = enabled
        view.isUserInteractionEnabled = enabled
        view.accessibilityLabel = label; view.textColor = color; view.tintColor = tint
        view.keyboard = keyboard
        // Validate the current native buffer again immediately before a hardware-key insertion.
        view.commit = { [weak view] id in
            guard let view, view.markedTextRange == nil, context.coordinator.current(view) == value else { return }
            commit(id)
        }
        guard view.markedTextRange == nil else { return }
        context.coordinator.updating = true
        if view.text != value.text { view.text = value.text }
        if LumenMentionEngine.isSelectionValid(value) {
            let range = NSRange(location: value.selection.start, length: value.selection.end - value.selection.start)
            if view.selectedRange != range { view.selectedRange = range }
        }
        context.coordinator.updating = false
    }
    final class Coordinator: NSObject, UITextViewDelegate {
        var parent: NativeMentions; var updating = false
        init(_ parent: NativeMentions) { self.parent = parent }
        func current(_ view: UITextView) -> LumenMentionsValue {
            let range = view.selectedRange
            return .init(text: view.text, selection: .init(start: range.location, end: range.location + range.length))
        }
        func publish(_ view: UITextView) {
            guard !updating else { return }
            parent.composing = view.markedTextRange != nil
            if parent.editable { parent.value = current(view) }
        }
        func textViewDidChange(_ textView: UITextView) { publish(textView) }
        func textViewDidChangeSelection(_ textView: UITextView) { publish(textView) }
        func textViewDidBeginEditing(_ textView: UITextView) { parent.focused = true; publish(textView) }
        func textViewDidEndEditing(_ textView: UITextView) { publish(textView); parent.focused = false }
    }
}
#endif
