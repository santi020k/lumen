import SwiftUI
import Testing
@testable import LumenUI

@Test func funnelPreservesOrderMissingZeroAndExtremes() {
    let data: [LumenFunnelDatum] = [.init(id: "a", label: "A", value: 0), .init(id: "b", label: "B", value: nil), .init(id: "c", label: "C", value: .greatestFiniteMagnitude)]
    let model = lumenFunnelModel(data)
    #expect(model.valid)
    #expect(model.ratio(0) == 0)
    #expect(model.ratio(.greatestFiniteMagnitude) == 1)
    #expect(lumenFunnelModel([]).valid)
    #expect(lumenFunnelModel([.init(id: "a", label: "A", value: 0)]).ratio(0) == 0)
}
@Test func funnelRejectsInvalidMeasurementsAndIdentities() {
    for value in [-1.0, .nan, .infinity] { #expect(!lumenFunnelModel([.init(id: "a", label: "A", value: value)]).valid) }
    #expect(!lumenFunnelModel([.init(id: " ", label: "A", value: 1)]).valid)
    #expect(!lumenFunnelModel([.init(id: "a", label: " ", value: 1)]).valid)
    #expect(!lumenFunnelModel([.init(id: "a", label: "A", value: 1), .init(id: "a", label: "B", value: 2)]).valid)
    #expect(lumenFunnelModel([.init(id: "a", label: "A", value: 1), .init(id: "b", label: "A", value: 2)]).valid)
}
@Test func boxPlotKeepsSharedDomainOrderedStatisticsAndOutliers() {
    let row = LumenBoxPlotDatum(id: "a", label: "A", min: -8, q1: -3, median: 0, q3: 2, max: 8, outliers: [-20, 30])
    let model = lumenBoxPlotModel([row], domain: nil)
    #expect(model.valid)
    #expect(model.domain == -20...30)
    #expect(model.position(-20) == 0)
    #expect(model.position(30) == 1)
    #expect(!lumenBoxPlotModel([row], domain: -8...8).valid)
    #expect(lumenBoxPlotModel([], domain: nil).domain == 0...1)
    #expect(lumenBoxPlotModel([.init(id: "missing", label: "Missing", min: nil, q1: nil, median: nil, q3: nil, max: nil)], domain: nil).valid)
    let extreme = lumenBoxPlotModel([.init(id: "e", label: "Extreme", min: -.greatestFiniteMagnitude, q1: -1, median: 0, q3: 1, max: .greatestFiniteMagnitude)], domain: nil)
    #expect(extreme.valid)
    #expect(extreme.position(0) == 0.5)
    let constant = lumenBoxPlotModel([.init(id: "e", label: "Extreme", min: .greatestFiniteMagnitude, q1: .greatestFiniteMagnitude, median: .greatestFiniteMagnitude, q3: .greatestFiniteMagnitude, max: .greatestFiniteMagnitude)], domain: nil)
    #expect(constant.valid)
    #expect(constant.domain.lowerBound.isFinite)
    #expect(constant.domain.upperBound.isFinite)
}
@Test func boxPlotRejectsPartialUnorderedNonfiniteAndMissingOutliers() {
    #expect(!lumenBoxPlotModel([.init(id: "a", label: "A", min: 0, q1: 1, median: .nan, q3: 2, max: 3)], domain: nil).valid)
    #expect(!lumenBoxPlotModel([.init(id: "a", label: "A", min: 0, q1: nil, median: 1, q3: 2, max: 3)], domain: nil).valid)
    #expect(!lumenBoxPlotModel([.init(id: "a", label: "A", min: 0, q1: 2, median: 1, q3: 2, max: 3)], domain: nil).valid)
    #expect(!lumenBoxPlotModel([.init(id: "a", label: "A", min: 0, q1: 1, median: 1, q3: 2, max: 3, outliers: [.nan])], domain: nil).valid)
    #expect(!lumenBoxPlotModel([.init(id: "a", label: "A", min: nil, q1: nil, median: nil, q3: nil, max: nil, outliers: [1])], domain: nil).valid)
}
@Test func calendarValidatesDatesAndPreservesLeapDayMissingAndZero() {
    for date in ["2023-02-29", "2024-04-31", "2024-13-01", "0000-01-01", "2024-1-01", "2024-01-01T00:00:00Z"] { #expect(lumenCalendarDate(date) == nil) }
    #expect(lumenCalendarDate("2024-02-29") != nil)
    #expect(lumenCalendarDate("1582-10-10") != nil)
    #expect(lumenCalendarDate("0001-01-01") != nil)
    let model = lumenCalendarHeatmapModel([.init(date: "2024-02-29", value: 0)], startDate: "2024-02-28", endDate: "2024-03-01", weekStartsOn: 1, domain: nil)
    #expect(model.valid)
    #expect(model.cells.map(\.date) == ["2024-02-28", "2024-02-29", "2024-03-01"])
    #expect(model.cells[0].value == nil)
    #expect(model.cells[1].value == 0)
    #expect(model.cells[0].row == 2)
    #expect(model.weeks == 1)
    let historic = lumenCalendarHeatmapModel([], startDate: "1582-10-04", endDate: "1582-10-16", weekStartsOn: 1, domain: nil)
    #expect(historic.valid)
    #expect(historic.cells.count == 13)
    #expect(historic.cells[6].date == "1582-10-10")
    let maximumRange = lumenCalendarHeatmapModel([], startDate: "2000-01-01", endDate: "2010-01-07", weekStartsOn: 1, domain: nil)
    #expect(maximumRange.valid)
    #expect(maximumRange.cells.count == 3660)
    #expect(!lumenCalendarHeatmapModel([], startDate: "2000-01-01", endDate: "2010-01-08", weekStartsOn: 1, domain: nil).valid)
    let sunday = lumenCalendarHeatmapModel([], startDate: "2024-03-03", endDate: "2024-03-04", weekStartsOn: 0, domain: nil)
    #expect(sunday.cells[0].row == 0)
    #expect(sunday.cells[1].row == 1)
}
@Test func calendarRejectsDuplicatesTruncationAndExcessiveRanges() {
    let row = LumenCalendarHeatmapDatum(date: "2024-01-01", value: 2)
    #expect(!lumenCalendarHeatmapModel([row, row], startDate: "2024-01-01", endDate: "2024-01-02", weekStartsOn: 1, domain: nil).valid)
    #expect(!lumenCalendarHeatmapModel([row], startDate: "2024-01-02", endDate: "2024-01-03", weekStartsOn: 1, domain: nil).valid)
    #expect(!lumenCalendarHeatmapModel([row], startDate: "2024-01-01", endDate: "2024-01-02", weekStartsOn: 1, domain: 0...1).valid)
    #expect(!lumenCalendarHeatmapModel([], startDate: "2000-01-01", endDate: "2020-01-01", weekStartsOn: 1, domain: nil).valid)
    #expect(!lumenCalendarHeatmapModel([], startDate: "2024-01-02", endDate: "2024-01-01", weekStartsOn: 1, domain: nil).valid)
    #expect(!lumenCalendarHeatmapModel([], startDate: "2024-01-01", endDate: "2024-01-01", weekStartsOn: 2, domain: nil).valid)
    #expect(!lumenCalendarHeatmapModel([], startDate: "2024-01-01", endDate: "2024-01-01", weekStartsOn: 1, domain: nil, weekdayLabels: ["Mon"]).valid)
    #expect(!lumenCalendarHeatmapModel([.init(date: "2024-01-01", value: .infinity)], startDate: "2024-01-01", endDate: "2024-01-01", weekStartsOn: 1, domain: nil).valid)
}
@MainActor @Test func expandedChartsCompileWithLocalizedMissingData() {
    let labels = LumenChartLabels(notAvailable: "Sin datos", viewData: "Ver datos", invalidData: "Datos inválidos", value: "Valor", count: "Cantidad")
    _ = LumenFunnelChart(data: [.init(id: "a", label: "Inicio", value: nil)], label: "Proceso", labels: labels).body
    _ = LumenBoxPlot(data: [.init(id: "a", label: "Grupo", min: nil, q1: nil, median: nil, q3: nil, max: nil)], label: "Distribución", labels: labels, statisticLabels: .init(median: "Mediana")).body
    _ = LumenCalendarHeatmap(data: [], label: "Actividad", startDate: "2024-01-01", endDate: "2024-01-31", labels: labels, weekdayLabels: ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]).body

}

@Test func repeatedLabelsWithDistinctIdentitiesRemainValid() {
    #expect(lumenFunnelModel([
        .init(id: "a", label: "Stage", value: 1), .init(id: "b", label: "Stage", value: 2)
    ]).valid)
    #expect(lumenBoxPlotModel([
        .init(id: "a", label: "Team", min: 1, q1: 2, median: 3, q3: 4, max: 5),
        .init(id: "b", label: "Team", min: 1, q1: 2, median: 3, q3: 4, max: 5)
    ], domain: nil).valid)
}
