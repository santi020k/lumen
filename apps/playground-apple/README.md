# Lumen Apple Playground

<!-- cspell:words screencapture simctl UDID -->

A SwiftUI reference application for the shared and Apple-specific `LumenUI` components. Its four
primary destinations are Home, Examples, Components, and Settings:

- Home is a component-release workspace with factual catalog readiness, quick actions, featured
  workflows, and category distribution.
- Examples provides interactive release, catalog-health, and contributor-profile patterns,
  including loading, empty, error, success, disabled, validation, and destructive states.
- Components adds product-intent category discovery to the searchable catalog while preserving the
  deterministic launch filters used by screenshot automation.
- Settings covers Lumen and santi020k semantic theme presets, system/light/dark appearance,
  theme preview and feedback, current Apple accessibility preferences,
  platform and version details, documentation, privacy, and support.

To run on iOS, open `LumenApplePlayground.xcodeproj`, select an iPhone simulator, and press
`Command-R`. Simulator builds do not require an Apple Developer account. The iOS application embeds
the `LumenWidgetPlayground` extension, a small WidgetKit host for the public `LumenWidgetUI` product.
After installing the application, add **Lumen Widget** from the Home Screen or Lock Screen widget
gallery to verify full-color, accented, increased-contrast, and accessibility-text rendering on the
actual device. The widget keeps its timeline, supported families, and container background in the
playground rather than moving product policy into Lumen.

Run the macOS gallery from the repository root as a Swift Package executable:

```bash
pnpm playground:apple:build
swift run --package-path apps/playground-apple LumenApplePlayground
```

For the distributable macOS application, open `LumenApplePlayground.xcodeproj`, select the shared
`LumenMacPlayground` scheme, and run on **My Mac**. The target reuses the same gallery sources while
adding the App Sandbox, hardened runtime, application metadata, and complete Mac icon set required
for Mac App Store distribution.

Select a development team in Signing & Capabilities only when installing on a physical device or
archiving for TestFlight. Update `project.yml` and regenerate the Xcode project with XcodeGen when
project structure changes.

App Store archives for iOS and macOS are built and signed by Xcode Cloud. Run the local preflight with
`pnpm playground:apple:release-preflight`; it checks the release metadata, runs the playground's
Swift tests, and produces an unsigned iOS Simulator build plus a universal macOS archive. Then launch a
build from **Launch Apple playground release** or **Launch Mac playground release** in GitHub
Actions. The workflows create platform-specific immutable tags; each tag starts its matching Xcode
Cloud workflow, which assigns the build number and uploads the archive to App Store Connect without
exposing Apple signing credentials to GitHub.

See [`docs/playgrounds.md`](../../docs/playgrounds.md) for prerequisites and the complete Xcode,
device, signing, and TestFlight workflow.

## Component screenshots

Every catalog entry accepts a launch filter so visual evidence is deterministic. In Xcode, add
`--component` and a component name such as `Navigation bar` to the scheme's launch arguments.
Filtered launches open Components directly rather than the four-destination application shell.
For deterministic full-page verification, pass `--destination` with `home`, `examples`,
`components`, or `settings`; `--component` continues to take precedence when both are supplied.

To build the iOS playground, boot the first available iPhone simulator, and capture one PNG for
each component usage:

```bash
apps/playground-apple/scripts/capture-component-screenshots.sh
```

Screenshots are written to `apps/playground-apple/Screenshots` and remain local verification
artifacts. Pass a destination directory as the first argument when preparing release evidence. Set
`LUMEN_SIMULATOR_UDID` to capture with a specific available simulator. The script uses the checked-in
Xcode project, disables code signing for the simulator build, and waits for each filtered gallery
state before capture.

The macOS gallery supports the same filter. Launch each macOS-only component, then use the standard
window-capture cursor to select the playground window:

```bash
mkdir -p apps/playground-apple/Screenshots
swift run --package-path apps/playground-apple LumenApplePlayground --component "Shortcut recorder"
screencapture -w apps/playground-apple/Screenshots/shortcut-recorder.png

swift run --package-path apps/playground-apple LumenApplePlayground --component "Symbol picker"
screencapture -w apps/playground-apple/Screenshots/symbol-picker.png
```

macOS requests Screen Recording permission the first time `screencapture` runs. Window selection is
intentionally interactive so the script does not require Accessibility permission to control other
applications.

The repository also includes a standalone watchOS gallery. Capture every wearable component on a
booted watch simulator with:

```bash
apps/playground-apple/scripts/capture-watch-component-screenshots.sh
```

After iPhone, macOS, and watchOS evidence is current, run `pnpm run sync:native-captures` from the
repository root to update the optimized documentation gallery.

Pass `--dark` to launch either gallery in its deterministic dark appearance. Public App Store copy,
review notes, and phone, tablet, and Mac screenshot candidates live in `Store`; the opaque application
icon is generated from the shared Lumen mark with `scripts/generate-app-icons.sh`. Follow
[`docs/playground-publication.md`](../../docs/playground-publication.md) before building a signed
TestFlight or App Store archive.
