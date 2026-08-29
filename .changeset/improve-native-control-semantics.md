---
'@santi020k/lumen-react-native': patch
'@santi020k/lumen': patch
'@santi020k/lumen-mcp': patch
---

Improve native control semantics and accessibility: preserve semantic SwiftUI button roles,
expose loading icon buttons and spinner tints, keep disabled quiet Compose buttons transparent,
allow status messages to reflow, make the full React Native toggle row interactive, preserve its
supporting guidance, and give native selection rows and search actions density-aware targets.
Keep compact chip removal independently operable with an explicit WCAG-sized target, and ensure
React Native toast and banner dismissal controls meet native touch-target guidance. Align native
live feedback for toast and field-group validation updates, and keep Compose required labels to one
unambiguous accessibility description.
