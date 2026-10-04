import Foundation

public enum LumenRichTextFormat: String, CaseIterable, Equatable, Sendable {
    case bold, italic, underline
}
public struct LumenRichTextSpan: Equatable, Sendable {
    public var start: Int
    public var end: Int
    public var format: LumenRichTextFormat
    public init(start: Int, end: Int, format: LumenRichTextFormat) {
        self.start = start; self.end = end; self.format = format
    }
}
public struct LumenRichTextDocument: Equatable, Sendable {
    public var text: String
    public var spans: [LumenRichTextSpan]
    public init(text: String = "", spans: [LumenRichTextSpan] = []) { self.text = text; self.spans = spans }
    public func toggling(_ format: LumenRichTextFormat, selection: NSRange) -> Self {
        let length = text.utf16.count
        let start = min(length, max(0, selection.location))
        let end = min(length, start + min(length - start, max(0, selection.length)))
        guard start < end else { return self }
        var coverage = [Bool](repeating: false, count: length)
        for span in spans where span.format == format {
            let from = min(length, max(0, span.start))
            let to = min(length, max(from, span.end))
            for index in from..<to { coverage[index] = true }
        }
        let active = coverage[start..<end].allSatisfy { $0 }
        for index in start..<end { coverage[index] = !active }
        var result = spans.filter { $0.format != format }
        var from: Int?
        for index in 0...length {
            let marked = index < length && coverage[index]
            if marked && from == nil { from = index }
            if !marked, let beginning = from {
                result.append(.init(start: beginning, end: index, format: format)); from = nil
            }
        }
        return .init(text: text, spans: result)
    }
    public func replacing(_ value: String) -> Self {
        let old = Array(text.utf16), new = Array(value.utf16)
        var start = 0
        while start < old.count && start < new.count && old[start] == new[start] { start += 1 }
        var oldEnd = old.count, newEnd = new.count
        while oldEnd > start && newEnd > start && old[oldEnd - 1] == new[newEnd - 1] { oldEnd -= 1; newEnd -= 1 }
        let delta = newEnd - oldEnd
        return .init(text: value, spans: spans.compactMap { span in
            guard span.start >= 0, span.end > span.start, span.end <= old.count else { return nil }
            let from = span.start < start ? span.start : span.start >= oldEnd ? span.start + delta : start
            let to = span.end <= start ? span.end : span.end >= oldEnd ? span.end + delta : newEnd
            return to > from ? .init(start: from, end: to, format: span.format) : nil
        })
    }
}
