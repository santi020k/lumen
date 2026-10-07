<p align="center">
  <a href="https://lumen.santi020k.com">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/santi020k/lumen/main/docs/assets/readme/package-dark.svg">
      <img src="https://raw.githubusercontent.com/santi020k/lumen/main/docs/assets/readme/package-light.svg" alt="Lumen UI — Web. Native. Thoughtfully connected." width="1200" height="184">
    </picture>
  </a>
</p>

<h1 align="center">Lumen UI · Wear OS</h1>

<p align="center">At-a-glance actions · Progress · Round-screen presentation</p>

<p align="center">
  <a href="https://github.com/santi020k/lumen/tree/main/packages/compose/wear"><img src="https://img.shields.io/badge/platform-Wear%20OS-0369a0?style=flat-square" alt="Wear OS package"></a>
  <a href="https://github.com/santi020k/lumen/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-13967e?style=flat-square" alt="MIT license"></a>
</p>

<p align="center">
  <a href="https://lumen.santi020k.com/docs/android">Documentation</a>
  ·
  <a href="https://github.com/santi020k/lumen/tree/main/packages/compose/wear">Source</a>
  ·
  <a href="https://github.com/santi020k/lumen/issues">Issues</a>
</p>

**Package:** `Lumen UI for Wear OS`

**On this page:** [Install](#install) · [Usage](#usage) · [Resources](#resources)

> The complete Wear theme, tone, action, progress, status, metric, and list-row surface is Supported
> for Lumen 2. Publication and physical-watch evidence remain release gates.

## Install

Install the dedicated artifact alongside the Wear Compose version selected by the application:

```kotlin
dependencies {
    implementation("com.santi020k:lumen-compose-wear:4.0.0")
}
```

`lumen-compose-wear` depends on Lumen's Compose foundations and provides wearable-specific
composition without forcing an application to migrate between Wear Compose Material 2.5 and Wear
Material 3.

## Usage

```kotlin
LumenWearTheme {
    LumenWearProgressRing(value = elapsed, maximum = threshold) {
        LumenWearActionButton(
            accessibilityLabel = "Start contraction",
            onClick = ::startContraction
        ) {
            TimerLabel()
        }
    }
}
```

The initial tier includes:

- Supported: `LumenWearTheme`, `LumenWearTone`, `LumenWearActionButton`,
  `LumenWearProgressRing`, `LumenWearStatus`, `LumenWearMetric`, and `LumenWearListRow`.

The host application owns round-screen navigation, rotary input, haptics, tiles, complications,
data synchronization, background work, and domain behavior. Use Lumen for semantic presentation,
not for watch lifecycle or health and safety policy.

## Validation and playground

The reviewed ABI inventory lives in `api/wear.api`, and the Supported and Internal
decisions live in `registry/wear-api-classification.json` at the repository root. Run
`./gradlew apiCheck` from the parent `packages/compose` directory to check both artifacts, then run
`pnpm run check:wear-api-classification` from the repository root.

The Wear artifact also has device-side accessibility contract tests for the Supported theme,
action, progress, and status surface. `./gradlew :wear:assembleDebugAndroidTest` compiles that suite;
`./gradlew :wear:connectedDebugAndroidTest` runs it against a connected Wear OS target. Automated
checks complement, but do not replace, TalkBack and round-screen validation on physical hardware.

The `apps/playground-android/wear` consumer demonstrates every public API on a round display. With
that debug application installed on a Wear emulator, run
`apps/playground-android/scripts/capture-component-screenshots.sh` from the repository root. The
script detects the wearable target and captures theme, action, progress, status, metric, and
list-row states separately beneath `apps/playground-android/build/screenshots/wear`.

## Resources

| Guide | What you will find |
| --- | --- |
| [Compose installation](https://github.com/santi020k/lumen/blob/main/packages/compose/README.md) | Maven coordinates and application theme setup. |
| [Device validation evidence](https://github.com/santi020k/lumen/blob/main/docs/native-device-validation.md) | Physical-device checks and outstanding qualification. |
| [Contributing](https://github.com/santi020k/lumen/blob/main/CONTRIBUTING.md) | Setup, checks, and contribution workflow. |
| [Release history](https://github.com/santi020k/lumen/releases) | Published releases and version notes. |

Part of [Lumen UI](https://lumen.santi020k.com), created by [Santiago Molina](https://santi020k.com).
Licensed under [MIT](https://github.com/santi020k/lumen/blob/main/LICENSE); third-party artwork retains its own notices.
