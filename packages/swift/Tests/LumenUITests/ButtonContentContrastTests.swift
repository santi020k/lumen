#if os(macOS)
import AppKit
import CoreGraphics
import SwiftUI
import Testing
@testable import LumenUI

private enum ButtonContentRenderError: Error { case image, context, color }

@MainActor
private func matchingPixels<Content: View>(_ content: Content, color: Color) throws -> Int {
    let renderer = ImageRenderer(content: content.frame(width: 260, height: 64))
    renderer.scale = 1
    guard let image = renderer.cgImage else { throw ButtonContentRenderError.image }
    guard let target = NSColor(color).usingColorSpace(.deviceRGB) else { throw ButtonContentRenderError.color }
    var pixels = [UInt8](repeating: 0, count: image.width * image.height * 4)
    let space = CGColorSpaceCreateDeviceRGB()
    try pixels.withUnsafeMutableBytes { bytes in
        guard let context = CGContext(data: bytes.baseAddress, width: image.width, height: image.height,
            bitsPerComponent: 8, bytesPerRow: image.width * 4, space: space,
            bitmapInfo: CGBitmapInfo.byteOrder32Big.rawValue | CGImageAlphaInfo.premultipliedLast.rawValue)
        else { throw ButtonContentRenderError.context }
        context.draw(image, in: CGRect(x: 0, y: 0, width: image.width, height: image.height))
    }
    let expected = [target.redComponent, target.greenComponent, target.blueComponent].map { Int(($0 * 255).rounded()) }
    return stride(from: 0, to: pixels.count, by: 4).filter { offset in
        pixels[offset + 3] > 240 && (0..<3).allSatisfy { abs(Int(pixels[offset + $0]) - expected[$0]) <= 3 }
    }.count
}

@Test @MainActor func nestedButtonContentPreservesReadableDefaultsAndExplicitColors() throws {
    for theme in [LumenTheme.light, LumenTheme.dark] {
        let label = LumenButton(action: {}) { LumenText("MMMM", variant: .title) }
            .environment(\.lumenTheme, theme).background(theme.colors.canvas)
        #expect(try matchingPixels(label, color: theme.colors.onBrand) > 10)
        let icon = LumenButton(action: {}) { LumenIcon(systemName: "circle.fill", size: .lg) }
            .environment(\.lumenTheme, theme).background(theme.colors.canvas)
        #expect(try matchingPixels(icon, color: theme.colors.onBrand) > 10)
        let explicit = LumenButton(action: {}) { LumenText("MMMM", variant: .title, tone: .danger) }
            .environment(\.lumenTheme, theme).background(theme.colors.canvas)
        #expect(try matchingPixels(explicit, color: theme.colors.danger) > 10)
        let outside = LumenText("MMMM", variant: .title).environment(\.lumenTheme, theme)
            .background(theme.colors.canvas)
        #expect(try matchingPixels(outside, color: theme.colors.ink) > 10)
    }
}
#endif
