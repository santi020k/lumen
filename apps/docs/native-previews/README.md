# Native documentation previews

These native hosts generate the screenshots used by the platform documentation. They import
Lumen's real platform packages; they do not recreate the components with HTML or CSS.

- `apple` renders the local `LumenUI` Swift package with SwiftUI's `ImageRenderer`.
- `android-compose` runs the local `lumen-compose` module in an Android application.
- React Native is captured from a React Native Community CLI Android host using the local
  `@santi020k/lumen-react-native` package. The host is disposable because the CLI owns its native
  scaffold; the resulting capture is committed alongside the other previews.

The committed images live in `apps/docs/public/native-previews` so documentation builds do not need
Xcode or the Android SDK.
