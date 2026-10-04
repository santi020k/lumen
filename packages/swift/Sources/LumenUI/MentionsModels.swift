import Foundation

public struct LumenMentionsSelection: Equatable, Sendable {
    public var start: Int; public var end: Int
    public init(start: Int, end: Int) { self.start = start; self.end = end }
}
public struct LumenMentionsValue: Equatable, Sendable {
    public var text: String; public var selection: LumenMentionsSelection
    public init(text: String, selection: LumenMentionsSelection) { self.text = text; self.selection = selection }
}
public struct LumenMentionOption: Identifiable, Equatable, Sendable {
    public let id: String; public let label: String; public let value: String; public let disabled: Bool
    public init(id: String, label: String, value: String, disabled: Bool = false) {
        self.id = id; self.label = label; self.value = value; self.disabled = disabled
    }
}
public struct LumenMentionQuery: Equatable, Sendable {
    public let start: Int; public let end: Int; public let query: String; public let trigger: String
}
public enum LumenMentionEngine {
    private static func word(_ unit: UInt16) -> Bool { (65...90).contains(unit) || (97...122).contains(unit) || (48...57).contains(unit) || unit == 95 }
    private static let boundaries = Set(" \t\n\r\u{000b}\u{000c}([{\"',;:!?".utf16)
    private static func boundary(_ units: [UInt16], _ offset: Int) -> Bool {
        offset == 0 || offset == units.count || !((0xD800...0xDBFF).contains(units[offset - 1]) && (0xDC00...0xDFFF).contains(units[offset]))
    }
    public static func isSelectionValid(_ value: LumenMentionsValue) -> Bool {
        let range = value.selection, units = Array(value.text.utf16)
        return range.start >= 0 && range.end >= range.start && range.end <= units.count && boundary(units, range.start) && boundary(units, range.end)
    }
    public static func query(_ value: LumenMentionsValue, trigger: String = "@") -> LumenMentionQuery? {
        guard isSelectionValid(value), value.selection.start == value.selection.end else { return nil }
        let prefix = Array(trigger.utf16)
        guard !prefix.isEmpty, prefix.count <= 8, prefix.allSatisfy({ (33...126).contains($0) && !word($0) }) else { return nil }
        let units = Array(value.text.utf16), end = value.selection.start
        var start = end
        while start > 0 && word(units[start - 1]) { start -= 1 }
        let tokenStart = start - prefix.count
        guard tokenStart >= 0, Array(units[tokenStart..<start]) == prefix,
              tokenStart == 0 || boundaries.contains(units[tokenStart - 1]) else { return nil }
        return LumenMentionQuery(start: tokenStart, end: end,
                                 query: String(decoding: units[start..<end], as: UTF16.self).lowercased(), trigger: trigger)
    }
    private static func valid(_ option: LumenMentionOption) -> Bool {
        !option.id.isEmpty && !option.value.isEmpty && option.value.utf16.count <= 128 && option.value.utf16.allSatisfy(word)
    }
    public static func options(_ options: [LumenMentionOption], query: LumenMentionQuery?) -> [LumenMentionOption] {
        guard let query else { return [] }
        var used = Set<String>()
        return options.filter { valid($0) && used.insert($0.id).inserted && $0.value.lowercased().hasPrefix(query.query) }
    }
    public static func inserting(_ option: LumenMentionOption, into value: LumenMentionsValue, trigger: String = "@") -> LumenMentionsValue? {
        guard let query = query(value, trigger: trigger), !option.disabled, valid(option), option.value.lowercased().hasPrefix(query.query) else { return nil }
        let units = Array(value.text.utf16)
        let before = Array(units[..<query.start]) + Array(trigger.utf16) + Array(option.value.utf16) + [32]
        return LumenMentionsValue(text: String(decoding: before + units[query.end...], as: UTF16.self),
                                 selection: .init(start: before.count, end: before.count))
    }
}
