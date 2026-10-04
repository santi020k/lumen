#if os(iOS) || os(visionOS)
import SwiftUI
import UIKit

public struct LumenRichTextEditor: View {
    @Binding private var document: LumenRichTextDocument
    @Binding private var selection: NSRange
    @Environment(\.isEnabled) private var isEnabled
    @Environment(\.lumenTheme) private var theme
    private let label: String
    private let readOnly: Bool
    private let error: String?
    private let formatLabel: (LumenRichTextFormat) -> String
    public init(_ label: String, document: Binding<LumenRichTextDocument>, selection: Binding<NSRange>,
                readOnly: Bool = false, error: String? = nil,
                formatLabel: @escaping (LumenRichTextFormat) -> String = { $0.rawValue.capitalized }) {
        self.label = label; _document = document; _selection = selection
        self.readOnly = readOnly; self.error = error; self.formatLabel = formatLabel
    }
    public var body: some View {
        VStack(alignment: .leading, spacing: LumenSpacing.xs) {
            Text(label)
            ViewThatFits(in: .horizontal) {
                toolbar
                VStack(alignment: .leading) {
                    ForEach(LumenRichTextFormat.allCases, id: \.self) { format in formatButton(format) }
                }
            }
            LumenNativeRichText(document: $document, selection: $selection,
                                editable: isEnabled && !readOnly, label: label,
                                foregroundColor: UIColor(theme.colors.ink),
                                selectionColor: UIColor(theme.colors.brandSolid))
                .frame(minHeight: 120)
            if let error { Text(error).accessibilityLabel(Text(error)) }
        }
        .opacity(isEnabled ? 1 : 0.52)
    }
    private var toolbar: some View {
        HStack { ForEach(LumenRichTextFormat.allCases, id: \.self) { format in formatButton(format) } }
    }
    private func formatButton(_ format: LumenRichTextFormat) -> some View {
        LumenButton(disabled: readOnly || selection.length == 0, action: {
            if isEnabled && !readOnly { document = document.toggling(format, selection: selection) }
        }) { Text(formatLabel(format)) }
        .accessibilityLabel(Text(formatLabel(format)))
        .accessibilityAddTraits(isActive(format) ? .isSelected : [])
    }
    private func isActive(_ format: LumenRichTextFormat) -> Bool {
        guard selection.location >= 0, selection.length > 0,
              selection.location <= document.text.utf16.count,
              selection.length <= document.text.utf16.count - selection.location else { return false }
        return (selection.location..<(selection.location + selection.length)).allSatisfy { index in
            document.spans.contains { $0.format == format && index >= $0.start && index < $0.end }
        }
    }
}

private struct LumenNativeRichText: UIViewRepresentable {
    @Binding var document: LumenRichTextDocument
    @Binding var selection: NSRange
    let editable: Bool
    let label: String
    let foregroundColor: UIColor
    let selectionColor: UIColor
    func makeCoordinator() -> Coordinator { Coordinator(self) }
    func makeUIView(context: Context) -> UITextView {
        let view = UITextView()
        view.delegate = context.coordinator
        view.adjustsFontForContentSizeCategory = true
        view.backgroundColor = .clear
        view.allowsEditingTextAttributes = false
        return view
    }
    func updateUIView(_ view: UITextView, context: Context) {
        context.coordinator.parent = self
        view.isEditable = editable
        view.accessibilityLabel = label
        view.tintColor = selectionColor
        // Do not replace marked text while an IME is composing.
        guard view.markedTextRange == nil else { return }
        let attributed = NSMutableAttributedString(string: document.text,
            attributes: [.font: UIFont.preferredFont(forTextStyle: .body), .foregroundColor: foregroundColor])
        let length = document.text.utf16.count
        for span in document.spans where span.format == .underline {
            let start = min(length, max(0, span.start)), end = min(length, max(0, span.end))
            if end > start { attributed.addAttribute(.underlineStyle, value: NSUnderlineStyle.single.rawValue,
                                                   range: NSRange(location: start, length: end - start)) }
        }
        let font = UIFont.preferredFont(forTextStyle: .body)
        for index in 0..<length {
            var traits: UIFontDescriptor.SymbolicTraits = []
            for span in document.spans where index >= span.start && index < span.end {
                if span.format == .bold { traits.insert(.traitBold) }
                if span.format == .italic { traits.insert(.traitItalic) }
            }
            if let descriptor = font.fontDescriptor.withSymbolicTraits(traits) {
                attributed.addAttribute(.font, value: UIFont(descriptor: descriptor, size: font.pointSize),
                                        range: NSRange(location: index, length: 1))
            }
        }
        context.coordinator.updating = true
        if !view.attributedText.isEqual(to: attributed) { view.attributedText = attributed }
        let start = min(length, max(0, selection.location))
        let range = NSRange(location: start, length: min(length - start, max(0, selection.length)))
        if view.selectedRange != range { view.selectedRange = range }
        context.coordinator.updating = false
    }
    final class Coordinator: NSObject, UITextViewDelegate {
        var parent: LumenNativeRichText
        var updating = false
        init(_ parent: LumenNativeRichText) { self.parent = parent }
        func textViewDidChange(_ textView: UITextView) {
            guard !updating, parent.editable else { return }
            parent.document = parent.document.replacing(textView.text)
            parent.selection = textView.selectedRange
        }
        func textViewDidChangeSelection(_ textView: UITextView) {
            if !updating { parent.selection = textView.selectedRange }
        }
    }
}
#endif
