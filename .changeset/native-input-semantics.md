---
"@santi020k/lumen-react-native": patch
"@santi020k/lumen": patch
---

Expose disabled accessibility state consistently from React Native text fields, textareas, search
fields, chip removal actions, and phone inputs, including country selectors with an empty allow-list.
Preserve caller-supplied accessibility state and prevent buttons from being assigned a non-button
accessibility role. Run rendered TSX component behavior tests in the standard React Native package
suite so these semantics remain covered in CI. Announce validation context from React Native date,
phone, and multiline controls without dropping consumer accessibility props, and keep SwiftUI
textarea values distinct from their validation hints.
