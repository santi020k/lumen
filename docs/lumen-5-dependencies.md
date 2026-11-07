# Lumen 5 dependency upgrades

This stabilization update belongs to `release/v5.0.0`. Registry metadata was checked on
2026-11-05. The runtime and package-manager constraints are preserved. Publication still requires
the normal reviewed GitHub release workflow.

## Android tooling

Android Gradle Plugin is 9.5.1 in the Compose library, playground and documentation preview.
Dokka is 2.3.0 for phone and Wear documentation. JDK 21, Kotlin 2.4.21 and the
2026.09.00 Compose BOM remain the selected stable releases. AndroidX UI Automator and its shell library
advance to 2.4.1. Other directly declared Maven dependencies were checked against their official
Google Maven or Maven Central metadata and were already current stable releases.

The framework parity audit on 2026-11-06 found that Android lint rejected the Gradle 9.8.2 wrapper
after 9.9.0 became stable. The wrapper advances to 9.9.0 with Gradle's published distribution checksum.
The [release notes](https://docs.gradle.org/9.9.0/release-notes.html) and
[upgrade guide](https://docs.gradle.org/9.9.0/userguide/upgrading_version_9.html) were reviewed;
JDK 21, Android Gradle Plugin 9.5.1, Kotlin 2.4.21 and the Android baselines remain unchanged.

Gradle's `--warning-mode=all` reports `Configuration.setVisible(boolean)` from
`BinaryCompatibilityValidatorPlugin.kt:697` in binary-compatibility-validator 0.18.2, the current
stable artifact in Maven Central at the audit date. This upstream deprecation is scheduled for
removal in Gradle 11. Retain the API checks and reassess the plugin before a future Gradle major
upgrade; the warning is not suppressed.

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

## November 7 follow-up

The workspace now uses pnpm 12.18.0, Astro 7.4.7, Markdown Satteri 0.4.7, Vite 8.3.6,
Playwright 1.65.0, jsdom 31.0.0, Wrangler 4.158.0, React Hook Form Resolvers 7.0.3,
Rive Canvas 2.49.4, and Lucide 1.69.0. Lucide adds four icons across web and native; Swift
clients should review exhaustive switches over `LumenIconName`. The ESLint Config Basic family
was refreshed together with Oxlint 1.90.0 and its matching ESLint plugin. Oxlint 1.91 has no
matching plugin release, and 1.92 was still inside the 24-hour hold. The TypeScript 6 and Expo 58
compatibility holds still apply. Astro and the workspace now share Vite 8.3.6 so their plugin
types agree. The Astro checker explicitly resolves the same stable emnapi version for its
WebAssembly runtime and core.

Hyperframes 0.9.19 removes the dependency path to Zod 3. The workspace now resolves only the
published Zod 4.6.7, so the [Zod security patch](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5)
and its exception were retired. The published version still runs against the collection regression
test. Undici advances to 7.30.2 and 8.12.4. The security gate now audits development dependencies
alongside production dependencies and still verifies the installed Braces patch before accepting a
matching advisory.

The Gradle wrapper and directly declared Maven dependencies were rechecked and remain current.
The OSV scan of resolved Gradle dependencies found advisories in Android build plugins and
instrumentation tests. The shared constraints upgrade Jackson to 2.22.4, Guava to 33.8.0,
Commons Lang to 3.21.0, jose4j to 0.9.7, Bouncy Castle to 1.86, JDOM to 2.0.6.1,
Protobuf Lite to 3.25.9, and jsoup to 1.24.1. The Compose scan returned no advisories after
the update. The constraints do not change the published Compose dependency graph.
GitHub Actions uses the immutable setup-java 6.2.0 commit. The playground EAS CLI advances to
27.5.0. Its separately resolved CLI tree still has 13 upstream advisories in Diff, Minimatch,
Joi, Tar, ts-deepmerge, and deepmerge. The upstream CLI graph is outside the workspace lockfile;
the [deepmerge advisory](https://github.com/advisories/GHSA-gcqx-w48m-w2h4) has no published fix.
The version probe succeeds and still reports upstream deprecation and peer notices.

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
- [pnpm 12.18.0 release](https://github.com/pnpm/pnpm/releases/tag/v12.18.0)
- [Astro 7.4.7 release](https://github.com/withastro/astro/releases/tag/astro%407.4.7)
- [Lucide 1.69.0 release](https://github.com/lucide-icons/lucide/releases/tag/1.69.0)
- [Jackson 2.22 release notes](https://github.com/FasterXML/jackson/wiki/Jackson-Release-2.22)
- [Guava 33.8.0 release](https://github.com/google/guava/releases/tag/v33.8.0)
- [EAS CLI 27.5.0 release](https://github.com/expo/eas-cli/releases/tag/v27.5.0)
