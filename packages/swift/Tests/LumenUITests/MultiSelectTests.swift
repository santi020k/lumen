#if os(iOS) || os(macOS) || os(visionOS)
import SwiftUI
import Testing
@testable import LumenUI

@Test func multiSelectionRetainsUnavailableValuesAndDoesNotMutateInput() {
    let values: Set<String> = ["one", "missing"]
    #expect(toggleLumenMultiSelection(values, value: "two") == ["one", "two", "missing"])
    #expect(toggleLumenMultiSelection(values, value: "one") == ["missing"])
    #expect(values == ["one", "missing"])
    #expect(toggleLumenMultiSelection([], value: "one") == ["one"])
}

@MainActor @Test func multiSelectAcceptsLocalizedReadOnlyAndUnavailableSelections() {
    let view = LumenMultiSelect("Teams", values: .constant(["missing"]), query: .constant(""),
                               options: [LumenAutocompleteOption(value: "one", label: "One", disabled: true)],
                               loading: true, onRetry: {}, readOnly: true,
                               chooseLabel: "Choose teams", clearSearchLabel: "Clear teams", selectionLabel: { "\($0) teams" })
    _ = view.body
}
#endif
