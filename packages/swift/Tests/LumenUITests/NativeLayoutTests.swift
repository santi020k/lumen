#if os(macOS)
import AppKit
import SwiftUI
import Testing
@testable import LumenUI

@MainActor
private func measuredSize<Content: View>(of content: Content) -> CGSize {
    NSHostingView(rootView: content.fixedSize()).fittingSize
}

@MainActor
@Test func accessibilityRowsStackIndependentActionsWithinTheirAvailableWidth() {
    let row = LumenListRow {
        LumenAvatar(fallback: "LM")
    } content: {
        Text("Workspace shared with your household")
    } trailing: {
        LumenButton("Review workspace membership", action: {})
    }
    let ordinary = measuredSize(of: row.environment(\.dynamicTypeSize, .large).frame(width: 320))
    let accessible = measuredSize(of: row.environment(\.dynamicTypeSize, .accessibility3).frame(width: 320))

    #expect(accessible.width == 320)
    #expect(accessible.height < ordinary.height)
    #expect(accessible.height < 300)
}

@MainActor
@Test func relatedActionsStackForAccessibilityTextAndFitCompactWidths() {
    let group = LumenButtonGroup {
        LumenButton("Cancel changes", action: {})
        LumenButton("Save workspace", action: {})
    }
    let ordinary = measuredSize(of: group.environment(\.dynamicTypeSize, .large).frame(width: 320))
    let accessible = measuredSize(of: group.environment(\.dynamicTypeSize, .accessibility3).frame(width: 320))

    let compact = measuredSize(of: group.environment(\.dynamicTypeSize, .large).frame(width: 140))
    #expect(compact.width == 140)
    #expect(compact.height > ordinary.height)
    #expect(accessible.width == 320)
    #expect(accessible.height > ordinary.height)
    let cancel = measuredSize(of: LumenButton("Cancel changes", action: {}).environment(\.dynamicTypeSize, .accessibility3))
    let save = measuredSize(of: LumenButton("Save workspace", action: {}).environment(\.dynamicTypeSize, .accessibility3))
    #expect(accessible.height >= cancel.height + save.height)
}

@MainActor
@Test func sheetCompositionSupportsScrollingAndDismissalPolicies() {
    let content = Text("An editable application-owned form")
    _ = content.lumenSheet(
        isPresented: .constant(true),
        title: "Edit workspace",
        dismissible: false,
        scrollable: true,
        actions: { LumenButton("Save changes", action: {}) }
    ) { content }
    _ = content.lumenSheet(
        isPresented: .constant(true),
        scrollable: false
    ) { List { Text("Application-owned collection") } }

    for textSize: DynamicTypeSize in [.large, .accessibility5] {
        let layout = LumenSheetLayout(
            title: "Edit workspace",
            description: "Long content remains scrollable",
            scrollable: true,
            sheetContent: VStack { ForEach(0..<20) { Text("Field \($0)") } },
            actions: LumenButton("Save changes", action: {})
        )
        let size = measuredSize(of: layout.environment(\.dynamicTypeSize, textSize).frame(width: 320, height: 300))
        #expect(size.width == 320)
        #expect(size.height == 300)
    }
}

@MainActor
@Test func loadingButtonsPreserveTheSameLabelGeometry() {
    for size: LumenControlSize in [.sm, .md, .lg] {
        let idle = measuredSize(of: LumenButton(size: size, action: {}) {
            Label("Connect workspace", systemImage: "link")
        })
        let loading = measuredSize(of: LumenButton(size: size, loading: true, action: {}) {
            Label("Connect workspace", systemImage: "link")
        })

        #expect(idle.width > 0)
        #expect(loading.width == idle.width)
        #expect(loading.height == idle.height)
    }
}

@MainActor
@Test func compactSlidersRemoveOnlyTheirVisualHeadingSpace() {
    let labelled = measuredSize(of: LumenSlider(
        "Manual minimum",
        value: .constant(1600),
        in: 1000...4000,
        step: 100,
        valueLabel: "1,600 RPM"
    ).frame(width: 240))
    let compact = measuredSize(of: LumenSlider(
        "Manual minimum",
        value: .constant(1600),
        in: 1000...4000,
        step: 100,
        valueLabel: "1,600 RPM",
        showsLabel: false
    ).frame(width: 240))

    #expect(compact.height > 0)
    #expect(compact.height < labelled.height)
    #expect(compact.width == labelled.width)
    _ = LumenSlider("Native value", value: .constant(0.5), in: 0...1, showsLabel: false).body
}

@MainActor
@Test func compactChartsRespectRequestedPlotHeightAndBareFrame() {
    let series = [LumenChartSeries(id: "cpu", label: "CPU", data: [
        LumenChartDatum(id: "a", x: .category("A"), y: 25),
        LumenChartDatum(id: "b", x: .category("B"), y: 50)
    ])]
    let line = measuredSize(of: LumenLineChart(
        label: "CPU history", series: series, showData: false, bare: true, height: 110
    ).frame(width: 320))
    let framed = measuredSize(of: LumenLineChart(
        label: "CPU history", series: series, showData: false, height: 110
    ).frame(width: 320))
    let bar = measuredSize(of: LumenBarChart(
        label: "CPU samples", series: series, showData: false, bare: true, height: 130
    ).frame(width: 320))
    let invalidHeight = measuredSize(of: LumenLineChart(
        label: "CPU history", series: series, showData: false, bare: true, height: .nan
    ).frame(width: 320))

    #expect(line.height == 110)
    #expect(framed.height == line.height + 2 * LumenSpacing.lg)
    #expect(bar.height == 130)
    #expect(invalidHeight.height == 220)
}

@MainActor
@Test func symbolSelectionPublishesTheUpdatedBindingIncludingRepeatedChoice() {
    var selected = "folder"
    var observed: [String] = []
    let binding = Binding(get: { selected }, set: { selected = $0 })
    let picker = LumenSymbolPicker(selectedName: binding, tint: .orange) { name in
        #expect(selected == name)
        observed.append(name)
    }

    picker.select("star")
    picker.select("star")

    #expect(selected == "star")
    #expect(observed == ["star", "star"])
    _ = LumenSymbolPickerButton(
        selectedName: binding, tint: .orange, dismissOnSelection: false, onSelection: { _ in }
    ).body
}
#endif
