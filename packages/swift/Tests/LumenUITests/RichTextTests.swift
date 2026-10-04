import Foundation
import XCTest
@testable import LumenUI

final class RichTextTests: XCTestCase {
    func testToggleSelectedFormatPreservesOtherMarks() {
        let original = LumenRichTextDocument(text: "hello", spans: [.init(start: 0, end: 5, format: .italic)])
        let bold = original.toggling(.bold, selection: NSRange(location: 1, length: 3))
        XCTAssertEqual(bold.spans.count, 2)
        let split = bold.toggling(.bold, selection: NSRange(location: 2, length: 1))
        XCTAssertEqual(split.spans.filter { $0.format == .bold }, [
            .init(start: 1, end: 2, format: .bold), .init(start: 3, end: 4, format: .bold)
        ])
        XCTAssertEqual(original.spans.count, 1)
    }
    func testEmojiReplacementAndEmptySelection() {
        let original = LumenRichTextDocument(text: "ab😀cd", spans: [.init(start: 2, end: 4, format: .bold)])
        XCTAssertEqual(original.replacing("abcd").spans, [])
        XCTAssertEqual(original.replacing("xab😀cd").spans, [.init(start: 3, end: 5, format: .bold)])
        XCTAssertEqual(original.toggling(.italic, selection: NSRange(location: 0, length: 0)), original)
    }
}
