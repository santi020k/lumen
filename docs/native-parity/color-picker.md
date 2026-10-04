# Color picker native parity

`LumenColorPicker` is a controlled sRGB selector in React Native, SwiftUI and Compose.
The Astro reference exposes the browser's opaque `<input type="color">`. Native adapters
add explicit opacity and validated text entry without depending on DOM color parsing.
SwiftUI also uses the system `ColorPicker`; all three adapters provide HSV channels and
an optional accessible palette. No production dependency was added.

## Shared value contract

- Values accept `#RGB`, `#RGBA`, `#RRGGBB`, `#RRGGBBAA`, or `rgba(r,g,b,a)`.
  Leading/trailing whitespace and letter case are accepted. RGB channels are integer
  sRGB bytes from 0 through 255; alpha is a finite decimal from 0 through 1.
- Names, percentages, `rgb()`, exponents, signs and other CSS expressions are rejected.
  Parsing scans bounded input (64 characters) without regex or platform/DOM parsers.
- Callbacks emit lowercase six-digit hex, or eight-digit hex when `allowAlpha` is true.
  With opacity disabled, nonopaque input is an error; it is never silently flattened.
- Invalid drafts remain visible with a customizable error, do not call the host, and
  preserve the host preview. Invalid host values display the error and suppress channels.
  A subsequent host change resets the draft. Host state remains authoritative.
- HSV edits keep latent hue/saturation at black and hue at grayscale; changing brightness
  or saturation later uses those choices. Alpha zero preserves RGB/HSV selection.
  An external different color resets that local selection. Direct text/palette selection
  starts a new selection. The Apple system color sheet manages its own internal selection.
- `disabled` and `readOnly` prevent text, palette, channel and native-picker callbacks.
  Read-only native controls are disabled because native slider/color-sheet widgets have
  no separate read-only interaction mode.

## Native interfaces

React Native uses `label`, `value`, `onValueChange`, `allowAlpha`, `disabled`, `readOnly`,
`palette` and `labels`. SwiftUI binds `value` and otherwise uses the same option names.
Compose uses `label`, `value`, `onValueChange` and those options. Palette entries use
stable unique `id`, accessible `label`, `value` and optional `disabled`. Invalid colors
and blank IDs/labels, duplicate IDs and equivalent canonical colors are omitted. The first
valid named entry for each identity and canonical color wins, including a disabled first entry.
Different alpha values remain distinct when alpha is enabled. This prevents multiple selected
radio choices for one controlled color and never rewrites host palette data. Palette targets and slider tracks are at least 44 points;
SwiftUI/Compose palettes scroll horizontally and React Native wraps. Domain colors are
intentional swatches; text, borders and controls use the current Lumen theme.

The seven localizable labels are field, hue, saturation, brightness, alpha, invalid and
preview. The supplied playground fragments demonstrate English/Spanish, invalid restore,
transparent black, disabled/read-only and palette selection with synthetic values.

## Verification

Deterministic tests in each adapter cover all hex widths, RGBA, alpha zero, malformed and
million-character input, channel bounds/nonfinite channels, 64 RGB round trips and HSV
black recovery. React Native interaction coverage checks invalid drafts, controlled
resynchronization, grayscale/black hue retention, alpha zero and read-only guards.
`ColorPickerInteractionTest` passed on the isolated Android emulator: invalid text does
not rewrite host state, gray/black HSV recovery preserves alpha zero, external value
changes resynchronize, numeric RGBA normalizes and read-only disables sliders.
React Native focused tests: 4 passed; Swift focused tests: 3 passed; Compose model
tests: 3 passed; Compose instrumentation: 1 passed. Strict RN typecheck and focused
zero-warning lint passed; Compose `:lintDebug` passed. Swift and Compose library builds
compile the new component source. App fragment build/capture qualification remains
with the parent integration batch. Logs are temporary verification evidence in
`/private/tmp/lumen-color-picker-{swift,gradle,interaction}.log`.
The parent owns full app builds, narrow/desktop light/dark rendered qualification,
localization/invalid restore captures, central registry/export metadata and release gates.
Simulator/emulator verification does not qualify physical devices.
