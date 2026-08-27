import SwiftUI

enum LumenValidationState {
    static func isInvalid(error: Bool, errorMessage: String?) -> Bool {
        error || errorMessage != nil
    }

    static func message(error: Bool, errorMessage: String?) -> String? {
        guard isInvalid(error: error, errorMessage: errorMessage) else { return nil }

        return errorMessage ?? "Invalid value"
    }
}

extension View {
    @ViewBuilder
    func lumenAccessibilityHint(_ hint: LocalizedStringKey?) -> some View {
        if let hint {
            accessibilityHint(hint)
        } else {
            self
        }
    }

    @ViewBuilder
    func lumenAccessibilityHint(_ hint: String?) -> some View {
        if let hint {
            accessibilityHint(Text(verbatim: hint))
        } else {
            self
        }
    }
}
