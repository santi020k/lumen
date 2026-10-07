# SwiftUI Setup

Add `https://github.com/santi020k/lumen` with Swift Package Manager and link the `LumenUI`
product to the application target. Preserve an existing version or revision pin for ordinary UI
work. For initial adoption, verify that the selected release tag exists and supports the required
Apple platforms before pinning it; keep `Package.resolved` aligned. Use a branch or candidate
revision only for explicitly requested development evaluation, and identify that revision in the
handoff. A workspace version does not prove a release tag has been published.

Then import and theme near the root:

```swift
import LumenUI

struct AppRoot: View {
    var body: some View {
        LumenSurface {
            LumenText("Welcome", variant: .title)
            LumenButton("Continue", action: continueFlow)
        }
        .lumenTheme(.light)
    }
}
```

Preserve SwiftUI navigation, bindings, environment values, Dynamic Type, VoiceOver, and SF Symbols.
Do not reproduce DOM props or CSS concepts. Confirm whether a component is shared across Apple
platforms or limited to macOS before using it.
