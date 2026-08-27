# Native playgrounds

Lumen includes a native playground for each adapter. Use these apps to evaluate the real components,
capture documentation screenshots, and prepare distributable marketing builds. The Apple and Android
playgrounds are organized as polished reference applications with Home, Examples, Components, and
Settings. Their Components destinations retain the searchable deterministic catalogs used by capture
scripts, while normal launches add category discovery, interactive patterns, and adaptive layouts.
Each gallery is generated from the current shared and platform-specific contract registry rather
than a hand-maintained component total. The galleries cover semantic Card variants, multiline and
grouped forms, chips, action groups, transient feedback, metrics, rows, empty states, and light/dark
theme behavior. Every phone gallery exercises Picker, Slider, Gauge, DateField, and DateRangeField
through its platform implementation. The galleries also demonstrate React Native pull-to-refresh,
the Compose floating action button and adaptive navigation scaffold, Apple tab accessories, and two
intentionally macOS-specific controls.

The native Apple and Android galleries are also prepared as one public **Lumen Playground** product.
See [Publishing Lumen Playground](playground-publication.md) for listing copy, shared assets,
privacy declarations, signed release candidates, staged testing, and production gates.

## First-time repository setup

Install the shared repository dependencies before running any playground:

```bash
git clone https://github.com/santi020k/lumen.git
cd lumen
corepack enable
pnpm install
```

Use Node.js 22.19 or newer. The Apple playground additionally needs macOS and Xcode. The Android
playground needs Android Studio, Android SDK 37, and JDK 21. The packed React Native Android smoke
test also supports Android Studio's newer bundled JDK by enabling the native access required by
Expo's CMake configuration step.

Choose one platform below after the installation completes. You do not need an Expo, Apple
Developer, or Google Play account to run the local galleries.

## React Native and Expo

### Run locally

Start the Expo development server from the repository root:

```bash
pnpm playground:react-native
```

The terminal shows a QR code and keyboard shortcuts:

- Scan the QR code with Expo Go to open the app on a physical device.
- Press `i` to open the iOS simulator. This requires macOS and Xcode.
- Press `a` to open an Android emulator. Start an emulator in Android Studio first.
- Press `w` to open the React Native Web version in a browser.

To start the browser target directly, run:

```bash
pnpm playground:react-native:web
```

With that server running, capture every documented React Native component from another terminal:

```bash
pnpm playground:react-native:capture
```

Create a static web export with:

```bash
pnpm --filter @santi020k/lumen-playground-react-native run build
```

The static site is written to `apps/playground-react-native/dist`.

### Open or publish the Expo Go playground

The public React Native playground is distributed through Expo Go instead of the App Store or
Google Play. Open this stable link on a device with Expo Go installed; it always resolves to the
latest update on the `expo-go` branch:

```text
exp://u.expo.dev/669035f0-04c0-41cd-9ca6-73d99bdb7dce/branch/01a03c76-64c5-7c07-ba75-43f815735357
```

The playground currently targets Expo SDK 57. Expo Go must support the same SDK to load it. As of
August 2026, the public Expo Go store client targets SDK 54, so this link is not yet a reliable
general-public installation path. Wait for SDK 57 support or create and validate a deliberately
separate SDK 54 compatibility app before promoting it broadly.

After validating a new playground version, publish it from an authenticated Expo session:

```bash
pnpm --filter @santi020k/lumen-playground-react-native run publish:expo-go -- --message "Describe the update"
```

The project is owned by the `santi020k` Expo account. Keep `runtimeVersion`, `updates.url`, and the
EAS project identifier in `app.json`; the Expo Go launch link depends on that project and branch.
Run the app's `generate:assets` script whenever the shared Lumen playground icon artwork changes.

### Create an APK or store build

Remote builds use Expo Application Services. The package scripts run the repository's verified EAS
CLI version without installing it into the Expo app. Authenticate and connect the app once:

```bash
cd apps/playground-react-native
pnpm dlx eas-cli@22.4.0 login
pnpm dlx eas-cli@22.4.0 init
```

After `eas init`, keep the generated EAS project identifier in `app.json`. Build a directly
installable Android APK with:

```bash
pnpm run build:android:apk
```

The checked-in `eas.json` provides three profiles:

- `development` creates an internal development client.
- `preview` creates a directly installable Android APK.
- `production` creates store-ready Android and iOS artifacts.

Run `pnpm run build:android:store` for a production Android artifact or `pnpm run build:ios` for an
iOS archive. EAS requests the relevant Google or Apple signing credentials during the first
production build.

## Apple and SwiftUI

### Install LumenUI in another Xcode project

1. In Xcode, choose File → Add Package Dependencies.
2. Paste `https://github.com/santi020k/lumen` into the search field.
3. Choose Exact Version and enter `1.7.0-rc.0`. Use Up to Next Major Version from `1.7.0-rc.0` only when the
   application intentionally accepts compatible updates; reserve `main` for local evaluation.
4. Select the `LumenUI` product and add it to your application target.
5. Add `import LumenUI` to the SwiftUI view that uses Lumen components.
6. Apply `.lumenTheme(.light)`, `.lumenTheme(.dark)`, or your chosen theme near the root view.

LumenUI is a Swift Package. It does not require npm, CocoaPods, or copying the Swift sources into
the application. Commit `Package.resolved` and verify its version and revision match the intended
release tag before shipping.

### Run on an iOS simulator

1. Open `apps/playground-apple/LumenApplePlayground.xcodeproj` in Xcode.
2. Wait for Xcode to resolve the local `LumenUI` Swift package.
3. Select the `LumenApplePlayground` scheme.
4. Choose an iPhone simulator from the run destination menu.
5. Press Run or use `Command-R`.

Simulator builds do not require an Apple Developer account or a signing team.

### Run the macOS gallery

Build and launch the same gallery as a local Swift Package executable:

```bash
pnpm playground:apple:build
swift run --package-path apps/playground-apple LumenApplePlayground
```

To exercise the distributable application target, open
`apps/playground-apple/LumenApplePlayground.xcodeproj`, select `LumenMacPlayground`, choose **My Mac**,
and press Run. This target shares the gallery implementation with the package executable and adds
the App Sandbox bundle used for TestFlight and Mac App Store archives.

### Install on a device or publish to TestFlight

For a physical device or TestFlight build:

1. Open the project in Xcode and select the application target.
2. Open Signing & Capabilities and select your Apple Developer team.
3. Replace the default bundle identifier if it is not available to your team.
4. Select Any iOS Device as the destination.
5. Choose Product → Archive, then Distribute App from the Organizer window.

`project.yml` is the source for the generated Xcode project. After changing project structure,
install XcodeGen and regenerate the project:

```bash
cd apps/playground-apple
brew install xcodegen
xcodegen generate
```

Commit both `project.yml` and the generated Xcode project when its structure changes.

## Android and Compose

### Run from Android Studio

1. Open Android Studio and choose Open.
2. Select `apps/playground-android`, not the repository root.
3. Allow the Gradle project and Android SDK to synchronize.
4. Create or start an Android emulator, or connect a device with USB debugging enabled.
5. Select the `app` run configuration and press Run.

The phone playground opens as an adaptive reference application with Home, Examples, Components,
and Settings destinations. Components retains the searchable catalog used by documentation capture
automation; launches with the `component` intent extra continue to open that filtered catalog
directly. Normal launches add category filters, three interactive example patterns, and responsive
two-pane layouts beside the tablet navigation rail. The playground references `packages/compose` as
a local Gradle module, so no Maven installation is required inside this repository.

### Build and install the debug APK

From the repository root, run:

```bash
pnpm playground:android:build
```

The APK is written to:

```text
apps/playground-android/app/build/outputs/apk/debug/app-debug.apk
```

Install it on a connected device with Android Debug Bridge:

```bash
adb install -r apps/playground-android/app/build/outputs/apk/debug/app-debug.apk
```

Debug APKs do not require a keystore or Google Play account.

### Publish through Google Play

Google Play requires a signed release Android App Bundle rather than the debug APK. Configure a
release keystore outside the repository, add a release signing configuration, then generate the
bundle from Android Studio with Build → Generate Signed App Bundle or APK. Upload the resulting
`.aab` file to a Play Console application.

The repository intentionally does not contain production keystores, passwords, Apple certificates,
Expo credentials, or store account identifiers.

## Installing Lumen in another application

The playgrounds consume local workspace packages. Applications outside this repository install or
link the platform package differently:

- React Native installs `@santi020k/lumen-react-native` from npm and mounts one `LumenProvider`.
- Apple applications add `https://github.com/santi020k/lumen` through Swift Package Manager and
  select the `LumenUI` product.
- Android applications install `com.santi020k:lumen-compose:0.5.0` from Maven Central. The repository
  playground intentionally references the local module so it can exercise unreleased changes.

See the corresponding React Native, Apple, or Android documentation page for complete application
integration examples.

## Documentation captures

Use stable light-theme content, default font scaling, and the same representative state when
capturing documentation images. React Native Web is interactive and useful for experimentation,
but Android emulator and iOS simulator captures remain the source of truth for native rendering.

Per-component documentation should pair a native capture with its platform code example. Avoid
cropping away focus, loading, error, or disabled state when that state is the subject of the page.

After capturing all three adapters, optimize the PNG sources into the checked-in WebP gallery and
refresh its integrity manifest:

```bash
pnpm run sync:native-captures
pnpm run check:native-captures
```

The PR workflow regenerates the React Native, iPhone, and Android phone captures on their matching
runners and compares normalized output with the committed gallery. macOS, watchOS, and Wear OS
captures remain represented in the manifest and are checked for coverage; regenerate those
specialized targets with their package scripts when their implementations change.
