import Testing
@testable import LumenUI

@Test func comparisonPreservesSignedValuesAndPairedDomains() {
    let data = [LumenComparisonDatum(id: "a", label: "A", value: -10, reference: 80), LumenComparisonDatum(id: "b", label: "B", value: nil)]
    let paired = lumenComparisonModel(data, paired: true, domain: nil)
    #expect(paired.valid)
    #expect(paired.domain == -10...80)
    #expect(paired.position(-10) == 0)
    #expect(paired.position(80) == 1)
    #expect(lumenComparisonModel(data, paired: false, domain: nil).domain == -10...0)
}
@Test func comparisonRejectsInvalidIdentityAndTruncation() {
    let row = LumenComparisonDatum(id: "a", label: "A", value: 20)
    #expect(!lumenComparisonModel([row, row], paired: true, domain: nil).valid)
    #expect(!lumenComparisonModel([row], paired: false, domain: 1...20).valid)
    #expect(!lumenComparisonModel([.init(id: "a", label: " ", value: 0)], paired: false, domain: nil).valid)
    #expect(!lumenComparisonModel([.init(id: "a", label: "A", value: .nan)], paired: false, domain: nil).valid)
    let extreme = lumenComparisonModel([.init(id: "a", label: "A", value: .greatestFiniteMagnitude, reference: -.greatestFiniteMagnitude)], paired: true, domain: nil)
    #expect(extreme.valid)
    #expect(extreme.position(0) == 0.5)
}
