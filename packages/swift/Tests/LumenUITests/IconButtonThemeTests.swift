#if os(macOS)
import AppKit
import SwiftUI
import Testing
@testable import LumenUI

@MainActor @Test
func standaloneIconButtonStylesKeepNamedThemeIconsVisible() throws {
    for (name, definition) in [("santi020k", LumenNamedTheme.santi020k), ("paper", .paper), ("field", .field)] {
        for scheme in [LumenColorScheme.light, .dark] {
            let theme = LumenTheme(definition, scheme: scheme)
            let foreground = try #require(NSColor(theme.actionForeground).usingColorSpace(.sRGB))
            for lumenIcon in [true, false] {
                let content = Button {} label: {
                    if lumenIcon {
                        // Plain SwiftPM test runners may copy asset catalogs without compiling
                        // them. A system symbol still exercises LumenIcon's foreground override.
                        LumenIcon(systemName: "plus", label: "Add")
                    } else {
                        Image(systemName: "plus").accessibilityLabel("Add")
                    }
                }
                .buttonStyle(LumenIconButtonStyle(intent: .primary))
                .lumenThemeScope(definition, scheme: scheme)
                .frame(width: 64, height: 64)
                .background(theme.colors.canvas)
                let renderer = ImageRenderer(content: content)
                renderer.scale = 2
                let image = try #require(renderer.cgImage)
                let bitmap = NSBitmapImageRep(cgImage: image)
                var foregroundPixels = 0
                // Only inspect the glyph's center, excluding the button border and surrounding canvas.
                for x in 48..<80 {
                    for y in 48..<80 {
                        let pixel = try #require(bitmap.colorAt(x: x, y: y)?.usingColorSpace(.sRGB))
                        let difference = abs(pixel.redComponent - foreground.redComponent)
                            + abs(pixel.greenComponent - foreground.greenComponent)
                            + abs(pixel.blueComponent - foreground.blueComponent)
                        if difference < 0.15 { foregroundPixels += 1 }
                    }
                }
                #expect(foregroundPixels > 10, "Missing primary icon foreground: \(name), \(scheme), Lumen icon \(lumenIcon)")
                if let directory = ProcessInfo.processInfo.environment["LUMEN_THEME_RENDER_DIR"] {
                    let png = try #require(bitmap.representation(using: .png, properties: [:]))
                    let filename = "icon-button-\(name)-\(scheme)-\(lumenIcon ? "lumen" : "system").png"
                    try png.write(to: URL(fileURLWithPath: directory).appendingPathComponent(filename))
                }
            }
        }
    }
}
#endif
