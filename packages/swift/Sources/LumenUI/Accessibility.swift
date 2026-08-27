import SwiftUI

extension View {
    @ViewBuilder
    func lumenAccessibilityHint(_ hint: LocalizedStringKey?) -> some View {
        if let hint {
            accessibilityHint(hint)
        } else {
            self
        }
    }
}
