# Lumen Apple Playground

<!-- cspell:words screencapture simctl UDID -->

A searchable SwiftUI gallery for the shared and Apple-specific `LumenUI` components.

To run on iOS, open `LumenApplePlayground.xcodeproj`, select an iPhone simulator, and press
`Command-R`. Simulator builds do not require an Apple Developer account.

Run the macOS gallery from the repository root:

```bash
pnpm playground:apple:build
swift run --package-path apps/playground-apple LumenApplePlayground
```

Select a development team in Signing & Capabilities only when installing on a physical device or
archiving for TestFlight. Update `project.yml` and regenerate the Xcode project with XcodeGen when
project structure changes.

App Store archives are built and signed by Xcode Cloud. Run the local preflight with
`pnpm playground:apple:release-preflight`, then launch a build from the GitHub Actions workflow
**Launch Apple playground release**. The workflow creates a `playground-ios-v<version>-r<run>` tag;
the tag starts Xcode Cloud, which assigns its build number and uploads the archive to App Store
Connect without exposing Apple signing credentials to GitHub.

See [`docs/playgrounds.md`](../../docs/playgrounds.md) for prerequisites and the complete Xcode,
device, signing, and TestFlight workflow.

## Component screenshots

Every catalog entry accepts a launch filter so visual evidence is deterministic. In Xcode, add
`--component` and a component name such as `Navigation bar` to the scheme's launch arguments.

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
review notes, and phone and tablet screenshot candidates live in `Store`; the opaque application
icon is generated from the shared Lumen mark with `scripts/generate-app-icons.sh`. Follow
[`docs/playground-publication.md`](../../docs/playground-publication.md) before building a signed
TestFlight or App Store archive.
