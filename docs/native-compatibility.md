# Native compatibility matrix

This matrix records Lumen's declared native baselines and the toolchains used to verify them. A
successful build proves source and dependency compatibility for that target; physical-device
accessibility evidence is tracked separately in the
[native device validation matrix](native-device-validation.md).

## Supported baselines

| Adapter | Consumer baseline | Library toolchain | Automated evidence |
| --- | --- | --- | --- |
| React Native | React 19.2 or newer and React Native 0.86.2 or newer | TypeScript 6 and Node.js 22.12 or newer | Package build, typecheck, lint, and Vitest suites; Expo playground typecheck and lint |
| SwiftUI | iOS 16, macOS 13, tvOS 16, and watchOS 9 | Swift tools 6.0 and the current stable Xcode selected by CI | `swift test` on macOS and a generic iOS Simulator build |
| Jetpack Compose | Android API 23 or newer | JDK 21, Gradle 9.5, Android Gradle Plugin 9.3.1, Kotlin Compose plugin 2.4.10, compile SDK 37 | Unit tests, Android lint, release publication verification, Android test APK build, and instrumentation on API 35 |

The React Native peer dependency declarations, Swift package platform declarations, and Compose
Gradle configuration are authoritative when this document and package metadata differ.

## Verification policy

- Pull requests that change native packages, canonical tokens, token generation, or native workflows
  must run the native contract and platform-token drift checks.
- Swift changes must pass macOS tests and compile for a generic iOS Simulator destination.
- Compose changes must pass unit tests and lint, build the instrumentation APK, verify Maven
  publication metadata, and pass the API 35 emulator accessibility suite.
- React Native changes must pass build, typecheck, lint, and tests against the repository's pinned
  development versions while keeping the published peer range valid.
- Raising a minimum OS, SDK, React, or React Native version is a breaking compatibility change and
  requires release notes and a migration path.
- A successful simulator or emulator run does not complete the physical-device matrix.

## Updating the matrix

Update this document in the same change whenever `Package.swift`, a native package manifest, the
Compose Gradle plugins, `minSdk`, `compileSdk`, React peer dependencies, or native CI destinations
change. Run the narrow platform checks first, then `pnpm run validate` before release-oriented work.
