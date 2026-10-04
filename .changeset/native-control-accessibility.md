---
"@santi020k/lumen-react-native": patch
---

Give native Checkbox an explicit accessible name while preserving host overrides.
Native parity integration also fixes React Native Calendar container sizing and
Compose Button default text/icon content color inheritance.

Expose checked and disabled state for native web checkbox and palette/carousel radio
controls. Default nested React Native and SwiftUI text and icons inherit their button foreground while
explicit tones and colors remain supported. Announce localized DataTable sort direction
and hide stale controls for an empty error message.

Swift quiet buttons now accept taps across their full padded shape, including sparse compound command labels.
