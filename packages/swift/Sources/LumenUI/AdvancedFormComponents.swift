#if os(iOS) || os(macOS) || os(visionOS)
import SwiftUI

private struct LumenAdvancedInputStyle: ViewModifier {
    @Environment(\.lumenTheme) private var theme
    let label: String
    let error: String?

    func body(content: Content) -> some View {
        content
            .textFieldStyle(.plain)
            .font(.body)
            .foregroundStyle(theme.colors.ink)
            .padding(.horizontal, LumenSpacing.md)
            .padding(.vertical, LumenSpacing.sm)
            .frame(minHeight: 44)
            .background(theme.colors.surface)
            .clipShape(RoundedRectangle(cornerRadius: LumenRadius.sm))
            .overlay(RoundedRectangle(cornerRadius: LumenRadius.sm).stroke(error == nil ? theme.colors.line : theme.colors.danger))
            .accessibilityLabel(Text(verbatim: label))
            .lumenAccessibilityHint(error.map(LumenTextContent.verbatim))
    }
}

private struct LumenOptionalInputFocus: ViewModifier {
    let focused: FocusState<Bool>.Binding?
    func body(content: Content) -> some View {
        if let focused { content.focused(focused) } else { content }
    }
}

private struct LumenPasswordContentType: ViewModifier {
    let newPassword: Bool
    func body(content: Content) -> some View {
        if #available(macOS 14, *) {
            content.textContentType(newPassword ? .newPassword : .password)
        } else {
            content.textContentType(.password)
        }
    }
}

/// Native secure entry. Copy is application-localized; passwords never become an accessibility value.
public struct LumenPasswordField: View {
    @Binding private var text: String
    @Environment(\.isEnabled) private var isEnabled
    @FocusState private var focused: Bool
    @State private var revealed = false
    private let label: String
    private let description: String?
    private let errorMessage: String?
    private let showLabel: String
    private let hideLabel: String
    private let newPassword: Bool
    private let readOnly: Bool

    public init(_ label: String, text: Binding<String>, description: String? = nil, errorMessage: String? = nil,
                showLabel: String = "Show password", hideLabel: String = "Hide password",
                newPassword: Bool = false, readOnly: Bool = false) {
        self.label = label
        _text = text
        self.description = description
        self.errorMessage = errorMessage
        self.showLabel = showLabel
        self.hideLabel = hideLabel
        self.newPassword = newPassword
        self.readOnly = readOnly
    }

    private var editable: Bool { isEnabled && !readOnly }
    private var secureBinding: Binding<String> {
        Binding(get: { text }, set: { if editable { text = $0 } })
    }

    public var body: some View {
        LumenFieldGroup(.verbatim(label), description: description.map(LumenTextContent.verbatim), errorMessage: errorMessage.map(LumenTextContent.verbatim)) {
            Group {
                if revealed && editable {
                    TextField(text: secureBinding) { Text(verbatim: label) }
                } else {
                    SecureField(text: secureBinding) { Text(verbatim: label) }
                }
            }
            .modifier(LumenPasswordContentType(newPassword: newPassword))
            .autocorrectionDisabled()
            .focused($focused)
            .disabled(!editable)
            .modifier(LumenAdvancedInputStyle(label: label, error: errorMessage))
            LumenButton(.verbatim(revealed && editable ? hideLabel : showLabel), intent: .quiet, disabled: !editable) {
                revealed.toggle()
                focused = true
            }
        }
        .task(id: editable) { if !editable { revealed = false } }
        .task(id: focused) { if !focused { revealed = false } }
    }
}

/// One native editor retains paste, selection and OS one-time-code suggestions.
public struct LumenInputOTP: View {
    @Binding private var text: String
    @Environment(\.isEnabled) private var isEnabled
    private let label: String
    private let description: String?
    private let errorMessage: String?
    private let length: Int
    private let masked: Bool
    private let readOnly: Bool
    private let onComplete: (String) -> Void

    public init(_ label: String, text: Binding<String>, length: Int = 6, description: String? = nil,
                errorMessage: String? = nil, masked: Bool = false, readOnly: Bool = false,
                onComplete: @escaping (String) -> Void = { _ in }) {
        precondition(normalizeLumenNumericOTP(text.wrappedValue, length: length) == text.wrappedValue,
                     "OTP value must contain at most length ASCII digits")
        self.label = label
        _text = text
        self.length = length
        self.description = description
        self.errorMessage = errorMessage
        self.masked = masked
        self.readOnly = readOnly
        self.onComplete = onComplete
    }

    private var codeBinding: Binding<String> {
        Binding(get: { text }, set: { proposal in
            guard isEnabled && !readOnly, let normalized = normalizeLumenNumericOTP(proposal, length: length), normalized != text else { return }
            text = normalized
            if normalized.count == length { onComplete(normalized) }
        })
    }

    public var body: some View {
        LumenFieldGroup(.verbatim(label), description: description.map(LumenTextContent.verbatim), errorMessage: errorMessage.map(LumenTextContent.verbatim)) {
            Group {
                if masked { SecureField(text: codeBinding) { Text(verbatim: label) } }
                else { TextField(text: codeBinding) { Text(verbatim: label) } }
            }
            #if os(iOS) || os(visionOS)
            .keyboardType(.numberPad)
            .textContentType(.oneTimeCode)
            #endif
            .autocorrectionDisabled()
            .disabled(!isEnabled || readOnly)
            .modifier(LumenAdvancedInputStyle(label: label, error: errorMessage))
        }
    }
}

/// Exact, localized ungrouped decimal drafts; configuration uses ASCII decimal strings.
public struct LumenNumberField: View {
    @Binding private var text: String
    @Environment(\.isEnabled) private var isEnabled
    @Environment(\.locale) private var locale
    private let label: String
    private let description: String?
    private let errorMessage: String?
    private let configuration: LumenNumberConfiguration
    private let invalidNumberLabel: String
    private let outOfRangeLabel: String
    private let incrementLabel: String
    private let decrementLabel: String
    private let showStepper: Bool
    private let readOnly: Bool
    private let focused: FocusState<Bool>.Binding?

    public init(_ label: String, text: Binding<String>, min: String? = nil, max: String? = nil, step: String = "1",
                description: String? = nil, errorMessage: String? = nil, invalidNumberLabel: String = "Enter a valid number",
                outOfRangeLabel: String = "Enter a number within the allowed range", incrementLabel: String = "Increase value",
                decrementLabel: String = "Decrease value", showStepper: Bool = true, readOnly: Bool = false, focused: FocusState<Bool>.Binding? = nil) {
        self.label = label
        _text = text
        configuration = LumenNumberConfiguration(min: min, max: max, step: step)
        self.description = description
        self.errorMessage = errorMessage
        self.invalidNumberLabel = invalidNumberLabel
        self.outOfRangeLabel = outOfRangeLabel
        self.incrementLabel = incrementLabel
        self.decrementLabel = decrementLabel
        self.showStepper = showStepper
        self.readOnly = readOnly
        self.focused = focused
    }

    private var draft: LumenDecimalDraft { parseLumenDecimalDraft(text, locale: locale) }
    private var message: String? {
        if let errorMessage { return errorMessage }
        switch draft {
        case .empty: return nil
        case .incomplete, .invalid: return invalidNumberLabel
        case let .valid(value): return configuration.contains(value) ? nil : outOfRangeLabel
        }
    }
    private func stepped(_ direction: Int) -> String? { configuration.stepped(draft, direction: direction, locale: locale) }
    private func canStep(_ direction: Int) -> Bool {
        guard isEnabled && !readOnly, let proposal = stepped(direction) else { return false }
        guard case let .valid(current) = draft, case let .valid(next) = parseLumenDecimalDraft(proposal, locale: locale) else { return true }
        return current.compared(to: next) != 0
    }
    private var draftBinding: Binding<String> { Binding(get: { text }, set: { if isEnabled && !readOnly { text = $0 } }) }

    public var body: some View {
        LumenFieldGroup(.verbatim(label), description: description.map(LumenTextContent.verbatim), errorMessage: message.map(LumenTextContent.verbatim)) {
            TextField(text: draftBinding) { Text(verbatim: label) }
                #if os(iOS) || os(visionOS)
                .keyboardType(.decimalPad)
                #endif
                .disabled(!isEnabled || readOnly)
                .modifier(LumenAdvancedInputStyle(label: label, error: message))
                .modifier(LumenOptionalInputFocus(focused: focused))
            if showStepper {
                LumenButtonGroup {
                    LumenButton(.verbatim(decrementLabel), intent: .quiet, disabled: !canStep(-1)) {
                        if canStep(-1), let value = stepped(-1) { text = value }
                    }
                    LumenButton(.verbatim(incrementLabel), intent: .quiet, disabled: !canStep(1)) {
                        if canStep(1), let value = stepped(1) { text = value }
                    }
                }
            }
        }
    }
}

public struct LumenAutocompleteOption<Value: Hashable>: Identifiable {
    public let value: Value
    public let label: String
    public let description: String?
    public let disabled: Bool
    public var id: Value { value }

    public init(value: Value, label: String, description: String? = nil, disabled: Bool = false) {
        self.value = value
        self.label = label
        self.description = description
        self.disabled = disabled
    }
}

/// The application supplies filtered results and owns requests, cancellation and selection policy.
public struct LumenAutocomplete<Value: Hashable>: View {
    @Binding private var query: String
    @Binding private var selection: Value?
    @Environment(\.isEnabled) private var isEnabled
    @FocusState private var focused: Bool
    @State private var expanded = false
    private let label: String
    private let options: [LumenAutocompleteOption<Value>]
    private let description: String?
    private let errorMessage: String?
    private let loading: Bool
    private let resultsErrorMessage: String?
    private let onRetry: (() -> Void)?
    private let loadingLabel: String
    private let emptyLabel: String
    private let retryLabel: String
    private let dismissLabel: String
    private let readOnly: Bool

    public init(_ label: String, query: Binding<String>, selection: Binding<Value?>, options: [LumenAutocompleteOption<Value>],
                description: String? = nil, errorMessage: String? = nil, loading: Bool = false, resultsErrorMessage: String? = nil,
                onRetry: (() -> Void)? = nil, loadingLabel: String = "Loading results", emptyLabel: String = "No results",
                retryLabel: String = "Retry", dismissLabel: String = "Close results", readOnly: Bool = false) {
        precondition(Set(options.map(\.value)).count == options.count, "Autocomplete values must be unique")
        self.label = label
        _query = query
        _selection = selection
        self.options = options
        self.description = description
        self.errorMessage = errorMessage
        self.loading = loading
        self.resultsErrorMessage = resultsErrorMessage
        self.onRetry = onRetry
        self.loadingLabel = loadingLabel
        self.emptyLabel = emptyLabel
        self.retryLabel = retryLabel
        self.dismissLabel = dismissLabel
        self.readOnly = readOnly
    }
    private var editable: Bool { isEnabled && !readOnly }
    private var queryBinding: Binding<String> { Binding(get: { query }, set: { if editable { query = $0; expanded = true } }) }

    public var body: some View {
        LumenFieldGroup(.verbatim(label), description: description.map(LumenTextContent.verbatim), errorMessage: errorMessage.map(LumenTextContent.verbatim)) {
            TextField(text: queryBinding) { Text(verbatim: label) }
                .focused($focused)
                .disabled(!editable)
                .modifier(LumenAdvancedInputStyle(label: label, error: errorMessage))
                .onTapGesture { if editable { expanded = true } }
            if expanded && editable { results }
        }
        .task(id: focused) { if focused && editable { expanded = true } }
        .task(id: editable) { if !editable { expanded = false } }
    }

    @ViewBuilder private var results: some View {
        if loading { LumenSpinner(.verbatim(loadingLabel)) }
        else if let resultsErrorMessage {
            LumenText(.verbatim(resultsErrorMessage))
            if let onRetry { LumenButton(.verbatim(retryLabel), intent: .quiet, action: onRetry) }
        } else if options.isEmpty { LumenText(.verbatim(emptyLabel)) }
        else {
            ScrollView {
                VStack(alignment: .leading, spacing: LumenSpacing.xs) {
                    ForEach(options) { option in
                        LumenButton(intent: .quiet, disabled: option.disabled) {
                            guard editable && !loading && !option.disabled else { return }
                            query = option.label
                            selection = option.value
                            expanded = false
                        } label: {
                            VStack(alignment: .leading) {
                                Text(verbatim: option.label)
                                if let description = option.description { Text(verbatim: description).font(.caption) }
                            }
                        }
                        .accessibilityAddTraits(selection == option.value ? .isSelected : [])
                    }
                }
            }.frame(maxHeight: 240)
        }
        LumenButton(.verbatim(dismissLabel), intent: .quiet) { expanded = false }
    }
}

public struct LumenTimeField: View {
    @Binding private var selection: LumenTimeSelection?
    @Environment(\.isEnabled) private var isEnabled
    @Environment(\.locale) private var locale
    @State private var presented = false
    @State private var draft = LumenTimeSelection(hour: 0, minute: 0)
    private let label: String
    private let minTime: LumenTimeSelection?
    private let maxTime: LumenTimeSelection?
    private let description: String?
    private let errorMessage: String?
    private let placeholder: String
    private let confirmLabel: String
    private let dismissLabel: String
    private let rangeErrorLabel: String
    private let readOnly: Bool

    public init(_ label: String, selection: Binding<LumenTimeSelection?>, minTime: LumenTimeSelection? = nil,
                maxTime: LumenTimeSelection? = nil, description: String? = nil, errorMessage: String? = nil,
                placeholder: String = "Choose a time", confirmLabel: String = "Confirm", dismissLabel: String = "Cancel",
                rangeErrorLabel: String = "Choose a time within the allowed range", readOnly: Bool = false) {
        if let minTime, let maxTime { precondition(minTime.minutes <= maxTime.minutes, "Time bounds must be ordered within one day") }
        self.label = label
        _selection = selection
        self.minTime = minTime
        self.maxTime = maxTime
        self.description = description
        self.errorMessage = errorMessage
        self.placeholder = placeholder
        self.confirmLabel = confirmLabel
        self.dismissLabel = dismissLabel
        self.rangeErrorLabel = rangeErrorLabel
        self.readOnly = readOnly
    }
    private var editable: Bool { isEnabled && !readOnly }
    private var valid: Bool { draft.isInBounds(min: minTime, max: maxTime) }
    private var display: String {
        guard let selection else { return placeholder }
        let formatter = DateFormatter()
        formatter.locale = locale
        formatter.dateStyle = .none
        formatter.timeStyle = .short
        return formatter.string(from: selection.date)
    }
    private var dateBinding: Binding<Date> { Binding(get: { draft.date }, set: { draft = LumenTimeSelection(date: $0) }) }

    public var body: some View {
        LumenFieldGroup(.verbatim(label), description: description.map(LumenTextContent.verbatim), errorMessage: errorMessage.map(LumenTextContent.verbatim)) {
            LumenButton(.verbatim(display), intent: .secondary, disabled: !editable) {
                draft = selection.flatMap { $0.isInBounds(min: minTime, max: maxTime) ? $0 : nil } ?? minTime ?? LumenTimeSelection(hour: 0, minute: 0)
                presented = true
            }
            .accessibilityLabel(Text(verbatim: label))
            .accessibilityValue(Text(verbatim: display))
        }
        .lumenSheet(isPresented: $presented, actions: {
            LumenButtonGroup {
                LumenButton(.verbatim(dismissLabel), intent: .quiet) { presented = false }
                LumenButton(.verbatim(confirmLabel), disabled: !editable || !valid) {
                    if editable && valid { selection = draft; presented = false }
                }
            }
        }) {
            DatePicker(selection: dateBinding, displayedComponents: .hourAndMinute) { Text(verbatim: label) }
                .disabled(!editable)
            if !valid { LumenText(.verbatim(rangeErrorLabel), tone: .danger) }
        }
        .task(id: editable) { if !editable { presented = false } }
    }
}
#endif
