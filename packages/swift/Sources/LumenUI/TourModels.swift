import Foundation

public struct LumenTourStep: Equatable, Sendable, Identifiable {
    public let id: String
    public let targetId: String
    public let title: String
    public let content: String
    public let disabled: Bool
    public init(id: String, targetId: String, title: String, content: String, disabled: Bool = false) {
        self.id = id; self.targetId = targetId; self.title = title; self.content = content; self.disabled = disabled
    }
}
public struct LumenTourRect: Equatable, Sendable {
    public let x: Double
    public let y: Double
    public let width: Double
    public let height: Double
    public init(x: Double, y: Double, width: Double, height: Double) { self.x = x; self.y = y; self.width = width; self.height = height }
}
public struct LumenTourLayout: Equatable, Sendable { public let highlight: LumenTourRect?; public let panel: LumenTourRect }
public enum LumenTourDirection: Sendable { case next, previous }
public func isLumenTourStepsValid(_ steps: [LumenTourStep]) -> Bool {
    var ids = Set<String>()
    return steps.allSatisfy { !$0.id.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty && !$0.targetId.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty && ids.insert($0.id).inserted }
}
public func resolveLumenTourStep(_ steps: [LumenTourStep], index: Int) -> LumenTourStep? {
    guard isLumenTourStepsValid(steps), steps.indices.contains(index) else { return nil }
    return steps[index]
}
public func moveLumenTourStep(_ steps: [LumenTourStep], index: Int, direction: LumenTourDirection) -> Int? {
    guard let current = resolveLumenTourStep(steps, index: index), !current.disabled else { return nil }
    let delta = direction == .next ? 1 : -1
    var target = index + delta
    while steps.indices.contains(target) {
        if !steps[target].disabled { return target }
        target += delta
    }
    return nil
}
private func validTourRect(_ rect: LumenTourRect) -> Bool { [rect.x, rect.y, rect.width, rect.height].allSatisfy(\.isFinite) && rect.width > 0 && rect.height > 0 }
public func resolveLumenTourLayout(_ anchor: LumenTourRect?, viewport: LumenTourRect) -> LumenTourLayout? {
    guard validTourRect(viewport), viewport.width >= 48, viewport.height >= 48 else { return nil }
    let width = viewport.width; let height = viewport.height; let margin = 12.0
    let panelWidth = min(320, width - margin * 2); let panelHeight = min(240, height - margin * 2)
    var highlight: LumenTourRect?
    if let anchor, validTourRect(anchor) {
        let x = max(0, anchor.x); let y = max(0, anchor.y)
        let right = min(width, anchor.x + anchor.width); let bottom = min(height, anchor.y + anchor.height)
        if right > x && bottom > y { highlight = .init(x: x, y: y, width: right - x, height: bottom - y) }
    }
    if let target = highlight {
        let below = height - margin - target.y - target.height - 8; let above = target.y - margin - 8
        let available = max(below, above)
        if available >= 88 {
            let h = min(panelHeight, available)
            let y = below >= h ? target.y + target.height + 8 : target.y - 8 - h
            return .init(highlight: target, panel: .init(x: min(max(margin, target.x), width - margin - panelWidth), y: y, width: panelWidth, height: h))
        }
    }
    return .init(highlight: nil, panel: .init(x: (width - panelWidth) / 2, y: (height - panelHeight) / 2, width: panelWidth, height: panelHeight))
}
