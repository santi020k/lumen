# LumenUI for SwiftUI

`LumenUI` is Lumen's native SwiftUI package. Its foundations are generated from the same canonical
design tokens as the web, React Native, and Compose adapters.

```swift
import LumenUI

struct AppRoot: View {
    var body: some View {
        LumenSurface {
            LumenText("Welcome", variant: .title)
            LumenButton("Continue", action: continueFlow)
        }
            .lumenTheme(.dark)
    }
}
```

The initial native set includes Text, Surface, Button, TextField, Badge, Divider, and Spinner.
Components preserve Dynamic Type, SwiftUI environment behavior, and native accessibility instead
of reproducing DOM behavior.
