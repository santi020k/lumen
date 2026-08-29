@testable import LumenApplePlayground
import LumenUI
import Testing

@Test("theme presets preserve brand and appearance choices")
func themePresets() {
    let lumenLight = PlaygroundThemePreset.lumen.theme(for: .light)
    let lumenDark = PlaygroundThemePreset.lumen.theme(for: .dark)

    #expect(PlaygroundThemePreset.allCases.map(\.title) == ["Lumen", "santi020k"])
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
