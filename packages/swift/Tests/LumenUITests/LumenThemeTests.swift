import SwiftUI
import Testing
@testable import LumenUI

@Test func themesPreserveTheirRequestedScheme() {
    #expect(LumenTheme.light.scheme == .light)
    #expect(LumenTheme.dark.scheme == .dark)
}

@Test func foundationDimensionsUseNativePoints() {
    #expect(LumenSpacing.lg == 16)
    #expect(LumenRadius.md == 10)
    #expect(LumenMotion.standardDuration == 0.16)
    #expect(LumenMotion.standardEasing == LumenCubicBezier(x1: 0.32, y1: 0.72, x2: 0, y2: 1))
    #expect(LumenMotion.emphasizedEasing == LumenCubicBezier(x1: 0.22, y1: 1, x2: 0.36, y2: 1))
    #expect(LumenElevation.resting == 1)
    #expect(LumenElevation.raised == 3)
    #expect(LumenElevation.overlay == 6)
}

@Test func buttonMetricsAdaptToDesktopAndMobileInputs() {
    #expect(LumenButtonMetrics.resolve(.sm, density: .compact).minHeight == 28)
    #expect(LumenButtonMetrics.resolve(.md, density: .compact).minHeight == 32)
    #expect(LumenButtonMetrics.resolve(.lg, density: .compact).minHeight == 40)
    #expect(LumenButtonMetrics.resolve(.sm, density: .regular).minHeight == 36)
    #expect(LumenButtonMetrics.resolve(.md, density: .regular).minHeight == 44)
    #expect(LumenButtonMetrics.resolve(.lg, density: .regular).minHeight == 52)
}

@Test func iconMetricsStayConsistentAndAccessible() {
    #expect(LumenIconButtonMetrics.resolve(.sm, density: .compact).touchTarget == 28)
    #expect(LumenIconButtonMetrics.resolve(.md, density: .compact).touchTarget == 32)
    #expect(LumenIconButtonMetrics.resolve(.lg, density: .compact).touchTarget == 40)
    #expect(LumenIconButtonMetrics.resolve(.sm, density: .regular).iconSize == .sm)
    #expect(LumenIconButtonMetrics.resolve(.sm, density: .regular).touchTarget == 44)
    #expect(LumenIconButtonMetrics.resolve(.md, density: .regular).touchTarget == 44)
    #expect(LumenIconButtonMetrics.resolve(.lg, density: .regular).touchTarget == 52)
}

@Test func progressValuesAreFiniteAndClamped() {
    #expect(LumenProgressValue.resolve(value: 120, max: 100).value == 100)
    #expect(LumenProgressValue.resolve(value: -10, max: 0) == LumenProgressValue(max: 100, value: 0))
    #expect(LumenProgressValue.resolve(value: .nan, max: .nan) == LumenProgressValue(max: 100, value: 0))
}

@Test func avatarDimensionsMatchTheSharedContract() {
    #expect(LumenAvatarSize.sm.dimension == 32)
    #expect(LumenAvatarSize.md.dimension == 40)
    #expect(LumenAvatarSize.lg.dimension == 56)
}

#if os(iOS) || os(macOS)
@Test func sliderConfigurationRejectsInvalidSteps() {
    let bounds = 0.0...100.0

    #expect(LumenSliderConfiguration.resolve(bounds: bounds, step: 5).step == 5)
    #expect(LumenSliderConfiguration.resolve(bounds: bounds, step: 0).step == nil)
    #expect(LumenSliderConfiguration.resolve(bounds: bounds, step: -.infinity).step == nil)
    #expect(LumenSliderConfiguration.resolve(bounds: bounds, step: .nan).step == nil)
}
#endif

#if os(macOS)
@Test func shortcutsUseMacModifierGlyphsAndSpecialKeyNames() {
    let shortcut = LumenShortcut(
        keyCode: 123,
        modifiers: [.control, .shift]
    )

    #expect(shortcut.display == "⌃⇧←")
}

@Test func commonSymbolsHaveStableUniqueIdentifiers() {
    let symbols = LumenSymbolOption.common

    #expect(!symbols.isEmpty)
    #expect(Set(symbols.map(\.id)).count == symbols.count)
    #expect(symbols.allSatisfy { !$0.category.isEmpty && !$0.label.isEmpty && !$0.name.isEmpty })
}
#endif
