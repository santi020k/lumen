# Native compatibility matrix

This matrix records Lumen's declared native baselines and the toolchains used to verify them. A
successful build proves source and dependency compatibility for that target; physical-device
accessibility evidence is tracked separately in the
[native device validation matrix](native-device-validation.md).

## Supported baselines

| Adapter | Consumer baseline | Library toolchain | Automated evidence |
| --- | --- | --- | --- |
| React Native | React 19.2+, React Native 0.86.2+, React Native SVG 12–15, iOS 15.1+, and Android API 24+ | TypeScript 6 and Node.js 22.12 or newer | Package build, typecheck, lint, and Vitest suites; packed clean-consumer install and strict typecheck; Expo playground typecheck and lint |
| SwiftUI | iOS 16, macOS 13, tvOS 16, and watchOS 9 | Swift tools 6.0 and the current stable Xcode selected by CI | `swift test`, `swift package diagnose-api-breaking-changes v1.6.0 --products LumenUI`, and `pnpm run check:swift-api-baseline` across all four targets |
| Jetpack Compose | Android API 23 or newer | JDK 21, Gradle 9.7.1, Android Gradle Plugin 9.3.1, Kotlin Compose plugin 2.4.10, compile SDK 37 | Binary API comparison, unit tests, Android lint, release publication verification, exact-candidate Maven APK consumer, Android test APK build, and instrumentation on API 35 |
| Wear OS Compose | Wear OS API 30 or newer | JDK 21, Gradle 9.7.1, Android Gradle Plugin 9.3.1, Kotlin Compose plugin 2.4.10, compile SDK 37 | Separate Wear binary API comparison, unit tests, lint, Maven publication verification, exact-candidate watch APK consumer, and phone dependency-isolation assertion |

The React Native peer dependency declarations, Swift package platform declarations, and Compose
Gradle configuration are authoritative when this document and package metadata differ.
React Native 0.86.2 is the package's minimum peer and declares iOS 15.1 and Android API 24 as its
application baselines; the physical-device ledger records those exact minimums rather than a looser
"oldest supported" label.

## Verification policy

- Pull requests that change native packages, canonical tokens or icons, their generators, or native
  workflows must run the native contract and generated platform drift checks.
- Swift changes must pass the repository-tag and target-specific API comparisons plus macOS tests.
- Compose changes must pass the separate phone/tablet and Wear API comparisons, unit tests and lint,
  build the instrumentation APK, verify Maven publication metadata, and pass the API 35 emulator
  accessibility suite.
- React Native changes must pass build, typecheck, lint, and tests against the repository's pinned
  development versions while keeping the published peer range valid.
- Raising a minimum OS, SDK, React, or React Native version is a breaking compatibility change and
  requires release notes and a migration path.
- A successful simulator or emulator run does not complete the physical-device matrix.

## Updating the matrix

Update this document in the same change whenever `Package.swift`, a native package manifest, the
Compose Gradle plugins, `minSdk`, `compileSdk`, React peer dependencies, or native CI destinations
change. Run the narrow platform checks first, then `pnpm run validate` before release-oriented work.
