#if os(iOS) || os(macOS) || os(visionOS)
import SwiftUI

func toggleLumenMultiSelection(_ values: Set<String>, value: String) -> Set<String> {
    var proposal = values
    if proposal.contains(value) { proposal.remove(value) } else { proposal.insert(value) }
    return proposal
}

/// Immediate controlled selection; the application supplies search results and owns requests.
public struct LumenMultiSelect: View {
    @Binding private var values: Set<String>
    @Binding private var query: String
    @Environment(\.isEnabled) private var isEnabled
    @State private var open = false
    private let label: String
    private let options: [LumenAutocompleteOption<String>]
    private let description: String?
    private let errorMessage: String?
    private let loading: Bool
    private let resultsErrorMessage: String?
    private let onRetry: (() -> Void)?
    private let readOnly: Bool
    private let chooseLabel: String
    private let searchLabel: String
    private let clearSearchLabel: String
    private let doneLabel: String
    private let emptyLabel: String
    private let loadingLabel: String
    private let retryLabel: String
    private let selectionLabel: (Int) -> String
    private let removeLabel: (String) -> String

    public init(_ label: String, values: Binding<Set<String>>, query: Binding<String>, options: [LumenAutocompleteOption<String>],
                description: String? = nil, errorMessage: String? = nil, loading: Bool = false, resultsErrorMessage: String? = nil,
                onRetry: (() -> Void)? = nil, readOnly: Bool = false, chooseLabel: String = "Choose options",
                searchLabel: String = "Search options", clearSearchLabel: String = "Clear search", doneLabel: String = "Done",
                emptyLabel: String = "No matching options", loadingLabel: String = "Loading options", retryLabel: String = "Retry",
                selectionLabel: @escaping (Int) -> String = { "\($0) selected" },
                removeLabel: @escaping (String) -> String = { "Remove \($0)" }) {
        precondition(Set(options.map(\.value)).count == options.count, "MultiSelect values must be unique")
        precondition(options.allSatisfy { !$0.value.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty && !$0.label.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty }, "MultiSelect values and labels must be nonempty")
        self.label = label
        _values = values
        _query = query
        self.options = options
        self.description = description
        self.errorMessage = errorMessage
        self.loading = loading
        self.resultsErrorMessage = resultsErrorMessage
        self.onRetry = onRetry
        self.readOnly = readOnly
        self.chooseLabel = chooseLabel
        self.searchLabel = searchLabel
        self.clearSearchLabel = clearSearchLabel
        self.doneLabel = doneLabel
        self.emptyLabel = emptyLabel
        self.loadingLabel = loadingLabel
        self.retryLabel = retryLabel
        self.selectionLabel = selectionLabel
        self.removeLabel = removeLabel
    }

    private var editable: Bool { isEnabled && !readOnly }
    private var presentation: Binding<Bool> { Binding(get: { open && editable }, set: { open = $0 && editable }) }
    private var queryBinding: Binding<String> { Binding(get: { query }, set: { if editable { query = $0 } }) }

    public var body: some View {
        LumenFieldGroup(.verbatim(label), description: description.map(LumenTextContent.verbatim), errorMessage: errorMessage.map(LumenTextContent.verbatim)) {
            LumenButton(.verbatim("\(chooseLabel) · \(selectionLabel(values.count))"), intent: .secondary) {
                if editable { open = true }
            }
            .disabled(!editable)
            ForEach(values.sorted(), id: \.self) { value in
                let option = options.first { $0.value == value }
                LumenButton(.verbatim(removeLabel(option?.label ?? value)), intent: .quiet) {
                    if editable && option?.disabled != true { values.remove(value) }
                }
                .accessibilityLabel(Text(verbatim: removeLabel(option?.label ?? value)))
                .disabled(!editable || option?.disabled == true)
            }
        }
        .task(id: editable) { if !editable { open = false } }
        .lumenSheet(isPresented: presentation, title: LocalizedStringKey(label), scrollable: false, actions: {
            LumenButton(.verbatim(doneLabel)) { open = false }
        }) {
            VStack(alignment: .leading, spacing: LumenSpacing.md) {
                LumenSearchField(searchLabel, text: queryBinding, clearLabel: clearSearchLabel)
                    .accessibilityLabel(Text(verbatim: searchLabel))
                results
            }
        }
    }

    @ViewBuilder private var results: some View {
        if loading { LumenSpinner(.verbatim(loadingLabel)) }
        else if let resultsErrorMessage {
            LumenText(.verbatim(resultsErrorMessage))
            if let onRetry { LumenButton(.verbatim(retryLabel)) { if editable { onRetry() } } }
        } else if options.isEmpty { LumenText(.verbatim(emptyLabel)) }
        else {
            ScrollView {
                LazyVStack(alignment: .leading, spacing: LumenSpacing.sm) {
                    ForEach(options) { option in
                        LumenCheckbox(option.label, isChecked: Binding(get: { values.contains(option.value) }, set: { _ in
                            if editable && !option.disabled { values = toggleLumenMultiSelection(values, value: option.value) }
                        }), description: option.description)
                        .disabled(!editable || option.disabled)
                    }
                }
            }
            .frame(maxHeight: 280)
        }
    }
}
#endif
