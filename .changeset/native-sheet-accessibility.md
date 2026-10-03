---
"@santi020k/lumen-react-native": minor
"@santi020k/lumen": patch
---

Improve native sheet scrolling, dismissal protection, keyboard integration, and accessibility text
layouts. React Native sheets accept explicit initial and return focus targets. Required-field and
tab-panel descriptions are caller-localizable in React Native and Compose. SwiftUI rows and section
headers stack at accessibility text sizes. SwiftUI and Compose consumers must rebuild for the
updated sheet signatures; application-owned lazy or virtualized sheet content should disable the
additional scrolling wrapper.

Add the optional React Native foundations entrypoint, which shares root implementations and avoids eager full-catalog imports.
