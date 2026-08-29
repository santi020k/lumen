# LumenWidgetUI for WidgetKit

`LumenWidgetUI` is a focused Swift Package product for WidgetKit presentation. It contains generated
semantic colors, spacing, and radii plus text, SF Symbol, badge, and compact-stat treatments. It does
not link `LumenUI`, application controls, timelines, App Intents, deep links, or
container-background policy.

Add the `LumenWidgetUI` product to an iOS, macOS, or watchOS widget extension:

```swift
import LumenWidgetUI
import SwiftUI
import WidgetKit

struct StatusWidgetView: View {
    var body: some View {
        VStack(alignment: .leading, spacing: LumenWidgetSpacing.sm) {
            LumenWidgetBadge(
                .verbatim("Ready"),
                iconSystemName: "checkmark.circle.fill",
                tone: .success
            )
            LumenWidgetCompactStat(
                label: .verbatim("Duration"),
                value: .verbatim("01:15"),
                iconSystemName: "timer"
            )
        }
        .containerBackground(for: .widget) { Color.clear }
    }
}
```

The components adapt semantic tones for full-color, accented, and vibrant rendering. Native text
styles preserve Dynamic Type, and badge borders strengthen under Increase Contrast. Applications
still own widget families, timelines, actions, URLs, backgrounds, privacy, and domain state.

visionOS is intentionally not part of the Lumen 2 widget contract. The rendering-mode environment
used by these components starts at visionOS 26, while the main `LumenUI` application product keeps
the broader visionOS 1 baseline.

The initial contract was extracted only after repeated presentation patterns were confirmed in the
maintained Between Contractions status, quick-start, and Mac widgets. Consumer adoption remains a
separate repository change and is not required merely to use Lumen elsewhere in the application.
