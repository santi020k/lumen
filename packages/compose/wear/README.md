# Lumen UI for Wear OS

> The complete Wear theme, tone, action, progress, status, metric, and list-row surface is Supported
> for Lumen 2. Publication and physical-watch evidence remain release gates.

Install the dedicated artifact alongside the Wear Compose version selected by the application:

```kotlin
dependencies {
    implementation("com.santi020k:lumen-compose-wear:0.6.0")
}
```

`lumen-compose-wear` depends on Lumen's Compose foundations and provides wearable-specific
composition without forcing an application to migrate between Wear Compose Material 2.5 and Wear
Material 3.

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
