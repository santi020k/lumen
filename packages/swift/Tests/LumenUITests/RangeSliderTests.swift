// cspell:words Capacidad
#if os(iOS) || os(macOS) || os(visionOS)
import SwiftUI
import Testing
@testable import LumenUI

@Test func rangeSliderClampsAndKeepsEqualEndpoints() {
    let model = LumenRangeSliderModel(bounds: 0...100, step: 10)
    #expect(model.resolved(-20...120) == 0...100)
    #expect(model.resolved(24...76) == 20...80)
    #expect(model.resolved(30...30) == 30...30)
    #expect(model.resolved(-Double.infinity...Double.infinity) == 0...100)
}

@Test func rangeSliderEndpointsCannotCrossOrMutateTheOppositeEndpoint() {
    let model = LumenRangeSliderModel(bounds: 0...100, step: 10)
    #expect(model.replacingStart(90, in: 20...60) == 60...60)
    #expect(model.replacingEnd(0, in: 20...60) == 20...20)
    #expect(model.replacingStart(34, in: 20...60) == 30...60)
    #expect(model.replacingEnd(.nan, in: 20...60) == 20...60)
    #expect(model.replacingStart(.infinity, in: 20...60) == 20...60)
}

@Test func rangeSliderUsesTheFullDomainStepGrid() {
    let model = LumenRangeSliderModel(bounds: 5...96, step: 10)
    #expect(model.resolved(5...96) == 5...95)
    #expect(model.replacingEnd(34, in: 25...75) == 25...35)
    let continuous = LumenRangeSliderModel(bounds: -10...10, step: nil)
    #expect(continuous.resolved(-0.25...0.75) == -0.25...0.75)
    let coarse = LumenRangeSliderModel(bounds: 0...1, step: 10)
    #expect(coarse.resolved(0.2...0.8) == 0...1)
}

@Test @MainActor func rangeSliderPublicInitializerAcceptsLocalizedReadOnlyContent() {
    _ = LumenRangeSlider("Capacidad", value: .constant(20...80), in: 0...100,
        step: 10, readOnly: true, startLabel: "Mínimo", endLabel: "Máximo",
        formatValue: { "\(Int($0)) %" })
}
#endif
