import SwiftUI
import Testing
@testable import LumenUI

@Test func watchProgressValuesClampAndRejectInvalidInput() {
    #expect(LumenWatchProgressValue.resolve(12, maximum: 10) == .init(maximum: 10, value: 10))
    #expect(LumenWatchProgressValue.resolve(-2, maximum: 10) == .init(maximum: 10, value: 0))
    #expect(LumenWatchProgressValue.resolve(.nan, maximum: .infinity) == .init(maximum: 1, value: 0))
}

@Test func watchActionMetricsPreserveUsableBounds() {
    #expect(LumenWatchActionMetrics.resolve(dimension: 20, ringWidth: 1) == .init(dimension: 44, ringWidth: 2))
    #expect(LumenWatchActionMetrics.resolve(dimension: 120, ringWidth: 4) == .init(dimension: 120, ringWidth: 4))
    #expect(
        LumenWatchActionMetrics.resolve(dimension: .infinity, ringWidth: .nan)
            == .init(dimension: 120, ringWidth: 4)
    )
}

@Test func watchTonesUseCanonicalSemanticColors() {
    #expect(lumenWatchColor(LumenColors.light, tone: .brand) == LumenColors.light.brandSolid)
    #expect(lumenWatchColor(LumenColors.dark, tone: .danger) == LumenColors.dark.danger)
    #expect(lumenWatchColor(LumenColors.dark, tone: .neutral) == LumenColors.dark.inkMuted)
}
