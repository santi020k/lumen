#if canImport(WidgetKit) && !os(tvOS) && !os(visionOS)
import SwiftUI
import Testing
import WidgetKit
@testable import LumenWidgetUI

@Test("semantic tones adapt across full-color, accented, and vibrant rendering")
func renderingModes() {
    #expect(resolveLumenWidgetColorChoice(tone: .danger, rendering: .fullColor) == .danger)
    #expect(resolveLumenWidgetColorChoice(tone: .danger, rendering: .accented) == .primary)
    #expect(resolveLumenWidgetColorChoice(tone: .success, rendering: .vibrant) == .primary)
    #expect(resolveLumenWidgetColorChoice(tone: .secondary, rendering: .accented) == .secondary)
}

@Test("increased contrast strengthens widget treatment borders")
func increasedContrast() {
    #expect(resolveLumenWidgetBorderWidth(increasedContrast: false) == 1)
    #expect(resolveLumenWidgetBorderWidth(increasedContrast: true) == 2)
}

@Test("widget components retain semantic fonts under accessibility text environments")
@MainActor
func accessibilityText() {
    let fixture = VStack {
        LumenWidgetText(.localized(LocalizedStringResource("Widget title")), style: .title)
        LumenWidgetBadge(.verbatim("Ready"), iconSystemName: "checkmark", tone: .success)
        LumenWidgetCompactStat(
            label: .verbatim("Duration"),
            value: .verbatim("01:15"),
            iconSystemName: "timer",
            tone: .accent
        )
    }
    .environment(\.dynamicTypeSize, .accessibility5)
    .environment(\.widgetRenderingMode, .accented)

    _ = fixture
}
#endif
