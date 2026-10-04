import Testing
@testable import LumenUI

@Test func bulletRangesAreOrderedAndSignedValuesKeepZero() {
    let ranges = [LumenBulletRange(end: 100, label: "Strong"), LumenBulletRange(end: 60, label: "Developing")]
    let model = lumenBulletModel(value: 72, target: 85, ranges: ranges, domain: nil)
    #expect(model.valid)
    #expect(model.domain == 0...100)
    #expect(model.ranges.map(\.start) == [0, 60])
    #expect(model.position(72) == 0.72)
    #expect(ranges.first?.end == 100)
    let signed = lumenBulletModel(value: -20, target: 40, ranges: [], domain: -40...60)
    #expect(signed.valid)
    #expect(signed.position(-20) == 0.2)
    #expect(signed.position(0) == 0.4)
}

@Test func bulletRejectsInvalidValuesAndAmbiguousOrTruncatedRanges() {
    let models = [
        lumenBulletModel(value: .nan, target: 80, ranges: [], domain: nil),
        lumenBulletModel(value: 20, target: .infinity, ranges: [], domain: nil),
        lumenBulletModel(value: 120, target: 80, ranges: [], domain: 0...100),
        lumenBulletModel(value: 70, target: 80, ranges: [], domain: 50...100),
        lumenBulletModel(value: 70, target: 80, ranges: [.init(end: 60, label: "A"), .init(end: 60, label: "B")], domain: nil),
        lumenBulletModel(value: 70, target: 80, ranges: [.init(end: 60, label: " ")], domain: nil)
    ]
    #expect(models.allSatisfy { !$0.valid && $0.ranges.isEmpty })
}

@Test func bulletPreservesMissingZeroAndExtremeDomains() {
    #expect(lumenBulletModel(value: nil, target: 80, ranges: [], domain: nil).valid)
    #expect(lumenBulletModel(value: 0, target: 0, ranges: [], domain: nil).domain == 0...1)
    let model = lumenBulletModel(value: -.greatestFiniteMagnitude, target: .greatestFiniteMagnitude, ranges: [], domain: nil)
    #expect(model.valid)
    #expect(model.position(0) == 0.5)
    #expect(model.ticks.allSatisfy { $0.isFinite })
}
