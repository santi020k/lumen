<p align="center">
  <a href="https://lumen.santi020k.com">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="../../docs/assets/readme/package-dark.svg">
      <img src="../../docs/assets/readme/package-light.svg" alt="Lumen UI — Web. Native. Thoughtfully connected." width="1200" height="184">
    </picture>
  </a>
</p>

<h1 align="center">Lumen Playground Artwork</h1>

<p align="center">Canonical SVG sources · Shared app identity</p>

<p align="center"><a href="../../docs/brand-guidelines.md">Brand guide</a> · <a href="../playground-apple/README.md">Apple app</a> · <a href="../playground-android/README.md">Android app</a> · <a href="../playground-react-native/README.md">Expo app</a></p>

**On this page:** [Artwork](#artwork) · [Regenerate platform assets](#regenerate-platform-assets) · [Verify changes](#verify-changes) · [Resources](#resources)

The source artwork shared by the Apple, Android, and Expo playground applications. This directory
contains design assets, not a runnable app or a published package.

## Artwork

<p align="center">
  <img src="lumen-playground-icon.svg" alt="Lumen Playground app icon" width="160" height="160">
  <img src="lumen-playground-mark.svg" alt="Lumen Playground transparent mark" width="160" height="160">
</p>

| Source | Purpose |
| --- | --- |
| `lumen-playground-icon.svg` | Opaque app-icon composition |
| `lumen-playground-mark.svg` | Transparent mark for adaptive icons and splash surfaces |

Preserve the canonical monogram geometry and warm point of light. Follow the
[brand guide](../../docs/brand-guidelines.md#logo) instead of redrawing the logo.

## Regenerate platform assets

From the repository root, use the existing generators:

```bash
pnpm run playground:store-assets
```

This runs the Apple, Android, and React Native asset scripts. Consult each script's prerequisites
before running; generated assets belong to the consuming apps, not this source directory.

- [Apple generator](../playground-apple/scripts/generate-app-icons.sh)
- [Android generator](../playground-android/scripts/generate-app-icons.sh)
- [Expo generator](../playground-react-native/scripts/generate-app-assets.sh)

## Verify changes

Check the generated icon at small sizes, Apple opaque backgrounds, Android adaptive masks, and
Expo splash backgrounds. Confirm all three apps still use the same mark. Keep required tracked
asset catalogs and app resources with the source change; omit temporary captures and build output.
App Store and Google Play submission follow the [playground publication guide](../../docs/playground-publication.md).

## Resources

- [Repository overview](../../README.md) — framework packages, demos, and the project map.
- [Contributing](../../CONTRIBUTING.md) — workspace setup, validation, and release workflow.
- [Feedback and support](https://lumen.santi020k.com/support) — questions, ideas, and bug reports.

Part of [Lumen UI](https://lumen.santi020k.com), created by [Santiago Molina](https://santi020k.com).
Licensed under [MIT](../../LICENSE); third-party artwork retains its own notices.
