#if os(iOS) || os(visionOS)
import SwiftUI
import LumenUI

struct RichTextParityExample: View {
    @State private var document = LumenRichTextDocument(text: "Select words to format")
    @State private var selection = NSRange(location: 0, length: 6)
    var body: some View {
        LumenRichTextEditor("Notes", document: $document, selection: $selection)
    }
}
#endif
