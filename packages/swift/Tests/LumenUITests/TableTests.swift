#if os(iOS) || os(macOS) || os(visionOS)
import SwiftUI
import Testing
@testable import LumenUI

private let tableColumns = [LumenTableColumn(key: "amount", label: "Amount", sortable: true)]
private func tableRow(_ id: String, _ value: LumenTableSortValue) -> LumenTableRow {
    LumenTableRow(id: id, label: id, cells: ["amount": LumenTableCell(id, sortValue: value)])
}

@Test func tableSortingPreservesManualOrderStableTiesAndMissingValues() {
    let rows = [tableRow("large", .number(20)), tableRow("small", .number(2)), tableRow("equal", .number(2)),
                tableRow("missing", .missing), tableRow("nan", .number(.nan))]
    let ascending = LumenTableSort(key: "amount", direction: .ascending)
    #expect(LumenTableModel.sorted(rows, columns: tableColumns, sort: ascending).map(\.id) == rows.map(\.id))
    #expect(LumenTableModel.sorted(rows, columns: tableColumns, sort: ascending, mode: .client).map(\.id) ==
            ["small", "equal", "large", "missing", "nan"])
    #expect(LumenTableModel.sorted(rows, columns: tableColumns,
            sort: .init(key: "amount", direction: .descending), mode: .client).map(\.id) ==
            ["large", "small", "equal", "missing", "nan"])
    #expect(LumenTableModel.sorted(rows, columns: tableColumns,
            sort: .init(key: "unknown", direction: .ascending), mode: .client).map(\.id) == rows.map(\.id))
}
@Test func tableSelectionRetainsFilteredAndDisabledRecords() {
    let rows = [tableRow("one", .number(1)), LumenTableRow(id: "locked", label: "Locked", cells: [:], isDisabled: true)]
    let selection: Set<String> = ["hidden", "locked"]
    #expect(LumenTableModel.togglingVisible(rows, selection: selection) == ["hidden", "locked", "one"])
    #expect(LumenTableModel.togglingVisible(rows, selection: ["hidden", "locked", "one"]) == selection)
    #expect(LumenTableModel.toggling(rows[1], selection: selection) == selection)
    #expect(LumenTableModel.togglingVisible([], selection: selection) == selection)
    #expect(!LumenTableModel.isValid(columns: tableColumns, rows: [rows[0], rows[0]]))
    #expect(!LumenTableModel.isValid(columns: tableColumns + tableColumns, rows: rows))
}
@Test func tableSortCyclesAndMixedTypesRemainTransitive() {
    let ascending = LumenTableSort.next(nil, key: "amount")
    #expect(ascending == .init(key: "amount", direction: .ascending))
    let descending = LumenTableSort.next(ascending, key: "amount")
    #expect(descending == .init(key: "amount", direction: .descending))
    #expect(LumenTableSort.next(descending, key: "amount") == nil)
    let rows = [tableRow("text", .text("2")), tableRow("ten", .number(10)), tableRow("three", .number(3)),
                tableRow("false", .boolean(false)), tableRow("true", .boolean(true))]
    #expect(LumenTableModel.sorted(rows, columns: tableColumns, sort: ascending, mode: .client).map(\.id) ==
            ["three", "ten", "false", "true", "text"])
}
@Test @MainActor func nativeTablesAcceptControlledAndLocalizedStates() {
    _ = LumenTable("Records", columns: tableColumns, rows: [], layout: .scroll, emptyLabel: "Empty")
    _ = LumenDataTable("Records", columns: tableColumns, rows: [], sort: .constant(nil),
                       selection: .constant(["hidden"]), readOnly: true, loading: true, loadingLabel: "Fetching",
                       emptyLabel: "Empty", selectAllLabel: "Choose", deselectAllLabel: "Clear",
                       formatSort: { $0?.direction.rawValue ?? "None" })
}
#endif
