# Native documentation previews

These native hosts generate the screenshots used by the platform documentation. They import
Lumen's real platform packages; they do not recreate the components with HTML or CSS.

- `apple` renders the local `LumenUI` Swift package with SwiftUI's `ImageRenderer`.
- `android-compose` runs the local `lumen-compose` module in an Android application.
- React Native captures come from `apps/playground-react-native`, which runs the local
  `@santi020k/lumen-react-native` package through Expo on Android, iOS, and web.

The distributable, interactive galleries live in `apps/playground-apple`,
`apps/playground-android`, and `apps/playground-react-native`. These smaller hosts remain focused on
repeatable documentation image generation.

The committed images live in `apps/docs/public/native-previews` so documentation builds do not need
Xcode or the Android SDK.
