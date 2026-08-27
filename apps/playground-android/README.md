# Lumen Android Playground

<!-- cspell:words screencap -->

A polished Jetpack Compose reference application for `lumen-compose`, plus a focused Wear
application that compiles the separate `lumen-compose-wear` artifact. The phone experience has four
adaptive destinations: Home, complete Examples, the searchable Components catalog, and Settings.
Home presents the checked-in component and category totals as a release workspace. Examples includes
interactive release-readiness, catalog-health, and profile patterns with representative product
states. Normal Components launches add category discovery, while Settings demonstrates Lumen and
santi020k semantic theme presets, light and dark appearance, and groups accessibility, platform,
privacy, and support information. Wide windows use paired panes alongside
the adaptive navigation rail instead of stretching the phone layout.

The Components destination preserves the complete basic and complex catalog: foundations, actions, forms,
feedback, visual content, structured data, controlled overlays, Android sharing, bottom
navigation, navigation accessories, and adaptive navigation. The Wear gallery renders every API
in its intentionally smaller package, including the supported metric and list-row
compositions.

Open this directory, not the repository root, in Android Studio. Wait for Gradle sync, select an
emulator or connected device, and run the `app` configuration. Android SDK 37 and JDK 17 or newer
are required.

Alternatively, build an installable debug APK from the repository root:

```bash
pnpm playground:android:build
```

The phone and watch APKs are written beneath `app/build/outputs/apk/debug` and
`wear/build/outputs/apk/debug`. See
[`docs/playgrounds.md`](../../docs/playgrounds.md) for prerequisites, device installation, signing,
and Google Play distribution.

Release canaries first publish the candidate AARs to the local staging repository, then force both
consumers to resolve those artifacts instead of the included source build:

```bash
(cd packages/compose && ./gradlew verifyMavenPublication)
./packages/compose/gradlew -p apps/playground-android \
  -PlumenComposeRepository=../../packages/compose/build/central-staging \
  assembleDebug :app:verifyLumenArtifactIsolation
```

## Component screenshots

Install both debug applications on a phone emulator and a Wear emulator (or run the command once
per connected target), then capture deterministic component states with:

```bash
./scripts/capture-component-screenshots.sh
```

The script writes one phone PNG per public component and a Wear catalog PNG beneath
`build/screenshots`. It starts the phone activity with the `component` intent extra, which filters
the gallery to the relevant section and opens the alert dialog, sheet, or menu when that overlay is
the requested capture. Component-intent launches render the catalog directly so reference-app
navigation does not alter deterministic documentation captures. The output is temporary
verification evidence and is intentionally kept out of source control. Run
`pnpm run sync:native-captures` from the repository root after both device sets are current to update
the optimized documentation gallery and integrity manifest.

To capture one state manually:

```bash
adb shell am start -W \
  -n com.santi020k.lumen.playground.compose/.MainActivity \
  --es component '"Adaptive navigation scaffold"'
adb exec-out screencap -p > adaptive-navigation-scaffold.png
```

Add `--ez darkTheme true` to the activity launch command for a deterministic dark appearance.
Public Google Play copy, the data-safety declaration, feature graphic, icon, and phone screenshot
candidates live in `Store`; regenerate raster assets from the shared Lumen mark with
`scripts/generate-app-icons.sh`. Follow
[`docs/playground-publication.md`](../../docs/playground-publication.md) before building a signed
closed-testing or production bundle. Use `pnpm playground:android:bundle:signed` for an upload
candidate. The command injects the four upload-key values from Infisical path
`dev:/playground/google-play`, decodes the keystore only for the duration of the build, and fails
unless every signing value is present and valid.
