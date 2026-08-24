# Lumen UI for Wear OS

> **Experimental:** The wearable API is intentionally small and may evolve as it is validated in
> real watch applications.

Install the dedicated artifact alongside the Wear Compose version selected by the application:

```kotlin
dependencies {
    implementation("com.santi020k:lumen-compose-wear:0.5.0")
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

- `LumenWearActionButton`
- `LumenWearProgressRing`
- `LumenWearStatus`
- `LumenWearMetric`
- `LumenWearListRow`

The host application owns round-screen navigation, rotary input, haptics, tiles, complications,
data synchronization, background work, and domain behavior. Use Lumen for semantic presentation,
not for watch lifecycle or health and safety policy.
