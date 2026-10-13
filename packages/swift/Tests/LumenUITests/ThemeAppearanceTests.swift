#if os(macOS)
// cspell:words borderless
import AppKit
import SwiftUI
import Testing
@testable import LumenUI

@MainActor private final class AppearanceObservation {
    var colorScheme: ColorScheme?
    var themeScheme: LumenColorScheme?
    var draft: String?
    var editDraft: ((String) -> Void)?
    var enforced: Bool?
}

@MainActor private final class AppearanceControl: ObservableObject {
    @Published var enforce = false
}

private struct StatefulAppearanceProbe: View {
    @Environment(\.colorScheme) private var colorScheme
    @State private var draft = "Initial draft"
    let observation: AppearanceObservation

    var body: some View {
        Text(draft)
            .frame(width: 160, height: 100)
            .onAppear {
                observation.draft = draft
                observation.colorScheme = colorScheme
                observation.editDraft = { draft = $0 }
            }
            .task(id: draft) { observation.draft = draft }
            .task(id: colorScheme) { observation.colorScheme = colorScheme }
    }
}

private struct StatefulAppearanceFixture: View {
    @ObservedObject var control: AppearanceControl
    let observation: AppearanceObservation
    let applyTint: Bool

    var body: some View {
        StatefulAppearanceProbe(observation: observation)
            .lumenTheme(.dark, enforceColorScheme: control.enforce, applyTint: applyTint)
            .task(id: control.enforce) { observation.enforced = control.enforce }
    }
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
            .task(id: colorScheme) { record(colorScheme) }
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
    fixture: String,
    exercise: (@MainActor () async throws -> Void)? = nil
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
    if let exercise { try await exercise() }
}

@Suite(.serialized)
struct ThemeAppearanceTests {
    @MainActor @Test
    func enforcingThemeRetainsOutermostPreferencePrecedence() async throws {
        for applyTint in [true, false] {
            for callerFirst in [true, false] {
                let observation = AppearanceObservation()
                let probe = AppearanceProbe(observation: observation)
                if callerFirst {
                    try await observeAppearance(
                        probe.preferredColorScheme(.light)
                            .lumenTheme(.dark, enforceColorScheme: true, applyTint: applyTint),
                        observation: observation, expected: .dark,
                        fixture: "enforcing-outer-tint-\(applyTint)"
                    )
                } else {
                    try await observeAppearance(
                        probe.lumenTheme(.dark, enforceColorScheme: true, applyTint: applyTint)
                            .preferredColorScheme(.light),
                        observation: observation, expected: .light,
                        fixture: "caller-outer-tint-\(applyTint)"
                    )
                }
            }
        }
    }

    @MainActor @Test
    func changingEnforcementPreservesAnEditedChildDraft() async throws {
        for applyTint in [true, false] {
            let observation = AppearanceObservation()
            let control = AppearanceControl()
            try await observeAppearance(
                StatefulAppearanceFixture(control: control, observation: observation, applyTint: applyTint),
                observation: observation, expected: .light,
                fixture: "state-retention-tint-\(applyTint)"
            ) {
                let edit = try #require(observation.editDraft)
                edit("Unsaved application draft")
                for _ in 0..<25 {
                    try await Task.sleep(for: .milliseconds(20))
                    if observation.draft == "Unsaved application draft" { break }
                }
                #expect(observation.draft == "Unsaved application draft")
                for enforced in [true, false, true, false] {
                    control.enforce = enforced
                    for _ in 0..<25 {
                        try await Task.sleep(for: .milliseconds(20))
                        if observation.enforced == enforced { break }
                    }
                    #expect(observation.enforced == enforced)
                    #expect(observation.draft == "Unsaved application draft")
                }
            }
        }
    }

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
