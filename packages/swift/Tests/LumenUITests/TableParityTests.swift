#if os(iOS) || os(macOS) || os(visionOS)
import XCTest
@testable import LumenUI

final class TableParityTests: XCTestCase {
    func testIdentityValidationAndEmptyStateInputsRemainUnchanged() {
        let columns = [LumenTableColumn(key: "description", label: "Description")]
        let row = LumenTableRow(id: "one", label: "One", cells: [:])
        XCTAssertTrue(LumenTableModel.isValid(columns: [], rows: []))
        XCTAssertTrue(LumenTableModel.isValid(columns: columns, rows: []))
        XCTAssertFalse(LumenTableModel.isValid(columns: columns, rows: [row, row]))
        XCTAssertFalse(LumenTableModel.isValid(columns: columns + columns, rows: [row]))
        XCTAssertFalse(LumenTableModel.isValid(columns: columns, rows: [.init(id: "", label: "Empty ID", cells: [:])]))
        XCTAssertEqual(row.id, "one")
        XCTAssertTrue(row.cells.isEmpty)
    }
    func testLiteralKeysAndMultilineUnicodeValuesDoNotAliasMissingCells() {
        let text = "Synthetic record with long content 😀.\nSecond line preserved."
        let row = LumenTableRow(id: "Unicode 😀", label: "Synthetic", cells: ["__proto__": .init(text)])
        let columns = [LumenTableColumn(key: "__proto__", label: "Literal key"), .init(key: "constructor", label: "Missing")]
        XCTAssertTrue(LumenTableModel.isValid(columns: columns, rows: [row]))
        XCTAssertEqual(row.cells["__proto__"]?.text, text)
        XCTAssertNil(row.cells["constructor"])
        XCTAssertEqual(row.cells.count, 1)
    }
}
#endif
