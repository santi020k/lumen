#if os(macOS)
import AppKit
import SwiftUI
import Testing
@testable import LumenUI

@MainActor
@Test("Menu picker reserves space for its selected option without a custom value label")
func pickerSelectedOptionRemainsVisible() {
    for selection in [0, 1] {
        let picker = LumenPicker("Theme", selection: .constant(selection), style: .menu, showsLabel: false) {
            Text("Normal").tag(0)
            Text("A longer descriptive appearance preset").tag(1)
        }
        let reference = Picker("Theme", selection: .constant(selection)) {
            Text("Normal").tag(0)
            Text("A longer descriptive appearance preset").tag(1)
        }.pickerStyle(.menu).labelsHidden()
        let actualWidth = NSHostingView(rootView: picker.fixedSize()).fittingSize.width
        let expectedWidth = NSHostingView(rootView: reference.fixedSize()).fittingSize.width
        #expect(expectedWidth > 40)
        #expect(abs(actualWidth - expectedWidth) < 1)
    }
}
#endif
