import Testing
@testable import LumenUI

private let tourSteps = [LumenTourStep(id: "a", targetId: "x", title: "A", content: "First"), LumenTourStep(id: "b", targetId: "x", title: "B", content: "Disabled", disabled: true), LumenTourStep(id: "c", targetId: "z", title: "C", content: "Last")]
@Test func tourIdentityBoundsAndDisabledNavigation() {
    #expect(isLumenTourStepsValid(tourSteps))
    #expect(resolveLumenTourStep(tourSteps + tourSteps, index: 0) == nil)
    #expect(resolveLumenTourStep(tourSteps, index: -1) == nil)
    #expect(resolveLumenTourStep(tourSteps, index: 3) == nil)
    #expect(moveLumenTourStep(tourSteps, index: 0, direction: .next) == 2)
    #expect(moveLumenTourStep(tourSteps, index: 2, direction: .previous) == 0)
    #expect(moveLumenTourStep(tourSteps, index: 2, direction: .next) == nil)
    #expect(moveLumenTourStep(tourSteps, index: 1, direction: .next) == nil)
    #expect(!isLumenTourStepsValid([.init(id: " ", targetId: "x", title: "", content: "")]))
}
@Test func tourClipsHighlightsAndKeepsPanelsInViewport() {
    let layout = resolveLumenTourLayout(.init(x: -10, y: 50, width: 120, height: 44), viewport: .init(x: 0, y: 0, width: 390, height: 640))
    #expect(layout?.highlight == .init(x: 0, y: 50, width: 110, height: 44))
    #expect(layout?.panel.y == 102)
    for width in [48.0, 100, 320, 390, 900] {
        for height in [48.0, 100, 250, 640] {
            for anchor in [nil, LumenTourRect(x: 2, y: 2, width: 20, height: 20), .init(x: 0, y: 0, width: width, height: height), .init(x: 2000, y: 2000, width: 44, height: 44), .init(x: .nan, y: 0, width: 1, height: 1)] {
                let result = resolveLumenTourLayout(anchor, viewport: .init(x: 0, y: 0, width: width, height: height))
                #expect(result != nil)
                if let panel = result?.panel { #expect(panel.x >= 0 && panel.y >= 0 && panel.x + panel.width <= width && panel.y + panel.height <= height) }
            }
        }
    }
    #expect(resolveLumenTourLayout(nil, viewport: .init(x: 0, y: 0, width: .infinity, height: 640)) == nil)
}
