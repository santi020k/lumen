#if os(macOS)
// cspell:words borderless
import AppKit
import SwiftUI
import Testing
@testable import LumenUI

@MainActor private final class AppearanceObservation {
    var colorScheme: ColorScheme?
    var themeScheme: LumenColorScheme?
}

private struct AppearanceProbe: View {
    @Environment(\.colorScheme) private var colorScheme
    @Environment(\.lumenTheme) private var theme
    let observation: AppearanceObservation

    var body: some View {
        Rectangle()
            .fill(colorScheme == .dark ? Color.black : Color.white)
            .frame(width: 160, height: 100)
            .onAppear { record(colorScheme) }
            .onChange(of: colorScheme) { record($0) }
    }

    private func record(_ scheme: ColorScheme) {
        observation.colorScheme = scheme
        observation.themeScheme = theme.scheme
    }
}

@MainActor
private func observeAppearance<Content: View>(
    _ content: Content,
    observation: AppearanceObservation,
    expected: ColorScheme,
    hostScheme: ColorScheme = .light,
    fixture: String
) async throws {
    _ = NSApplication.shared
    let window = NSWindow(
        contentRect: NSRect(x: 0, y: 0, width: 160, height: 100),
        styleMask: [.borderless], backing: .buffered, defer: false
    )
    window.isReleasedWhenClosed = false
    window.appearance = NSAppearance(named: hostScheme == .dark ? .darkAqua : .aqua)
    let host = NSHostingView(rootView: content)
    window.contentView = host
    window.orderBack(nil)
    defer { window.close() }

    for _ in 0..<25 {
        try await Task.sleep(for: .milliseconds(20))
        host.layoutSubtreeIfNeeded()
        if observation.colorScheme == expected { break }
    }

    if let directory = ProcessInfo.processInfo.environment["LUMEN_THEME_RENDER_DIR"],
       let bitmap = host.bitmapImageRepForCachingDisplay(in: host.bounds) {
        host.cacheDisplay(in: host.bounds, to: bitmap)
        if let png = bitmap.representation(using: .png, properties: [:]) {
            try png.write(to: URL(fileURLWithPath: directory).appendingPathComponent("\(fixture).png"))
        }
    }
    #expect(observation.colorScheme == expected)
}

@Suite(.serialized)
struct ThemeAppearanceTests {
    @MainActor @Test
    func nonEnforcingThemePreservesCallerAppearanceInBothModifierOrders() async throws {
        for expected in [ColorScheme.light, .dark] {
            for applyTint in [true, false] {
                for callerFirst in [true, false] {
                    let observation = AppearanceObservation()
                    let theme: LumenTheme = expected == .dark ? .light : .dark
                    let probe = AppearanceProbe(observation: observation)
                    let fixture = "caller-\(expected)-first-\(callerFirst)-tint-\(applyTint)"
                    if callerFirst {
                        try await observeAppearance(
                            probe.preferredColorScheme(expected)
                                .lumenTheme(theme, enforceColorScheme: false, applyTint: applyTint),
                            observation: observation, expected: expected, fixture: fixture
                        )
                    } else {
                        try await observeAppearance(
                            probe.lumenTheme(theme, enforceColorScheme: false, applyTint: applyTint)
                                .preferredColorScheme(expected),
                            observation: observation, expected: expected, fixture: fixture
                        )
                    }
                    #expect(observation.themeScheme == theme.scheme)
                }
            }
        }
    }

    @MainActor @Test
    func nonEnforcingThemeInheritsHostAndEnforcingThemeStillSetsAppearance() async throws {
        for hostScheme in [ColorScheme.light, .dark] {
            for applyTint in [true, false] {
                for enforced in [false, true] {
                    let observation = AppearanceObservation()
                    let probe = AppearanceProbe(observation: observation)
                    let theme: LumenTheme = hostScheme == .light ? .dark : .light
                    let expected: ColorScheme = enforced
                        ? (theme.scheme == .dark ? .dark : .light) : hostScheme
                    try await observeAppearance(
                        probe.lumenTheme(theme, enforceColorScheme: enforced, applyTint: applyTint),
                        observation: observation, expected: expected, hostScheme: hostScheme,
                        fixture: "host-\(hostScheme)-enforced-\(enforced)-tint-\(applyTint)"
                    )
                    #expect(observation.themeScheme == theme.scheme)
                }
            }
        }
    }
}
#endif
