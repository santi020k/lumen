#if os(macOS)
import AppKit
import CoreGraphics
import SwiftUI
import Testing
@testable import LumenUI

private enum TimelineRenderError: Error { case image, context, color }
@MainActor private func timelineLinePixels(isLast: Bool, theme: LumenTheme) throws -> Int {
    let view = LumenTimelineItem(isLast: isLast) { Text("Synthetic event").frame(width: 200, height: 80) }
        .environment(\.lumenTheme, theme).background(theme.colors.canvas)
    let renderer = ImageRenderer(content: view)
    renderer.scale = 2
    guard let image = renderer.cgImage else { throw TimelineRenderError.image }
    guard let target = NSColor(theme.colors.line).usingColorSpace(.deviceRGB) else { throw TimelineRenderError.color }
    var pixels = [UInt8](repeating: 0, count: image.width * image.height * 4)
    try pixels.withUnsafeMutableBytes { bytes in
        guard let context = CGContext(data: bytes.baseAddress, width: image.width, height: image.height,
            bitsPerComponent: 8, bytesPerRow: image.width * 4, space: CGColorSpaceCreateDeviceRGB(),
            bitmapInfo: CGBitmapInfo.byteOrder32Big.rawValue | CGImageAlphaInfo.premultipliedLast.rawValue)
        else { throw TimelineRenderError.context }
        context.draw(image, in: CGRect(x: 0, y: 0, width: image.width, height: image.height))
    }
    let rgb = [target.redComponent, target.greenComponent, target.blueComponent].map { Int(($0 * 255).rounded()) }
    var matchingPixels = 0
    for offset in stride(from: 0, to: pixels.count, by: 4) {
        // The marker rail is the leftmost 20 logical points; text cannot contribute matches.
        let column = (offset / 4) % image.width
        guard column < 40, pixels[offset + 3] > 240 else { continue }
        var matchesColor = true
        for channel in 0..<3 {
            let difference = abs(Int(pixels[offset + channel]) - rgb[channel])
            if difference > 3 {
                matchesColor = false
                break
            }
        }
        if matchesColor { matchingPixels += 1 }
    }
    return matchingPixels
}
@Test @MainActor func timelineTerminalConnectorMatchesReferenceInBothThemes() throws {
    for theme in [LumenTheme.light, LumenTheme.dark] {
        #expect(try timelineLinePixels(isLast: false, theme: theme) > 20)
        #expect(try timelineLinePixels(isLast: true, theme: theme) == 0)
    }
}
@Test @MainActor func timelineRetainsArbitraryHostContentAndDefaultInitializer() {
    _ = LumenTimeline("History") {
        LumenTimelineItem { Text("Default marker"); LumenButton("View record") {} }
        LumenTimelineItem(isLast: true, dot: { Text("✓") }) { Text("Terminal event") }
    }
}
#endif
