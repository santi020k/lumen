#if os(macOS)
import SwiftUI

private struct PlaygroundDestinationKey: FocusedValueKey {
    typealias Value = Binding<PlaygroundDestination>
}

extension FocusedValues {
    var playgroundDestination: Binding<PlaygroundDestination>? {
        get { self[PlaygroundDestinationKey.self] }
        set { self[PlaygroundDestinationKey.self] = newValue }
    }
}

extension PlaygroundDestination {
    var keyboardShortcut: KeyEquivalent {
        switch self {
        case .home: "1"
        case .examples: "2"
        case .components: "3"
        case .settings: "4"
        }
    }
}

struct PlaygroundMacCommands: Commands {
    @FocusedValue(\.playgroundDestination) private var destination
    @Environment(\.openURL) private var openURL

    var body: some Commands {
        CommandGroup(after: .appSettings) {
            Button("Settings…") {
                destination?.wrappedValue = .settings
            }
            .keyboardShortcut(",", modifiers: .command)
            .disabled(destination == nil)
        }

        CommandMenu("Navigate") {
            ForEach(PlaygroundDestination.allCases) { item in
                Button(item.title) {
                    destination?.wrappedValue = item
                }
                .keyboardShortcut(item.keyboardShortcut, modifiers: .command)
                .disabled(destination == nil)
            }
        }

        CommandGroup(replacing: .help) {
            Button("Lumen Playground Guide") {
                if let url = URL(string: "https://lumen.santi020k.com/docs/apple/playground") {
                    openURL(url)
                }
            }
            Button("Lumen Component Documentation") {
                if let url = URL(string: "https://lumen.santi020k.com/docs/apple") {
                    openURL(url)
                }
            }
        }
    }
}
#endif
