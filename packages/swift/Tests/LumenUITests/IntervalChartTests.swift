import Testing
@testable import LumenUI

@Test func waterfallKeepsSignedBalancesAndExplicitResets() {
    let model = lumenWaterfallModel([
        .init(id: "opening", label: "Balance", value: 100, kind: .total),
        .init(id: "income", label: "Income", value: 40),
        .init(id: "cost", label: "Costs", value: -180),
        .init(id: "closing", label: "Balance", value: -40, kind: .total)
    ])
    #expect(model.valid)
    #expect(model.marks.map(\.start) == [0, 100, 140, 0])
    #expect(model.marks.map(\.end) == [100, 140, -40, -40])
    #expect(model.marks.map(\.tone) == [.series1, .series2, .series3, .series1])
}

@Test func waterfallRejectsInvalidStepsWithoutPartialBalances() {
    for data: [LumenWaterfallDatum] in [
        [.init(id: "a", label: "A", value: .nan)],
        [.init(id: "a", label: "A", value: .greatestFiniteMagnitude), .init(id: "b", label: "B", value: .greatestFiniteMagnitude)],
        [.init(id: "a", label: "A", value: 1), .init(id: "a", label: "A", value: 2)]
    ] {
        let model = lumenWaterfallModel(data)
        #expect(!model.valid)
        #expect(model.marks.isEmpty)
    }
    #expect(lumenWaterfallModel([]).valid)
}

@Test func histogramSortsBinsPreservesGapsAndRequiresDensityForUnequalWidths() {
    let bins: [LumenHistogramBin] = [.init(start: 20, end: 40, count: 10), .init(start: 0, end: 10, count: 5)]
    #expect(!lumenHistogramModel(bins, frequency: .count, tone: .series1, formatBoundary: { String($0) }).valid)
    let model = lumenHistogramModel(bins, frequency: .density, tone: .series2, formatBoundary: { "\($0) ms" })
    #expect(model.valid)
    #expect(model.marks.map(\.start) == [0, 20])
    #expect(model.marks.map(\.value) == [0.5, 0.5])
    #expect(model.marks.map(\.count) == [5, 10])
    #expect(model.marks.first?.label == "0.0 ms–10.0 ms")
    #expect(bins.first?.start == 20)
}

@Test func histogramRejectsOverlapsReversedBinsAndNegativeOrNonfiniteCounts() {
    for bins: [LumenHistogramBin] in [
        [.init(start: 0, end: 10, count: 2), .init(start: 5, end: 15, count: 3)],
        [.init(start: 0, end: 0, count: 2)],
        [.init(start: 10, end: 0, count: 2)],
        [.init(start: 0, end: 10, count: -1)],
        [.init(start: 0, end: 10, count: .infinity)],
        [.init(start: 0, end: .infinity, count: 1)]
    ] {
        let model = lumenHistogramModel(bins, frequency: .density, tone: .series1, formatBoundary: { String($0) })
        #expect(!model.valid)
        #expect(model.marks.isEmpty)
    }
    let zero = lumenHistogramModel([.init(start: 0, end: 10, count: 0)], frequency: .count, tone: .series1, formatBoundary: { String($0) })
    #expect(zero.valid)
    #expect(zero.marks.first?.value == 0)
}
