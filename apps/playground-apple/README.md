# Lumen Apple Playground

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

See [`docs/playgrounds.md`](../../docs/playgrounds.md) for prerequisites and the complete Xcode,
device, signing, and TestFlight workflow.
