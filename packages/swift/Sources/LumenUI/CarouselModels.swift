import Foundation

public struct LumenCarouselSlide: Identifiable, Equatable, Sendable {
    public let id: String
    public let label: String
    public init(id: String, label: String) { self.id = id; self.label = label }
}
public enum LumenCarouselState: Equatable, Sendable {
    case ready(index: Int, count: Int), empty, invalid
    public init(slides: [LumenCarouselSlide], index: Int) {
        guard !slides.isEmpty else { self = .empty; return }
        var ids = Set<String>()
        guard slides.allSatisfy({ !$0.id.isEmpty && ids.insert($0.id).inserted }), slides.indices.contains(index) else { self = .invalid; return }
        self = .ready(index: index, count: slides.count)
    }
    public func target(_ requested: Int) -> Int? {
        guard case let .ready(index, count) = self, (0..<count).contains(requested), requested != index else { return nil }
        return requested
    }
}
