import Foundation

/// A same-day wall-clock value. Dates, time zones and overnight scheduling belong to the application.
public struct LumenTimeSelection: Equatable, Sendable {
    public let hour: Int
    public let minute: Int

    public init(hour: Int, minute: Int) {
        precondition((0...23).contains(hour) && (0...59).contains(minute), "Invalid wall-clock time")
        self.hour = hour
        self.minute = minute
    }

    var minutes: Int { hour * 60 + minute }

    func isInBounds(min: Self?, max: Self?) -> Bool {
        (min == nil || minutes >= (min?.minutes ?? 0)) && (max == nil || minutes <= (max?.minutes ?? 1439))
    }

    var date: Date {
        var calendar = Calendar(identifier: .gregorian)
        calendar.timeZone = .current
        return calendar.date(from: DateComponents(year: 2000, month: 1, day: 1, hour: hour, minute: minute)) ?? Date(timeIntervalSince1970: 0)
    }

    init(date: Date) {
        self.init(hour: Calendar.current.component(.hour, from: date), minute: Calendar.current.component(.minute, from: date))
    }
}

func normalizeLumenNumericOTP(_ proposal: String, length: Int) -> String? {
    precondition((1...12).contains(length), "OTP length must be between 1 and 12")
    guard proposal.utf16.count <= 128 else { return nil }
    var result = ""
    for character in proposal {
        if character.unicodeScalars.count == 1,
           character.unicodeScalars.first?.properties.generalCategory == .decimalNumber,
           let digit = character.wholeNumberValue {
            result.append(String(digit))
        } else if character != "-" && !character.isWhitespace {
            return nil
        }
        if result.count > length { return nil }
    }
    return result
}

// Decimal coefficients use bounded base-ten digit arrays, retaining the same 128-character
// contract as Compose without narrowing values to Foundation Decimal's precision or Double.
struct LumenExactDecimal: Equatable {
    var digits: [Int]
    var negative: Bool
    let scale: Int

    init(digits: [Int], negative: Bool, scale: Int) {
        var normalized = digits
        while normalized.count > 1 && normalized.first == 0 { normalized.removeFirst() }
        self.digits = normalized.isEmpty ? [0] : normalized
        self.negative = negative && self.digits != [0]
        self.scale = scale
    }

    func aligned(to scale: Int) -> [Int] { digits + Array(repeating: 0, count: scale - self.scale) }

    func compared(to other: Self) -> Int {
        if negative != other.negative { return negative ? -1 : 1 }
        let scale = max(scale, other.scale)
        let left = Self(digits: aligned(to: scale), negative: false, scale: scale).digits
        let right = Self(digits: other.aligned(to: scale), negative: false, scale: scale).digits
        let magnitude = left == right ? 0 : left.count == right.count ? (left.lexicographicallyPrecedes(right) ? -1 : 1) : (left.count < right.count ? -1 : 1)
        return negative ? -magnitude : magnitude
    }

    func adding(_ other: Self) -> Self {
        let scale = max(scale, other.scale)
        let left = aligned(to: scale)
        let right = other.aligned(to: scale)
        if negative == other.negative {
            return Self(digits: Self.addMagnitude(left, right), negative: negative, scale: scale)
        }
        let leftValue = Self(digits: left, negative: false, scale: scale)
        let rightValue = Self(digits: right, negative: false, scale: scale)
        if leftValue.compared(to: rightValue) >= 0 {
            return Self(digits: Self.subtractMagnitude(left, right), negative: negative, scale: scale)
        }
        return Self(digits: Self.subtractMagnitude(right, left), negative: other.negative, scale: scale)
    }

    private static func addMagnitude(_ left: [Int], _ right: [Int]) -> [Int] {
        let left = Array(left.reversed())
        let right = Array(right.reversed())
        var result: [Int] = []
        var carry = 0
        for index in 0..<max(left.count, right.count) {
            let sum = (index < left.count ? left[index] : 0) + (index < right.count ? right[index] : 0) + carry
            result.append(sum % 10)
            carry = sum / 10
        }
        if carry > 0 { result.append(carry) }
        return result.reversed()
    }

    private static func subtractMagnitude(_ left: [Int], _ right: [Int]) -> [Int] {
        let left = Array(left.reversed())
        let right = Array(right.reversed())
        var result: [Int] = []
        var borrow = 0
        for index in left.indices {
            let difference = left[index] - (index < right.count ? right[index] : 0) - borrow
            result.append(difference < 0 ? difference + 10 : difference)
            borrow = difference < 0 ? 1 : 0
        }
        return result.reversed()
    }

    func formatted(locale: Locale) -> String {
        let formatter = NumberFormatter()
        formatter.locale = locale
        formatter.usesGroupingSeparator = false
        let alphabet = (0...9).map { formatter.string(from: NSNumber(value: $0)) ?? String($0) }
        let padded = Array(repeating: 0, count: max(0, scale + 1 - digits.count)) + digits
        let split = padded.count - scale
        var fraction = Array(padded[split...])
        while fraction.last == 0 { fraction.removeLast() }
        let integer = padded[..<split].map { alphabet[$0] }.joined()
        let decimals = fraction.map { alphabet[$0] }.joined()
        return (negative ? formatter.minusSign ?? "-" : "") + integer + (decimals.isEmpty ? "" : (formatter.decimalSeparator ?? ".") + decimals)
    }
}

enum LumenDecimalDraft: Equatable {
    case empty, incomplete, invalid
    case valid(LumenExactDecimal)
}

func parseLumenDecimalDraft(_ value: String, locale: Locale) -> LumenDecimalDraft {
    if value.isEmpty { return .empty }
    guard value.utf16.count <= 128 else { return .invalid }
    let formatter = NumberFormatter()
    formatter.locale = locale
    let separator = formatter.decimalSeparator ?? "."
    let minus = formatter.minusSign ?? "-"
    var digits: [Int] = []
    let sign = !minus.isEmpty && value.hasPrefix(minus) ? minus : "-"
    let negative = value.hasPrefix(sign)
    let unsigned = value.dropFirst(negative ? sign.count : 0)
    var decimalSeen = false
    var lastWasDecimal = false
    var scale = 0
    for character in unsigned {
        if character.unicodeScalars.count == 1,
           character.unicodeScalars.first?.properties.generalCategory == .decimalNumber,
           let digit = character.wholeNumberValue {
            digits.append(digit)
            if decimalSeen { scale += 1 }
            lastWasDecimal = false
        } else if String(character) == separator && !decimalSeen {
            decimalSeen = true
            lastWasDecimal = true
        } else { return .invalid }
    }
    if digits.isEmpty || lastWasDecimal { return .incomplete }
    return .valid(LumenExactDecimal(digits: digits, negative: negative, scale: scale))
}

struct LumenNumberConfiguration {
    let min: LumenExactDecimal?
    let max: LumenExactDecimal?
    let step: LumenExactDecimal

    init(min: String?, max: String?, step: String) {
        func configuration(_ value: String) -> LumenExactDecimal {
            precondition(value.utf8.allSatisfy { (48...57).contains($0) || $0 == 45 || $0 == 46 },
                         "Number configuration must use ASCII digits")
            guard case let .valid(decimal) = parseLumenDecimalDraft(value, locale: Locale(identifier: "en_US_POSIX")) else {
                preconditionFailure("Number configuration must be a complete ungrouped decimal of at most 128 characters")
            }
            return decimal
        }
        self.min = min.map(configuration)
        self.max = max.map(configuration)
        self.step = configuration(step)
        precondition(!self.step.negative && self.step.digits != [0], "Step must be positive")
        if let min = self.min, let max = self.max { precondition(min.compared(to: max) <= 0, "Minimum exceeds maximum") }
    }

    func contains(_ value: LumenExactDecimal) -> Bool {
        (min == nil || min.map { value.compared(to: $0) >= 0 } == true) && (max == nil || max.map { value.compared(to: $0) <= 0 } == true)
    }

    func stepped(_ draft: LumenDecimalDraft, direction: Int, locale: Locale) -> String? {
        let start: LumenExactDecimal
        switch draft {
        case let .valid(value): start = value
        case .empty: start = min ?? max.flatMap { $0.negative ? $0 : nil } ?? LumenExactDecimal(digits: [0], negative: false, scale: 0)
        default: return nil
        }
        let delta = LumenExactDecimal(digits: step.digits, negative: direction < 0, scale: step.scale)
        var result = start.adding(delta)
        if let min, result.compared(to: min) < 0 { result = min }
        if let max, result.compared(to: max) > 0 { result = max }
        let formatted = result.formatted(locale: locale)
        return formatted.utf16.count <= 128 ? formatted : nil
    }
}
