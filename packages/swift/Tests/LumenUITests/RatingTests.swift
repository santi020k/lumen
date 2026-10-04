#if os(iOS) || os(macOS) || os(visionOS)
import SwiftUI
import Testing
@testable import LumenUI

@Test func ratingClampsUntrustedLimitsAndValues() {
    #expect(LumenRatingModel(maximum: -1).maximum == 1)
    #expect(LumenRatingModel(maximum: Int.max).maximum == 100)
    #expect(LumenRatingModel().resolved(-1) == 0)
    #expect(LumenRatingModel().resolved(8) == 5)
    #expect(LumenRatingModel().resolved(3) == 3)
}

@Test @MainActor func ratingAcceptsControlledReadOnlyAndLocalizedLabels() {
    _ = LumenRating("Score", value: .constant(3), readOnly: true,
                    formatOption: { "\($0) of \($1)" })
}
#endif
