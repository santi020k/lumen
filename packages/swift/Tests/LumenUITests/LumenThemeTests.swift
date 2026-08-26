import SwiftUI
import Testing
@testable import LumenUI

@Test func themesPreserveTheirRequestedScheme() {
    #expect(LumenTheme.light.scheme == .light)
    #expect(LumenTheme.dark.scheme == .dark)
}

@Test func productPalettesAndAppearanceOwnershipRemainApplicationControlled() {
    let defaults = LumenColors.light
    let productPalette = LumenColorPalette(
        canvas: defaults.canvas,
        surface: defaults.surface,
        surfaceMuted: defaults.surfaceMuted,
        surfaceStrong: defaults.surfaceStrong,
        line: defaults.line,
        ink: defaults.ink,
        inkSoft: defaults.inkSoft,
        inkMuted: defaults.inkMuted,
        brand: .red,
        brandSolid: defaults.brandSolid,
        brandSoft: defaults.brandSoft,
        onBrand: defaults.onBrand,
        accent: defaults.accent,
        success: defaults.success,
        warning: defaults.warning,
        danger: defaults.danger,
        onDanger: defaults.onDanger
    )
    let productTheme = LumenTheme(colors: productPalette, scheme: .light)

    #expect(productTheme.colors.brand == .red)
    #expect(productTheme.resolvedPreferredColorScheme(enforceColorScheme: true) == .light)
    #expect(productTheme.resolvedPreferredColorScheme(enforceColorScheme: false) == nil)
}

@Test func foundationDimensionsUseNativePoints() {
    #expect(LumenSpacing.lg == 16)
    #expect(LumenRadius.md == 10)
    #expect(LumenMotion.standardDuration == 0.16)
    #expect(LumenMotion.standardEasing == LumenCubicBezier(x1: 0.32, y1: 0.72, x2: 0, y2: 1))
    #expect(LumenMotion.emphasizedEasing == LumenCubicBezier(x1: 0.22, y1: 1, x2: 0.36, y2: 1))
    #expect(LumenElevation.resting == 1)
    #expect(LumenElevation.raised == 3)
    #expect(LumenElevation.overlay == 6)
}

@Test func chartFoundationsMatchSharedLightAndDarkTokens() {
    #expect(LumenChartColors.light.series1 == LumenColors.light.brand)
    #expect(LumenChartColors.dark.series1 == LumenColors.dark.brand)
    #expect(LumenChartMetrics.seriesStrokeWidth == 2)
    #expect(LumenChartMetrics.areaOpacity == 0.18)
}

@Test func chartSummariesReportAvailableAndMissingValues() {
    let series = LumenChartSeries(
        id: "views",
        label: "Views",
        data: [
            LumenChartDatum(id: "a", x: .category("A"), y: 2),
            LumenChartDatum(id: "b", x: .category("B"), y: nil),
            LumenChartDatum(id: "c", x: .category("C"), y: 8)
        ]
    )
    let summary = LumenChartSummary.resolve(series: [series])

    #expect(summary.availablePointCount == 2)
    #expect(summary.missingPointCount == 1)
    #expect(summary.minimum == 2)
    #expect(summary.maximum == 8)
    #expect(summary.spokenDescription.contains("1 missing value"))
}

@Test func chartSummariesTreatNonfiniteAndEmptyValuesAsMissing() {
    let nonfinite = LumenChartSeries(
        id: "quality",
        label: "Quality",
        data: [
            LumenChartDatum(id: "negative", x: .number(-1), y: -8),
            LumenChartDatum(id: "nan", x: .number(0), y: .nan),
            LumenChartDatum(id: "infinite", x: .number(1), y: .infinity)
        ]
    )
    let summary = LumenChartSummary.resolve(series: [nonfinite])
    let empty = LumenChartSummary.resolve(series: [])

    #expect(summary.availablePointCount == 1)
    #expect(summary.missingPointCount == 2)
    #expect(summary.minimum == -8)
    #expect(summary.maximum == -8)
    #expect(empty.spokenDescription == "No chart data available.")
}

@MainActor
@Test func everyChartAcceptsMissingDataAndReadableFallbackConfiguration() {
    let series = LumenChartSeries(
        id: "values",
        label: "Values",
        data: [LumenChartDatum(id: "missing", x: .category("Missing"), y: nil)]
    )
    let range = [LumenRangeDatum(id: "range", x: .category("Today"), low: nil, high: 10)]
    let heatmap = [LumenHeatmapDatum(id: "cell", column: "Mon", row: "AM", value: nil)]
    let selection = Binding<LumenChartSelection?>.constant(nil)

    _ = LumenSparkline(label: "Trend", values: [])
    _ = LumenLineChart(label: "Line", series: [series], selection: selection)
    _ = LumenBarChart(label: "Bar", series: [series], selection: selection)
    _ = LumenPieChart(label: "Pie", series: series, selection: selection)
    _ = LumenScatterChart(label: "Scatter", series: [series], selection: selection)
    _ = LumenRangeChart(label: "Range", data: range, showData: true)
    _ = LumenHeatmap(label: "Heatmap", data: heatmap, showData: true)
    _ = LumenComboChart(label: "Combo", series: [series], selection: selection)
}

@Test func heatmapsOmitUnavailableMarksWhileKeepingSourceDataReadable() {
    let data = [
        LumenHeatmapDatum(id: "finite", column: "Mon", row: "AM", value: 8),
        LumenHeatmapDatum(id: "missing", column: "Tue", row: "AM", value: nil),
        LumenHeatmapDatum(id: "infinite", column: "Wed", row: "AM", value: .infinity)
    ]

    #expect(lumenAvailableHeatmapData(data).map(\.id) == ["finite"])
}

@Test func scatterDataLabelsExposeBubbleSize() {
    let series = LumenChartSeries(id: "quality", label: "Quality", data: [])
    let datum = LumenChartDatum(id: "aug", x: .number(1), y: 98, size: 64)

    #expect(lumenChartDataLabel(series: series, datum: datum, includeSize: true).contains("Size: 64"))
}

@Test func lineAndRangeChartsSplitAtMissingCategories() {
    let categories: [LumenChartX] = [.category("Monday"), .category("Tuesday"), .category("Wednesday")]
    let series = LumenChartSeries(
        id: "temperature",
        label: "Temperature",
        data: [
            LumenChartDatum(id: "mon", x: categories[0], y: 4),
            LumenChartDatum(id: "tue", x: categories[1], y: nil),
            LumenChartDatum(id: "wed", x: categories[2], y: 8)
        ]
    )
    let ranges = [
        LumenRangeDatum(id: "mon", x: categories[0], low: 2, high: 6),
        LumenRangeDatum(id: "tue", x: categories[1], low: nil, high: 7),
        LumenRangeDatum(id: "wed", x: categories[2], low: 5, high: 10)
    ]

    #expect(
        lumenSegmentedLineData(series: series, categories: categories).map(\.segmentID)
            == ["temperature:0", "temperature:1"]
    )
    #expect(lumenSegmentedRangeData(ranges).map(\.segmentID) == ["range:0", "range:1"])
}

@Test func chartCategoriesAlignSparseSeriesByIdentity() {
    let january = LumenChartX.category("January")
    let february = LumenChartX.category("February")
    let revenue = LumenChartSeries(
        id: "revenue",
        label: "Revenue",
        data: [
            LumenChartDatum(id: "jan", x: january, y: 10),
            LumenChartDatum(id: "feb", x: february, y: 20)
        ],
        mark: .bar
    )
    let margin = LumenChartSeries(
        id: "margin",
        label: "Margin",
        data: [LumenChartDatum(id: "feb-margin", x: february, y: 5)],
        mark: .line
    )

    #expect(lumenChartCategories([revenue, margin]) == [january, february])
    #expect(
        lumenSegmentedLineData(series: margin, categories: [january, february]).map(\.point.id)
            == ["feb-margin"]
    )
}

@Test func buttonMetricsAdaptToDesktopAndMobileInputs() {
    #expect(LumenButtonMetrics.resolve(.sm, density: .compact).minHeight == 28)
    #expect(LumenButtonMetrics.resolve(.md, density: .compact).minHeight == 32)
    #expect(LumenButtonMetrics.resolve(.lg, density: .compact).minHeight == 40)
    #expect(LumenButtonMetrics.resolve(.sm, density: .regular).minHeight == 36)
    #expect(LumenButtonMetrics.resolve(.md, density: .regular).minHeight == 44)
    #expect(LumenButtonMetrics.resolve(.lg, density: .regular).minHeight == 52)
}

@Test func iconMetricsStayConsistentAndAccessible() {
    #expect(LumenIconButtonMetrics.resolve(.sm, density: .compact).touchTarget == 28)
    #expect(LumenIconButtonMetrics.resolve(.md, density: .compact).touchTarget == 32)
    #expect(LumenIconButtonMetrics.resolve(.lg, density: .compact).touchTarget == 40)
    #expect(LumenIconButtonMetrics.resolve(.sm, density: .regular).iconSize == .sm)
    #expect(LumenIconButtonMetrics.resolve(.sm, density: .regular).touchTarget == 44)
    #expect(LumenIconButtonMetrics.resolve(.md, density: .regular).touchTarget == 44)
    #expect(LumenIconButtonMetrics.resolve(.lg, density: .regular).touchTarget == 52)
}

@Test func sharedIconCatalogHasStableUniqueNames() {
    let icons = LumenIconName.allCases

    #expect(icons.count == 2_350)
    #expect(Set(icons.map(\.rawValue)).count == icons.count)
    #expect(icons.filter { $0.rawValue.hasPrefix("brand:") }.count == 573)
    #expect(icons.contains(.search))
    #expect(icons.contains(.settings))
    #expect(icons.contains(.brandGithub))
}

@Test func progressValuesAreFiniteAndClamped() {
    #expect(LumenProgressValue.resolve(value: 120, max: 100).value == 100)
    #expect(LumenProgressValue.resolve(value: -10, max: 0) == LumenProgressValue(max: 100, value: 0))
    #expect(LumenProgressValue.resolve(value: .nan, max: .nan) == LumenProgressValue(max: 100, value: 0))
}

@Test func avatarDimensionsMatchTheSharedContract() {
    #expect(LumenAvatarSize.sm.dimension == 32)
    #expect(LumenAvatarSize.md.dimension == 40)
    #expect(LumenAvatarSize.lg.dimension == 56)
}

@Test func navigationBadgesCapVisibleCountsAndRetainAccessibleValues() {
    let badge = LumenNavigationBadge.count(128)

    #expect(badge.displayText == "99+")
    #expect(badge.spokenLabel == "128 new items")
    #expect(LumenNavigationBadge.dot().displayText == nil)
}

@Test func navigationSelectionSeparatesChangesFromReselection() {
    var changes: [String] = []
    var reselectionEvents: [String] = []

    dispatchLumenNavigationSelection(
        itemValue: "search",
        selectedValue: "home",
        onValueChange: { changes.append($0) },
        onReselect: { reselectionEvents.append($0) }
    )
    dispatchLumenNavigationSelection(
        itemValue: "home",
        selectedValue: "home",
        onValueChange: { changes.append($0) },
        onReselect: { reselectionEvents.append($0) }
    )

    #expect(changes == ["search"])
    #expect(reselectionEvents == ["home"])
}

@Test func graphicDimensionsMatchTheSharedContract() {
    #expect(LumenGraphicSize.sm.dimension == 160)
    #expect(LumenGraphicSize.md.dimension == 240)
    #expect(LumenGraphicSize.lg.dimension == 320)
}

@Test func backdropAndIllustrationMetricsMatchTheSharedContract() {
    #expect(LumenBackdropIntensity.subtle.opacity == 0.4)
    #expect(LumenBackdropIntensity.medium.opacity == 0.68)
    #expect(LumenBackdropIntensity.strong.opacity == 1)
    #expect(LumenIllustrationSize.sm.dimension == 96)
    #expect(LumenIllustrationSize.md.dimension == 128)
    #expect(LumenIllustrationSize.lg.dimension == 176)
}

@Test func imagePresentationUsesSharedFitAndRadiusContracts() {
    #expect(LumenImageFit.contain.contentMode == .fit)
    #expect(LumenImageFit.cover.contentMode == .fill)
    #expect(LumenImageRadius.none.value == 0)
    #expect(LumenImageRadius.sm.value == LumenRadius.sm)
    #expect(LumenImageRadius.md.value == LumenRadius.md)
    #expect(LumenImageRadius.lg.value == LumenRadius.lg)
    #expect(LumenImageRadius.full.value == LumenRadius.full)
}

#if os(iOS) || os(macOS)
@Test func sliderConfigurationRejectsInvalidSteps() {
    let bounds = 0.0...100.0

    #expect(LumenSliderConfiguration.resolve(bounds: bounds, step: 5).step == 5)
    #expect(LumenSliderConfiguration.resolve(bounds: bounds, step: 0).step == nil)
    #expect(LumenSliderConfiguration.resolve(bounds: bounds, step: -.infinity).step == nil)
    #expect(LumenSliderConfiguration.resolve(bounds: bounds, step: .nan).step == nil)
}

@Test func dateFieldBoundsClampValuesWithoutChangingUnboundedDates() {
    let lowerBound = Date(timeIntervalSince1970: 1_000)
    let upperBound = Date(timeIntervalSince1970: 2_000)
    let before = Date(timeIntervalSince1970: 500)
    let after = Date(timeIntervalSince1970: 2_500)

    #expect(LumenDateFieldBounds.closed(lowerBound...upperBound).clamped(before) == lowerBound)
    #expect(LumenDateFieldBounds.closed(lowerBound...upperBound).clamped(after) == upperBound)
    #expect(LumenDateFieldBounds.from(lowerBound).clamped(before) == lowerBound)
    #expect(LumenDateFieldBounds.through(upperBound).clamped(after) == upperBound)
    #expect(LumenDateFieldBounds.unbounded.clamped(after) == after)
}

@Test func dateRangesClampBothValuesAndPreventAnEndBeforeTheStart() {
    let lowerBound = Date(timeIntervalSince1970: 1_000)
    let upperBound = Date(timeIntervalSince1970: 2_000)
    let reversed = resolveLumenDateRange(
        start: Date(timeIntervalSince1970: 1_750),
        end: Date(timeIntervalSince1970: 1_500),
        bounds: .closed(lowerBound...upperBound)
    )
    let outside = resolveLumenDateRange(
        start: Date(timeIntervalSince1970: 500),
        end: Date(timeIntervalSince1970: 2_500),
        bounds: .closed(lowerBound...upperBound)
    )

    #expect(reversed.start == reversed.end)
    #expect(outside.start == lowerBound)
    #expect(outside.end == upperBound)
}
#endif

#if os(macOS)
@Test func shortcutsUseMacModifierGlyphsAndSpecialKeyNames() {
    let shortcut = LumenShortcut(
        keyCode: 123,
        modifiers: [.control, .shift]
    )

    #expect(shortcut.display == "⌃⇧←")
}

@Test func commonSymbolsHaveStableUniqueIdentifiers() {
    let symbols = LumenSymbolOption.common

    #expect(!symbols.isEmpty)
    #expect(Set(symbols.map(\.id)).count == symbols.count)
    #expect(symbols.allSatisfy { !$0.category.isEmpty && !$0.label.isEmpty && !$0.name.isEmpty })
}
#endif
