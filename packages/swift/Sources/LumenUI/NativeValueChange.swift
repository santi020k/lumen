import SwiftUI

extension View {
    @ViewBuilder
    func lumenOnValueChange<Value: Equatable>(of value: Value, perform action: @escaping (Value) -> Void) -> some View {
        #if os(visionOS)
        onChange(of: value) { _, next in action(next) }
        #else
        if #available(iOS 17, macOS 14, tvOS 17, watchOS 10, *) {
            onChange(of: value) { _, next in action(next) }
        } else {
            onChange(of: value, perform: action)
        }
        #endif
    }
}
