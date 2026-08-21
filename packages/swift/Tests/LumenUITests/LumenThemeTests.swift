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
}

@Test func buttonMetricsPreserveNativeTouchTargets() {
    #expect(LumenButtonMetrics.resolve(.sm).minHeight == 36)
    #expect(LumenButtonMetrics.resolve(.md).minHeight == 44)
    #expect(LumenButtonMetrics.resolve(.lg).minHeight == 52)
}
