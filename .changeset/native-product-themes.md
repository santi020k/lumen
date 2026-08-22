---
'@santi020k/lumen': minor
'@santi020k/lumen-mcp': patch
---

Let SwiftUI and Compose applications integrate product-owned themes through public native APIs.
Swift palettes now have a public initializer and can be injected without forcing the preferred
system appearance. Compose can map an existing Material 3 color scheme into Lumen semantic roles,
preserve explicit product colors, and reuse product typography and shapes through one provider.
Move consumable Compose plugin versions to the standalone settings boundary, enforce Android lint
warnings as errors, refresh the native toolchain baseline, and document release-pinned installation.
