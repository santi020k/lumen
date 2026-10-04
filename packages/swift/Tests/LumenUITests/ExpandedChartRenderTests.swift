#if os(macOS)
import AppKit
import SwiftUI
import Testing
@testable import LumenUI

@MainActor @Test func expandedChartsFitNarrowAndWideNativeLayouts() {
    for width: CGFloat in [320, 760] {
        for textSize: DynamicTypeSize in [.large, .accessibility3] {
            let content = VStack(spacing: 16) {
                LumenCalendarHeatmap(data: [.init(date: "2026-09-01", value: 0), .init(date: "2026-09-03", value: 12)], label: "Daily activity", startDate: "2026-09-01", endDate: "2026-11-30", heading: "Daily activity")
                LumenFunnelChart(data: [.init(id: "visits", label: "Visits", value: 1200), .init(id: "trial", label: "Started trial", value: 780), .init(id: "paid", label: "Subscribed", value: 210)], label: "Signup stages", heading: "Signup stages")
                LumenBoxPlot(data: [.init(id: "weekday", label: "Weekday", min: 12, q1: 28, median: 42, q3: 61, max: 82, outliers: [103]), .init(id: "weekend", label: "Weekend", min: 8, q1: 18, median: 29, q3: 46, max: 70, outliers: [91])], label: "Response time", heading: "Response times")
            }.padding(16).frame(width: width).environment(\.dynamicTypeSize, textSize)
            let host = NSHostingView(rootView: content.fixedSize())
            let size = host.fittingSize
            host.frame = NSRect(origin: .zero, size: size)
            host.layoutSubtreeIfNeeded()
            if let destination = ProcessInfo.processInfo.environment["LUMEN_CHART_RENDER_DIR"],
               let bitmap = host.bitmapImageRepForCachingDisplay(in: host.bounds) {
                host.cacheDisplay(in: host.bounds, to: bitmap)
                if let png = bitmap.representation(using: .png, properties: [:]) {
                    let output = URL(fileURLWithPath: destination).appendingPathComponent("swift-charts-\(Int(width))-\(textSize == .large ? "default" : "large-text").png")
                    try? png.write(to: output)
                }
            }
            #expect(size.width == width)
            #expect(size.height.isFinite && size.height > 0)
        }
    }
}
#endif
