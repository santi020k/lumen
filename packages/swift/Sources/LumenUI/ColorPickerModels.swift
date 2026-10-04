import Foundation

public struct LumenRGBA: Equatable, Sendable {
    public var red: Int; public var green: Int; public var blue: Int; public var alpha: Double
    public init(red: Int, green: Int, blue: Int, alpha: Double = 1) {
        self.red = red; self.green = green; self.blue = blue; self.alpha = alpha
    }
    public var isValid: Bool { (0...255).contains(red) && (0...255).contains(green) && (0...255).contains(blue) && alpha.isFinite && (0...1).contains(alpha) }
}
public struct LumenHSVA: Equatable, Sendable {
    public var hue: Double; public var saturation: Double; public var value: Double; public var alpha: Double
    public init(hue: Double, saturation: Double, value: Double, alpha: Double = 1) {
        self.hue = hue; self.saturation = saturation; self.value = value; self.alpha = alpha
    }
}
public struct LumenColorSwatch: Identifiable, Equatable, Sendable {
    public let id: String; public let label: String; public let value: String; public let disabled: Bool
    public init(id: String, label: String, value: String, disabled: Bool = false) {
        self.id = id; self.label = label; self.value = value; self.disabled = disabled
    }
}
public enum LumenColor {
    public static func parse(_ input: String) -> LumenRGBA? {
        guard input.utf8.count <= 64 else { return nil }
        let text = input.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        if text.hasPrefix("#") {
            let digits = Array(text.dropFirst())
            guard [3, 4, 6, 8].contains(digits.count), digits.allSatisfy({ ("0"..."9").contains($0) || ("a"..."f").contains($0) }) else { return nil }
            let full = digits.count < 5 ? digits.flatMap { [$0, $0] } : digits
            let bytes = stride(from: 0, to: full.count, by: 2).compactMap { Int(String(full[$0...($0 + 1)]), radix: 16) }
            return LumenRGBA(red: bytes[0], green: bytes[1], blue: bytes[2], alpha: bytes.count == 4 ? Double(bytes[3]) / 255 : 1)
        }
        guard text.hasPrefix("rgba("), text.hasSuffix(")") else { return nil }
        let parts = text.dropFirst(5).dropLast().split(separator: ",", omittingEmptySubsequences: false).map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
        guard parts.count == 4 else { return nil }
        let numbers = parts.compactMap { part -> Double? in
            guard part.contains(where: { ("0"..."9").contains($0) }), part.filter({ $0 == "." }).count <= 1,
                  part.allSatisfy({ ("0"..."9").contains($0) || $0 == "." }), let number = Double(part), number.isFinite else { return nil }
            return number
        }
        guard numbers.count == 4, numbers.prefix(3).allSatisfy({ (0...255).contains($0) && $0.rounded() == $0 }), (0...1).contains(numbers[3]) else { return nil }
        return LumenRGBA(red: Int(numbers[0]), green: Int(numbers[1]), blue: Int(numbers[2]), alpha: numbers[3])
    }
    public static func format(_ color: LumenRGBA, allowAlpha: Bool = false) -> String? {
        guard color.isValid, allowAlpha || color.alpha == 1 else { return nil }
        let bytes = [color.red, color.green, color.blue] + (allowAlpha ? [Int((color.alpha * 255).rounded())] : [])
        return "#" + bytes.map { String(format: "%02x", $0) }.joined()
    }
    public static func hsva(_ color: LumenRGBA) -> LumenHSVA? {
        guard color.isValid else { return nil }
        let r = Double(color.red) / 255, g = Double(color.green) / 255, b = Double(color.blue) / 255
        let maximum = max(r, g, b), minimum = min(r, g, b), delta = maximum - minimum
        var hue = 0.0
        if delta > 0 {
            if maximum == r { hue = ((g - b) / delta).truncatingRemainder(dividingBy: 6) }
            else if maximum == g { hue = (b - r) / delta + 2 }
            else { hue = (r - g) / delta + 4 }
            hue = (hue * 60 + 360).truncatingRemainder(dividingBy: 360)
        }
        return LumenHSVA(hue: hue, saturation: maximum == 0 ? 0 : delta / maximum, value: maximum, alpha: color.alpha)
    }
    public static func rgba(_ color: LumenHSVA) -> LumenRGBA? {
        guard color.hue.isFinite, (0...360).contains(color.hue), [color.saturation, color.value, color.alpha].allSatisfy({ $0.isFinite && (0...1).contains($0) }) else { return nil }
        let hue = color.hue.truncatingRemainder(dividingBy: 360) / 60
        let c = color.value * color.saturation, x = c * (1 - abs(hue.truncatingRemainder(dividingBy: 2) - 1)), m = color.value - c
        let sectors = [[c,x,0], [x,c,0], [0,c,x], [0,x,c], [x,0,c], [c,0,x]]
        let channels = sectors[Int(hue)].map { Int((($0 + m) * 255).rounded()) }
        return LumenRGBA(red: channels[0], green: channels[1], blue: channels[2], alpha: color.alpha)
    }
}
