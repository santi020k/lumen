<p align="center">
  <a href="https://lumen.santi020k.com">
    <img src="https://raw.githubusercontent.com/santi020k/lumen/main/apps/docs/public/logo.svg" alt="Lumen UI" width="233" height="60">
  </a>
</p>

<h1 align="center">Lumen UI · WidgetKit</h1>

<p align="center">Semantic presentation · Compact stats · Widget-safe foundations</p>

<p align="center">
  <a href="https://github.com/santi020k/lumen/tree/main/packages/swift-widget"><img src="https://img.shields.io/badge/platform-WidgetKit-0369a0?style=flat-square" alt="WidgetKit package"></a>
  <a href="https://github.com/santi020k/lumen/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-13967e?style=flat-square" alt="MIT license"></a>
</p>

<p align="center">
  <a href="https://lumen.santi020k.com/docs/apple">Documentation</a>
  ·
  <a href="https://github.com/santi020k/lumen/tree/main/packages/swift-widget">Source</a>
  ·
  <a href="https://github.com/santi020k/lumen/issues">Issues</a>
</p>

**Package:** `LumenWidgetUI for WidgetKit`

**On this page:** [Install](#install) · [Usage](#usage) · [Resources](#resources)

---

`LumenWidgetUI` is a focused Swift Package product for WidgetKit presentation. It contains generated
semantic colors, spacing, and radii plus text, SF Symbol, badge, and compact-stat treatments. It does
not link `LumenUI`, application controls, timelines, App Intents, deep links, or
container-background policy.

## Install

In Xcode, add `https://github.com/santi020k/lumen` through **File → Add Package Dependencies**.
Follow the [Swift package installation policy](https://github.com/santi020k/lumen/blob/main/packages/swift/README.md)
for the current version and reproducible resolution. Choose the `LumenWidgetUI` product for the
widget extension target. The package requires Swift 6; check the native compatibility guide below
for platform support.

## Usage

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

## Resources

| Guide | What you will find |
| --- | --- |
| [Swift package installation](https://github.com/santi020k/lumen/blob/main/packages/swift/README.md) | Reference for swift package installation. |
| [Native compatibility](https://github.com/santi020k/lumen/blob/main/docs/native-compatibility.md) | Reference for native compatibility. |
| [Contributing](https://github.com/santi020k/lumen/blob/main/CONTRIBUTING.md) | Setup, checks, and contribution workflow. |
| [Release history](https://github.com/santi020k/lumen/releases) | Published releases and version notes. |

Part of [Lumen UI](https://lumen.santi020k.com), created by [Santiago Molina](https://santi020k.com).
Licensed under [MIT](https://github.com/santi020k/lumen/blob/main/LICENSE); third-party artwork retains its own notices.
