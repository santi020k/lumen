@testable import LumenApplePlayground
import Testing

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
        #expect(PlaygroundComponentCategory.feedback.contains("Alert dialog"))
        #expect(PlaygroundComponentCategory.navigation.contains("Sheet"))
        #expect(PlaygroundComponentCategory.content.contains("Line chart"))
    }
}
