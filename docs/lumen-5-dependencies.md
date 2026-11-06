# Lumen 5 dependency upgrades

This stabilization update belongs to `release/v5.0.0`. Registry metadata was checked on
2026-11-05. The runtime and package-manager constraints are preserved. Publication still requires
the normal reviewed GitHub release workflow.

## Android tooling

Android Gradle Plugin is 9.5.1 in the Compose library, playground and documentation preview.
Dokka is 2.3.0 for phone and Wear documentation. JDK 21, Gradle 9.9.0, Kotlin 2.4.21 and the
2026.09.00 Compose BOM remain current stable releases. AndroidX UI Automator and its shell library
advance to 2.4.1. Other directly declared Maven dependencies were checked against their official
Google Maven or Maven Central metadata and were already current stable releases.

## JavaScript packages

| Dependency | Previous | Selected |
| --- | --- | --- |
| `@astrojs/check` | 0.9.10 | 0.9.12 |
| `@astrojs/markdown-satteri` | 0.4.5 | 0.4.6 |
| `@commitlint/cli` | 21.2.3 | 21.2.4 |
| `@commitlint/config-conventional` | 21.2.3 | 21.2.4 |
| `@expo/metro-runtime` | 57.0.17 | 58.0.17 |
| `@hookform/resolvers` | 5.9.1 | 7.0.2 |
| `@lucide/icons` | 1.50.0 | 1.68.0 |
| `@modelcontextprotocol/client` | 2.3.1 | 2.4.0 |
| `@modelcontextprotocol/server` | 2.3.1 | 2.4.0 |
| `@react-native-community/datetimepicker` | 9.1.0 | 9.2.1 |
| `@rive-app/canvas` | 2.45.0 | 2.49.3 |
| `@santi020k/eslint-config-basic` | 3.6.1 | 3.6.2 |
| `@santi020k/eslint-config-libraries` | 3.1.5 | 3.1.6 |
| `@santi020k/eslint-config-testing` | 3.1.5 | 3.1.6 |
| `@santi020k/theme` | 2.0.1 | 3.0.0 |
| `@tailwindcss/vite` | 4.3.3 | 4.3.4 |
| `@types/node` | 26.6.4 | 26.6.6 |
| `@types/react` | 19.2.18 | 19.3.0 |
| `@types/react-dom` | 19.2.7 | 19.3.0 |
| `@vitest/coverage-v8` | 5.0.3 | 5.1.0 |
| `astro` | 7.3.5 | 7.4.5 |
| `axe-core` | 4.13.0 | 4.14.0 |
| `cspell` | 10.3.6 | 10.4.0 |
| `eslint` | 10.13.0 | 10.14.0 |
| `expo` | 57.0.31 | 58.0.23 |
| `expo-build-properties` | 57.0.22 | 58.0.12 |
| `expo-splash-screen` | 57.0.10 | 58.0.13 |
| `expo-status-bar` | 57.0.1 | 58.0.4 |
| `expo-system-ui` | 57.0.4 | 58.0.7 |
| `expo-updates` | 57.0.26 | 58.0.21 |
| `express` | 5.2.1 | 5.3.0 |
| `gsap` | 3.15.0 | 3.15.1 |
| `hyperframes` | 0.8.185 | 0.9.13 |
| `jsdom` | 30.1.1 | 30.1.3 |
| `knip` | 6.39.0 | 6.44.1 |
| `libphonenumber-js` | 1.13.14 | 1.13.15 |
| `lighthouse` | 13.5.0 | 13.6.0 |
| `motion` | 14.6.0 | 14.9.1 |
| `next` | 16.4.2 | 16.4.5 |
| `postcss` | 8.5.31 | 8.5.32 |
| `postcss-selector-parser` | 7.1.6 | 7.1.7 |
| `react` | 19.2.3 | 19.3.0 |
| `react-dom` | 19.2.3 | 19.3.0 |
| `react-hook-form` | 7.89.0 | 7.91.0 |
| `react-native` | 0.86.3 | 0.88.1 |
| `react-native-web` | 0.21.3 | 0.21.4 |
| `semver` | 7.8.5 | 7.8.6 |
| `tailwindcss` | 4.3.3 | 4.3.4 |
| `test-renderer` | 1.2.0 | 1.3.1 |
| `turbo` | 2.11.7 | 2.11.10 |
| `vitest` | 5.0.3 | 5.1.0 |
| `wrangler` | 4.147.0 | 4.157.0 |

Expo 58's bundled package map governs React 19.3.0, React Native 0.88.1, datetimepicker 9.2.1,
and related native packages. Retain that tested combination even when an independent patch is newer.
The SDK upgrade requires a regenerated native app and development build. JavaScript-only updates
cannot replace the native renderer. React Native refs now use React's ComponentRef contract;
exported context types use public React Native types rather than inferred private declarations.
The font-scale patch is ported to 0.88.1 alongside upstream's font-scale-aware Yoga configuration.
Retain mounted-input and live Text Size checks when rebuilding an application.

The Lucide catalog has 2,052 interface names plus 573 brand names. All 2,437 previous graphics
remain exported; 26 renamed interface names use explicit canonical aliases. There are 188 additions.
Swift consumers must review exhaustive enum switches. Generated adapter sources, graphics, icon
classification and platform API baselines are updated together. Phone metadata is regenerated from
libphonenumber-js 1.13.15.

Transitive security updates pin fast-uri 3.1.9, Undici 7.30.1, KaTeX 0.19.1 and launch-editor 2.14.2.
The full dependency audit retains only the existing Zod advisory handled by the repository’s verified
3.25.76 patch. Undici 7.30.2 remains under the normal 24-hour release-age hold; 7.30.1 contains the
required security fixes.

EAS command pins and the playground CLI requirement advance to 27.4.1. Build and update
commands retain their existing platform, profile and environment arguments. CLI version probing
does not build, upload or publish an application. The version probe succeeds; the external EAS
CLI still reports upstream deprecated transitive packages and optional peer/build-script notices.
The workspace peer check is clean. Root and package test runners explicitly share jsdom 30.1.3;
floating-panel fixtures open their dialogs and model visible mocked popovers so hidden-element
focus rules match the newer DOM implementation. The playground uses Expo's fingerprint runtime policy to
separate SDK 58 updates from older native builds; rebuild native applications before delivery.

## Compatibility holds

- TypeScript stays at 6.0.3: Astro Check 0.9.12 supports only TypeScript 5/6, and ESLint Config Basic
  3.6.2 requires TypeScript below 7. Installing TypeScript 7 would violate both peer contracts.
- Oxlint stays at 1.89.0: eslint-plugin-oxlint 1.89.0 requires the matching 1.89 line. Version 1.91.0
  of that plugin is not published. No peer override or disabled rule is introduced.
- React, React DOM and datetimepicker use Expo's exact supported versions above.

GitHub Actions are updated to stable releases using immutable commit pins, including Quality 1.4.0,
CodeQL 4.39.3, setup-node 7.1.0, setup-java 6.1.0 and artifact action patches. Workflow permissions,
release approval and deployment boundaries are preserved.

## Verification and recovery

The final implementation passed `pnpm run validate`: 3,176 tests across 306 files, strict types,
zero-warning lint, spelling, security, builds, contracts and clean packed consumers. Compose passed
test, lint, API, instrumentation compilation and Maven publication validation (223 tasks), plus the
candidate-artifact playground build (107 tasks). Swift passed 148 tests and compatibility validation
of exactly 188 reviewed enum additions. Frozen install, peers and Expo dependency checks passed.
Rendered guide checks passed in all four themes; 88 interaction cases and route-delivery budgets
also passed. The clean packed React Native Android application built successfully. See the
[release plan record](lumen-5-plan.md#dependency-and-native-toolchain-audit-2026-11-05) for scope and
limitations. The CI follow-up also fixes compound CSS import ordering and canonical Swift classification ordering.
All 459 visual tests retain their original baselines; a fast native-export test now guards Swift
identifier ordering. GitHub CI must validate each pushed revision.

For recovery, restore dependency manifests, lockfile, patches, generated assets and API baselines
together from the prior reviewed revision. Never move or replace a published tag.

## Sources

- [AGP compatibility and release notes](https://developer.android.com/build/releases/agp-9-5-0-release-notes)
- [Dokka 2.3.0 release](https://github.com/Kotlin/dokka/releases/tag/v2.3.0)
- [Expo runtime version policy](https://docs.expo.dev/eas-update/runtime-versions/)
- [Expo 58 migration notes](https://expo.dev/changelog/sdk-58)
- [Theme changelog](https://github.com/santi020k/santi020k-theme/blob/main/packages/theme/CHANGELOG.md)
- [Resolvers 7 changes](https://github.com/react-hook-form/resolvers/releases/tag/v7.0.0)
- [Vitest 5.1 changes](https://main.vitest.dev/blog/vitest-5-1)
- [MCP SDK 2.4 changes](https://github.com/modelcontextprotocol/typescript-sdk/releases/tag/v2.4.0)
