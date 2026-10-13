---
"@santi020k/lumen": minor
---

Preserve the host application's appearance when SwiftUI `lumenTheme` uses
`enforceColorScheme: false`. Caller light/dark preferences now work in either modifier order,
including with tint disabled, while Lumen keeps the supplied semantic palette. Explicit appearance
enforcement retains its existing behavior. Includes hosted-view regression coverage for caller
preferences and inherited light/dark host appearance.
