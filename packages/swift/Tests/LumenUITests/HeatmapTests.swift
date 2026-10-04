import Testing
@testable import LumenUI

@Test func heatmapPreservesMissingZeroAndTheFirstCoordinate() {
    let model = lumenHeatmapModel([
        .init(id: "a", column: "Mon", row: "AM", value: nil),
        .init(id: "b", column: "Tue", row: "AM", value: 0),
        .init(id: "duplicate", column: "Tue", row: "AM", value: 100),
        .init(id: "c", column: "Wed", row: "AM", value: -2)
    ], colorScale: .diverging, domain: nil, midpoint: 0)
    #expect(model.cells.map(\.value) == [nil, 0, -2])
    #expect(model.columns == ["Mon", "Tue", "Wed"])
    #expect(model.rows == ["AM"])
    #expect(model.domain == -2...2)
    #expect(model.midpointRatio == 0.5)
}

@Test func heatmapHonorsExplicitDomainAndRejectsAnInvalidDivergingExtent() {
    let data: [LumenHeatmapDatum] = [.init(id: "a", column: "Mon", row: "AM", value: 6)]
    let explicit = lumenHeatmapModel(data, colorScale: .diverging, domain: -2...6, midpoint: 0)
    #expect(explicit.domain == -2...6)
    #expect(explicit.midpointRatio == 0.25)
    let invalid = lumenHeatmapModel(data, colorScale: .diverging, domain: 1...5, midpoint: 0)
    #expect(invalid.domain.lowerBound == -invalid.domain.upperBound)
    #expect(lumenHeatmapRatio(-30, domain: explicit.domain) == 0)
    #expect(lumenHeatmapRatio(30, domain: explicit.domain) == 1)
}

@Test func heatmapKeepsExtremeAndConstantExtentsFinite() {
    let model = lumenHeatmapModel([
        .init(id: "a", column: "Mon", row: "AM", value: .greatestFiniteMagnitude)
    ], colorScale: .diverging, domain: nil, midpoint: 0)
    #expect(model.domain.lowerBound.isFinite)
    #expect(model.domain.upperBound.isFinite)
    #expect(model.midpointRatio == 0.5)
    let missing = lumenHeatmapModel([], colorScale: .sequential, domain: nil, midpoint: .nan)
    #expect(missing.domain == 0...1)
    #expect(missing.midpoint == 0)
}
