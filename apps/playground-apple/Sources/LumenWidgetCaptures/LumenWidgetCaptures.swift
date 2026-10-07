#if os(macOS)
import AppKit
import LumenWidgetUI
import SwiftUI

/// Render actual widget primitives for documentation. These are SwiftUI previews,
/// not captures of a WidgetKit extension or proof of its timeline/provider behavior.
@main
struct LumenWidgetCaptures {
    @MainActor
    static func main() throws {
        let output = URL(fileURLWithPath: CommandLine.arguments.dropFirst().first ?? "Screenshots/widgets")
        try FileManager.default.createDirectory(at: output, withIntermediateDirectories: true)
        try capture("widget-text", output: output) {
            VStack(alignment: .leading, spacing: LumenWidgetSpacing.md) {
                LumenWidgetText(.verbatim("Current session"), style: .title)
                LumenWidgetText(.verbatim("Ready when you are"), style: .body)
                LumenWidgetText(.verbatim("Updated just now"), style: .caption, tone: .secondary)
            }
        }
        try capture("widget-icon", output: output) {
            HStack(spacing: LumenWidgetSpacing.xl) {
                LumenWidgetIcon(systemName: "timer", label: .verbatim("Active timer"), tone: .accent, size: 32)
                LumenWidgetIcon(systemName: "checkmark.circle", label: .verbatim("Completed"), tone: .success, size: 32)
            }
        }
        try capture("widget-badge", output: output) {
            VStack(alignment: .leading, spacing: LumenWidgetSpacing.md) {
                LumenWidgetBadge(.verbatim("Ready"), iconSystemName: "checkmark.circle.fill", tone: .success)
                LumenWidgetBadge(.verbatim("In progress"), iconSystemName: "timer", tone: .accent)
            }
        }
        try capture("widget-compact-stat", output: output) {
            LumenWidgetCompactStat(label: .verbatim("Duration"), value: .verbatim("01:15"), iconSystemName: "timer")
        }
    }

    @MainActor
    private static func capture<Content: View>(_ slug: String, output: URL, @ViewBuilder content: () -> Content) throws {
        let renderer = ImageRenderer(content: content()
            .padding(LumenWidgetSpacing.xl)
            .frame(width: 360, height: 180, alignment: .leading)
            .background(LumenWidgetColors.light.canvas)
            .environment(\.colorScheme, .light))
        renderer.scale = 2
        guard let image = renderer.cgImage,
              let data = NSBitmapImageRep(cgImage: image).representation(using: .png, properties: [:]) else {
            throw CocoaError(.fileWriteUnknown)
        }
        try data.write(to: output.appendingPathComponent("\(slug).png"))
        print("Captured \(slug) SwiftUI preview")
    }
}
#endif
