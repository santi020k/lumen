import Foundation

/// A Gregorian civil day, independent of time zones and daylight-saving transitions.
public struct LumenCalendarDay: Equatable, Hashable, Comparable, Sendable {
    public let year: Int
    public let month: Int
    public let day: Int
    public init?(year: Int, month: Int, day: Int) {
        guard (1...9999).contains(year), (1...12).contains(month), (1...Self.daysInMonth(year, month)).contains(day) else { return nil }
        self.year = year; self.month = month; self.day = day
    }
    public init?(key: String) {
        guard key.utf8.count == 10 else { return nil }
        let parts = key.split(separator: "-", omittingEmptySubsequences: false)
        guard parts.count == 3, parts[0].count == 4, parts[1].count == 2, parts[2].count == 2,
              key.utf8.allSatisfy({ $0 == 45 || (48...57).contains($0) }),
              let year = Int(parts[0]), let month = Int(parts[1]), let day = Int(parts[2]) else { return nil }
        self.init(year: year, month: month, day: day)
    }
    public var key: String { String(format: "%04d-%02d-%02d", year, month, day) }
    public static func < (lhs: Self, rhs: Self) -> Bool { lhs.ordinal < rhs.ordinal }
    public static func daysInMonth(_ year: Int, _ month: Int) -> Int {
        if month == 2 { return year % 4 == 0 && (year % 100 != 0 || year % 400 == 0) ? 29 : 28 }
        return [4, 6, 9, 11].contains(month) ? 30 : 31
    }
    public var ordinal: Int {
        let y = year - 1
        return 365 * y + y / 4 - y / 100 + y / 400 + (1..<month).reduce(0) { $0 + Self.daysInMonth(year, $1) } + day - 1
    }
    public func addingDays(_ amount: Int) -> Self? {
        let (target, overflow) = ordinal.addingReportingOverflow(amount)
        guard !overflow, (0...3652058).contains(target) else { return nil }
        var low = 1; var high = 9999
        while low < high {
            let middle = (low + high + 1) / 2
            let y = middle - 1
            if 365 * y + y / 4 - y / 100 + y / 400 <= target { low = middle } else { high = middle - 1 }
        }
        let y = low - 1
        var remaining = target - (365 * y + y / 4 - y / 100 + y / 400)
        var month = 1
        while remaining >= Self.daysInMonth(low, month) { remaining -= Self.daysInMonth(low, month); month += 1 }
        return Self(year: low, month: month, day: remaining + 1)
    }
    public func addingMonths(_ amount: Int) -> Self? {
        let (index, overflow) = ((year - 1) * 12 + month - 1).addingReportingOverflow(amount)
        guard !overflow, (0..<(9999 * 12)).contains(index) else { return nil }
        let y = index / 12 + 1; let m = index % 12 + 1
        return Self(year: y, month: m, day: min(day, Self.daysInMonth(y, m)))
    }
    public var monthStart: Self { Self(year: year, month: month, day: 1) ?? self }
    public func grid(firstWeekday: Int = 1) -> [Self?] {
        guard (0...6).contains(firstWeekday) else { return [] }
        let first = monthStart
        let offset = ((first.ordinal + 1) % 7 - firstWeekday + 7) % 7
        return (0..<42).map { first.addingDays($0 - offset) }
    }
    public func isSelectable(min: Self? = nil, max: Self? = nil) -> Bool {
        if let min, let max, min > max { return false }
        return (min == nil || self >= (min ?? self)) && (max == nil || self <= (max ?? self))
    }
}

public struct LumenCalendarEvent: Equatable, Sendable, Identifiable {
    public let id: String
    public let label: String
    public let startDay: LumenCalendarDay
    public let endDay: LumenCalendarDay
    public let detail: String?
    public let disabled: Bool
    public init(id: String, label: String, startDay: LumenCalendarDay, endDay: LumenCalendarDay? = nil, detail: String? = nil, disabled: Bool = false) {
        self.id = id; self.label = label; self.startDay = startDay; self.endDay = endDay ?? startDay; self.detail = detail; self.disabled = disabled
    }
    public func contains(_ day: LumenCalendarDay) -> Bool { !id.isEmpty && day.isSelectable(min: startDay, max: endDay) }
}
