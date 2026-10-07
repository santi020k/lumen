import Testing
import SwiftUI
@testable import LumenUI

@Test func tooltipGuardsDisabledAndMissingAccessibleContent() {
    #expect(lumenTooltipCanShow(label: "Help", text: "Context", enabled: true, disabled: false))
    #expect(!lumenTooltipCanShow(label: "Help", text: "Context", enabled: false, disabled: false))
    #expect(!lumenTooltipCanShow(label: "Help", text: "Context", enabled: true, disabled: true))
    #expect(!lumenTooltipCanShow(label: " \n", text: "Context", enabled: true, disabled: false))
    #expect(!lumenTooltipCanShow(label: "Help", text: " \n", enabled: true, disabled: false))
}
@MainActor @Test func tooltipControlledPopoverCompilesWithLocalizedLabels() {
    var presented = false
    let binding = Binding(get: { presented }, set: { presented = $0 })
    _ = LumenTooltip("More information", text: "Only synthetic project information", isPresented: binding, dismissLabel: "Close help")
    #expect(!presented)
    binding.wrappedValue = true
    #expect(presented)
    _ = LumenTooltip("More information", text: "Context", isPresented: binding, disabled: true)
    #expect(presented)
}
