#if os(iOS) || os(macOS) || os(visionOS)
import SwiftUI
import Testing
@testable import LumenUI

@Test func stepProgressSupportsBoundariesAndCompletedWorkflows() {
    #expect(LumenStepState.resolve(index: 0, currentStep: -1, count: 3) == .current)
    #expect(LumenStepState.resolve(index: 1, currentStep: 1, count: 3) == .current)
    #expect(LumenStepState.resolve(index: 2, currentStep: 99, count: 3) == .complete)
    #expect(LumenStepState.resolve(index: 2, currentStep: 1, count: 3) == .upcoming)
}

@Test @MainActor func progressAndHistoryPublicContractsAcceptHostContent() {
    _ = LumenStepper("Workflow", steps: [], currentStep: 0, horizontal: true, formatState: { $0.rawValue })
    _ = LumenTimeline("History") {
        LumenTimelineItem { Text("Approved") }
        LumenTimelineItem(dot: { Text("!") }) { Button("Details") {} }
    }
    _ = LumenBreadcrumb("Location", items: [LumenBreadcrumbItem(id: "home", label: "Home")],
                        currentLabel: "Here", onNavigate: { _ in })
}
#endif
