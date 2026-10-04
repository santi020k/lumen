#if os(iOS) || os(macOS) || os(visionOS)
import Foundation

public enum LumenTableSortValue: Equatable, Sendable {
    case text(String), number(Double), boolean(Bool), missing
}
public struct LumenTableCell: Equatable, Sendable {
    public let text: String
    public let sortValue: LumenTableSortValue?
    public init(_ text: String, sortValue: LumenTableSortValue? = nil) {
        self.text = text
        self.sortValue = sortValue
    }
}
public struct LumenTableColumn: Identifiable, Equatable, Sendable {
    public var id: String { key }
    public let key: String
    public let label: String
    public let sortable: Bool
    public init(key: String, label: String, sortable: Bool = false) {
        self.key = key
        self.label = label
        self.sortable = sortable
    }
}
public struct LumenTableRow: Identifiable, Equatable, Sendable {
    public let id: String
    public let label: String
    public let cells: [String: LumenTableCell]
    public let isDisabled: Bool
    public init(id: String, label: String, cells: [String: LumenTableCell], isDisabled: Bool = false) {
        self.id = id
        self.label = label
        self.cells = cells
        self.isDisabled = isDisabled
    }
}
public enum LumenTableSortDirection: String, Sendable { case ascending, descending }
public enum LumenTableSortMode: Sendable { case client, manual }
public enum LumenTableLayout: Sendable { case records, scroll }
public struct LumenTableSort: Equatable, Sendable {
    public let key: String
    public let direction: LumenTableSortDirection
    public init(key: String, direction: LumenTableSortDirection) { self.key = key; self.direction = direction }
    public static func next(_ sort: Self?, key: String) -> Self? {
        guard let sort, sort.key == key else { return Self(key: key, direction: .ascending) }
        return sort.direction == .ascending ? Self(key: key, direction: .descending) : nil
    }
}
public enum LumenTableModel {
    public static func isValid(columns: [LumenTableColumn], rows: [LumenTableRow]) -> Bool {
        Set(columns.map(\.key)).count == columns.count && Set(rows.map(\.id)).count == rows.count &&
            columns.allSatisfy { !$0.key.isEmpty } && rows.allSatisfy { !$0.id.isEmpty }
    }
    public static func toggling(_ row: LumenTableRow, selection: Set<String>) -> Set<String> {
        guard !row.isDisabled else { return selection }
        var next = selection
        if next.contains(row.id) { next.remove(row.id) } else { next.insert(row.id) }
        return next
    }
    public static func togglingVisible(_ rows: [LumenTableRow], selection: Set<String>) -> Set<String> {
        let available = rows.filter { !$0.isDisabled }
        let allSelected = available.allSatisfy { selection.contains($0.id) }
        var next = selection
        for row in available {
            if allSelected { next.remove(row.id) } else { next.insert(row.id) }
        }
        return next
    }
    public static func sorted(_ rows: [LumenTableRow], columns: [LumenTableColumn], sort: LumenTableSort?,
                              mode: LumenTableSortMode = .manual, locale: Locale = .current) -> [LumenTableRow] {
        guard mode == .client, let sort, columns.contains(where: { $0.key == sort.key && $0.sortable }) else { return rows }
        return rows.enumerated().sorted { left, right in
            let a = value(left.element, key: sort.key), b = value(right.element, key: sort.key)
            if a == .missing { return b == .missing ? left.offset < right.offset : false }
            if b == .missing { return true }
            let compared = compare(a, b, locale: locale)
            if compared == .orderedSame { return left.offset < right.offset }
            return sort.direction == .ascending ? compared == .orderedAscending : compared == .orderedDescending
        }.map(\.element)
    }
    private static func value(_ row: LumenTableRow, key: String) -> LumenTableSortValue {
        guard let cell = row.cells[key] else { return .missing }
        let value = cell.sortValue ?? .text(cell.text)
        if case let .number(number) = value, !number.isFinite { return .missing }
        return value
    }
    private static func compare(_ a: LumenTableSortValue, _ b: LumenTableSortValue, locale: Locale) -> ComparisonResult {
        let ranks = rank(a) - rank(b)
        if ranks != 0 { return ranks < 0 ? .orderedAscending : .orderedDescending }
        if case let .number(left) = a, case let .number(right) = b {
            return left == right ? .orderedSame : left < right ? .orderedAscending : .orderedDescending
        }
        if case let .boolean(left) = a, case let .boolean(right) = b {
            return left == right ? .orderedSame : left ? .orderedDescending : .orderedAscending
        }
        return text(a).compare(text(b), options: [.caseInsensitive, .diacriticInsensitive], locale: locale)
    }
    private static func rank(_ value: LumenTableSortValue) -> Int {
        switch value {
        case .number: 0
        case .boolean: 1
        case .text: 2
        case .missing: 3
        }
    }
    private static func text(_ value: LumenTableSortValue) -> String {
        switch value {
        case .text(let text): text
        case .number(let number): String(number)
        case .boolean(let value): value ? "true" : "false"
        case .missing: ""
        }
    }
}
#endif
