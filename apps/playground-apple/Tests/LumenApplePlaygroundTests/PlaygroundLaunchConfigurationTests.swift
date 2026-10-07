@testable import LumenApplePlayground
import LumenUI
import Testing
import SwiftUI
#if os(macOS)
import AppKit
#endif

@Test("theme presets preserve brand and appearance choices")
func themePresets() {
    let lumenLight = PlaygroundThemePreset.lumen.theme(for: .light)
    let lumenDark = PlaygroundThemePreset.lumen.theme(for: .dark)

    #expect(PlaygroundThemePreset.allCases.map(\.title) == ["Normal", "Studio", "Glass", "santi020k"])
    #expect(lumenLight.scheme == .light)
    #expect(lumenLight.colors.brand == LumenColors.light.brand)
    #expect(lumenLight.colors.canvas == LumenColors.light.canvas)
    #expect(lumenDark.scheme == .dark)
    #expect(lumenDark.colors.brand == LumenColors.dark.brand)
    #expect(lumenDark.colors.canvas == LumenColors.dark.canvas)
    #expect(PlaygroundThemePreset.santi020k.theme(for: .light).scheme == .light)
    #expect(PlaygroundThemePreset.santi020k.theme(for: .dark).scheme == .dark)
}

@Suite("Playground launch configuration")
struct PlaygroundLaunchConfigurationTests {
    @Test("parses a deterministic component filter")
    func componentFilter() {
        let configuration = PlaygroundLaunchConfiguration(
            arguments: ["LumenApplePlayground", "--component", "Navigation bar"]
        )

        #expect(configuration.componentFilter == "Navigation bar")
        #expect(configuration.destination == .home)
        #expect(!configuration.forcesDarkAppearance)
    }

    @Test("preserves dark component captures")
    func darkComponentFilter() {
        let configuration = PlaygroundLaunchConfiguration(
            arguments: ["LumenApplePlayground", "--dark", "--component", "Alert dialog"]
        )

        #expect(configuration.componentFilter == "Alert dialog")
        #expect(configuration.forcesDarkAppearance)
    }

    @Test("ignores an incomplete component argument")
    func incompleteComponentFilter() {
        let configuration = PlaygroundLaunchConfiguration(
            arguments: ["LumenApplePlayground", "--component"]
        )

        #expect(configuration.componentFilter == nil)
    }

    @Test("opens a requested reference destination")
    func destination() {
        let configuration = PlaygroundLaunchConfiguration(
            arguments: ["LumenApplePlayground", "--destination", "settings"]
        )

        #expect(configuration.destination == .settings)
        #expect(configuration.componentFilter == nil)
    }
}

@Suite("Playground catalog")
struct PlaygroundCatalogTests {
    @Test("every component has exactly one product category")
    func categoryCoverage() {
        let categorizedCount = PlaygroundComponentCategory.allCases
            .filter { $0 != .all }
            .reduce(into: 0) { count, category in
                count += PlaygroundCatalog.count(in: category)
            }

        #expect(categorizedCount == PlaygroundCatalog.componentNames.count)
        #expect(Set(PlaygroundCatalog.componentNames).count == PlaygroundCatalog.componentNames.count)
    }

    @Test("normal catalog categories preserve deterministic launch entries")
    func deterministicEntriesRemainCategorized() {
        #expect(PlaygroundComponentCategory.actions.contains("Button"))
        #expect(PlaygroundComponentCategory.navigation.contains("Alert dialog"))
        #expect(PlaygroundComponentCategory.navigation.contains("Sheet"))
        #expect(PlaygroundComponentCategory.data.contains("Line chart"))
        #expect(PlaygroundComponentCategory.allCases.map(\.title) == [
            "All", "Foundations", "Actions", "Forms", "Feedback", "Data", "Navigation"
        ])
    }
}

@Test("runtime locale copy covers visible, validation, and action text in English and Spanish")
func runtimeLocaleCopy() {
    let english = PlaygroundRuntimeLocale.english.copy
    let spanish = PlaygroundRuntimeLocale.spanish.copy

    #expect(english != spanish)
    #expect(english.fieldLabel == "Release note")
    #expect(spanish.fieldLabel == "Nota de la versión")
    #expect(!english.validation.isEmpty)
    #expect(!spanish.validation.isEmpty)
    #expect(!english.action.isEmpty)
    #expect(!spanish.action.isEmpty)
}

@Test("component search accepts IDs and preserves exact capture filters")
func componentSearch() {
    #expect(PlaygroundComponentSearch.matches("Date range field", query: "  DATE-range_field  "))
    #expect(PlaygroundComponentSearch.matches("Icon button", query: "IconButton"))
    #expect(PlaygroundComponentSearch.matches("Button group", query: "button"))
    #expect(!PlaygroundComponentSearch.matches("Button group", query: "button", exact: true))
    #expect(PlaygroundComponentSearch.matches("Button", query: " BUTTON ", exact: true))
    #expect(PlaygroundComponentSearch.matches("Button", query: "  "))
    #expect(!PlaygroundComponentSearch.matches("Button", query: "missing"))
}

@Test("Studio and Glass use the shared appearance in both schemes")
func sharedAppearancePresets() {
    for scheme in [LumenColorScheme.light, .dark] {
        let studio = PlaygroundThemePreset.studio.theme(for: scheme)
        let glass = PlaygroundThemePreset.glass.theme(for: scheme)
        #expect(studio.scheme == scheme)
        #expect(glass.scheme == scheme)
        #expect(studio.colors.canvas == LumenThemePreset.studio.colors(for: scheme).canvas)
        #expect(studio.colors.brandSolid == LumenThemePreset.studio.colors(for: scheme).brandSolid)
        #expect(studio.appearance.radiusScale == LumenThemePreset.studio.appearance.radiusScale)
        #expect(studio.appearance.elevationScale == 0)
        #expect(glass.appearance.radiusScale == LumenThemePreset.glass.appearance.radiusScale)
        #expect(glass.appearance.material == .glass)
    }
}

@Suite("Appearance transitions")
struct PlaygroundAppearanceTests {
    @Test("returning to System uses the system scheme after either explicit override")
    func returnToSystem() {
        for systemScheme in [ColorScheme.light, .dark] {
            var preference = PlaygroundThemePreference.dark
            #expect(preference.resolvedScheme(systemScheme: systemScheme) == .dark)
            preference = .system
            #expect(preference.resolvedScheme(systemScheme: systemScheme) == (systemScheme == .dark ? .dark : .light))
            preference = .light
            #expect(preference.resolvedScheme(systemScheme: systemScheme) == .light)
            preference = .system
            #expect(preference.resolvedScheme(systemScheme: systemScheme) == (systemScheme == .dark ? .dark : .light))
        }
    }

    @Test("system changes affect System and preserve explicit overrides for every preset")
    func systemChanges() {
        for preset in PlaygroundThemePreset.allCases {
            for preference in PlaygroundThemePreference.allCases {
                let light = preset.theme(for: preference.resolvedScheme(systemScheme: .light))
                let dark = preset.theme(for: preference.resolvedScheme(systemScheme: .dark))
                if preference == .system {
                    #expect(light.scheme == .light)
                    #expect(dark.scheme == .dark)
                } else {
                    #expect(light.scheme == dark.scheme)
                }
            }
        }
    }

    #if os(macOS)
    @Test("AppKit matching handles standard and increased-contrast appearances")
    func nativeAppearances() throws {
        for name in [NSAppearance.Name.aqua, .accessibilityHighContrastAqua] {
            let appearance = try #require(NSAppearance(named: name))
            #expect(PlaygroundMacAppearance.scheme(for: appearance) == .light)
        }
        for name in [NSAppearance.Name.darkAqua, .accessibilityHighContrastDarkAqua] {
            let appearance = try #require(NSAppearance(named: name))
            #expect(PlaygroundMacAppearance.scheme(for: appearance) == .dark)
        }
    }
    #endif
}

#if os(macOS)
@MainActor
@Test("Desktop columns use available width and stack in narrow windows")
func desktopColumnLayout() {
    for (width, expectedHeight) in [(500.0, 120.0 + LumenSpacing.md), (900.0, 80.0)] {
        let view = AdaptiveColumns {
            Color.clear.frame(height: 40)
        } secondary: {
            Color.clear.frame(height: 80)
        }.frame(width: width)
        #expect(abs(NSHostingView(rootView: view).fittingSize.height - expectedHeight) < 1)
    }
}
#endif
