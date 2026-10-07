#if os(iOS) || os(macOS) || os(visionOS)
import Testing
@testable import LumenUI

@Test func ratingParityZeroExactMaximumAndIntegerBounds() {
    for maximum in [Int.min, 0, 1, 5, 10, 100, Int.max] {
        let model = LumenRatingModel(maximum: maximum)
        #expect(model.maximum >= 1 && model.maximum <= 100)
        #expect(model.resolved(0) == 0)
        #expect(model.resolved(Int.min) == 0)
        #expect(model.resolved(model.maximum) == model.maximum)
        #expect(model.resolved(Int.max) == model.maximum)
    }
}
#endif
