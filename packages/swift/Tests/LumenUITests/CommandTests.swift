import Testing
@testable import LumenUI

private let commandGroups = [LumenCommandGroup(id: "navigation", label: "Navigation", items: [
    .init(id: "docs", label: "Documentation", detail: "Read guides", keywords: ["manual"], shortcut: "Ctrl+D"),
    .init(id: "blocked", label: "Disabled", disabled: true), .init(id: "theme", label: "Toggle theme")
])]
@Test func commandFilteringAndSafeNavigation() {
    for query in [" DOCUMENT ", "guides", "manual", "ctrl+d"] { #expect(lumenCommandGroups(commandGroups, query: query)?.first?.items.map(\.id) == ["docs"]) }
    #expect(moveLumenCommandActive(commandGroups, query: "", activeId: nil, direction: .next) == "docs")
    #expect(moveLumenCommandActive(commandGroups, query: "", activeId: "docs", direction: .next) == "theme")
    #expect(moveLumenCommandActive(commandGroups, query: "", activeId: "theme", direction: .next) == "docs")
    #expect(moveLumenCommandActive(commandGroups, query: "", activeId: "docs", direction: .previous) == "theme")
    #expect(moveLumenCommandActive(commandGroups, query: "", activeId: "docs", direction: .last) == "theme")
    #expect(moveLumenCommandActive(commandGroups, query: "", activeId: "theme", direction: .first) == "docs")
    #expect(resolveLumenCommandActive(commandGroups, query: "theme", activeId: "docs") == nil)
    #expect(resolveLumenCommandActive(commandGroups, query: "", activeId: "blocked") == nil)
    #expect(moveLumenCommandActive(commandGroups, query: "Disabled", activeId: nil, direction: .next) == nil)
}
@Test func commandIdentityAndLiteralQueryValidation() {
    #expect(lumenCommandGroups(commandGroups + commandGroups, query: "missing") == nil)
    #expect(!isLumenCommandGroupsValid([.init(id: " ", label: "Blank", items: [])]))
    #expect(!isLumenCommandGroupsValid([.init(id: "a", label: "A", items: [.init(id: "x", label: "X"), .init(id: "x", label: "Duplicate")])]))
    #expect(lumenCommandGroups(commandGroups, query: String(repeating: "(", count: 100000))?.isEmpty == true)
    #expect(lumenCommandGroups([], query: "")?.isEmpty == true)
}
