import XCTest
@testable import LumenUI

final class MentionsTests: XCTestCase {
    private func value(_ text: String, _ start: Int? = nil, _ end: Int? = nil) -> LumenMentionsValue {
        let caret = start ?? text.utf16.count
        return .init(text: text, selection: .init(start: caret, end: end ?? caret))
    }
    private let alice = LumenMentionOption(id: "alice", label: "Alice 🐈", value: "alice")
    func testBoundaryInsertionAndCustomTrigger() {
        XCTAssertEqual(LumenMentionEngine.query(value("Hello @AL tail", 9))?.query, "al")
        XCTAssertEqual(LumenMentionEngine.inserting(alice, into: value("😀 @al!", 6)), value("😀 @alice !", 10))
        XCTAssertNil(LumenMentionEngine.query(value("alice@bo")))
        XCTAssertEqual(LumenMentionEngine.query(value("x (@bo"))?.query, "bo")
        XCTAssertEqual(LumenMentionEngine.query(value("Hi ::al"), trigger: "::")?.query, "al")
        for trigger in ["", "a", "123456789", "🧡"] { XCTAssertNil(LumenMentionEngine.query(value("@al"), trigger: trigger)) }
        XCTAssertNil(LumenMentionEngine.query(value("@ál")))
    }
    func testInvalidSelectionPreserved() {
        for input in [value("😀 @al", 1), value("@al", -1), value("@al", 1, 4), value("@al", 2, 1), value("@al", Int.max)] {
            let original = input
            XCTAssertFalse(LumenMentionEngine.isSelectionValid(input))
            XCTAssertNil(LumenMentionEngine.query(input))
            XCTAssertNil(LumenMentionEngine.inserting(alice, into: input))
            XCTAssertEqual(input, original)
        }
        XCTAssertNil(LumenMentionEngine.query(value("@al", 1, 3)))
    }
    func testOptionsAndLinearLongInput() {
        let disabled = LumenMentionOption(id: "archived", label: "Archived", value: "albert", disabled: true)
        let options = [alice, .init(id: "alice", label: "Duplicate", value: "alex"), disabled,
                       .init(id: "bad", label: "Bad", value: "alice smith"), .init(id: "", label: "Empty", value: "alice"),
                       .init(id: "long", label: "Long", value: String(repeating: "a", count: 129))]
        XCTAssertEqual(LumenMentionEngine.options(options, query: LumenMentionEngine.query(value("@al"))), [alice, disabled])
        XCTAssertNil(LumenMentionEngine.inserting(disabled, into: value("@al")))
        XCTAssertNil(LumenMentionEngine.inserting(alice, into: value("@bo")))
        XCTAssertNil(LumenMentionEngine.query(value(String(repeating: "a", count: 1_000_000))))
    }
}
