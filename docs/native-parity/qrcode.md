# Native QRCode

`LumenQRCode` encodes controlled `value` text locally with no network, permissions,
remote image service or embedded scanner. React Native uses the existing `uqr`
engine; SwiftUI uses Core Image; Compose uses ZXing core 3.5.4. Public renderers
accept a required accessible `label`, `size` (default 160), `quietZone` (default
four modules, valid range 4–32), error correction (default M), localized
`errorLabel`, and `showValue` (default true). Swift uses `.low`, `.medium`,
`.quartile`, `.high`; Compose uses `Low`, `Medium`, `Quartile`, `High`; React
Native uses `L`, `M`, `Q`, `H`.

QR modules remain black on white in both appearance modes, matching the reference
encoder and maximizing reader interoperability. Surrounding captions use Lumen
semantic colors. The quiet zone is inside the supplied size. Sizes must be finite,
positive, and at most 4096 platform units. Empty, over-capacity or invalid inputs
render the localized error instead of a matrix; application values are unchanged.
Inputs longer than 7089 UTF-16 units are rejected before encoding, the maximum QR
numeric capacity. Actual capacity depends on mode, UTF-8 byte count and correction.

The pure React Native `encodeLumenQRCode` and Compose `encodeLumenQRCode` functions
return a ready matrix or a categorized error. Swift `LumenQRCodeMatrix` throws
`LumenQRCodeError`. Matrix engines can choose different standard masks, so their
images need not be identical. Content must decode identically. Remote `src` is
not accepted: hosts should use the existing Image primitive for already generated
image assets.

Dedicated `QRCodeParityExample` fragments in each phone playground expose Unicode,
empty, oversized and restored values plus English/Spanish labels. Wire them into
the central example dispatch. Verify a successful scan at narrow widths in light
and dark appearance, caption wrapping, localized errors, VoiceOver/TalkBack names
and values, and controlled changes. Physical-device scans remain qualification
work. Compose tests decode its matrix with ZXing; Swift tests decode its rendered
matrix with Vision. React Native tests cover deterministic standard finder and
quiet-zone geometry and adversarial input; Compose also independently decodes a
Unicode matrix fixture produced by the React Native uqr engine.

ZXing release and dependency evidence:
[official releases](https://github.com/zxing/zxing/releases),
[Maven Central 3.5.4](https://repo1.maven.org/maven2/com/google/zxing/core/3.5.4/).
The noncompact UTF-8 `Encoder.encode` path uses charset APIs available on API 19
and avoids newer scanner and compaction APIs. Android minSdk remains 23.

## Rendered regression coverage

`QRCodeParityTests` exercises the iOS playground's real buttons in light and dark
appearance: Unicode content, Spanish labels, empty and oversized errors, then
restoration. It checks the image's accessible value and retains screenshot
attachments. Vision's inference context is unavailable inside the iOS simulator,
so exported screenshots are independently decoded with host Vision instead.

`qrCodeNativeSwiftUIRenderingCanBeScannedAtNarrowAndDesktopWidths` renders the
actual SwiftUI Canvas at widths 390 and 1280 in both appearances and decodes its
pixels with Vision. Set `LUMEN_QRCODE_CAPTURE_DIR` to an existing temporary directory
when screenshots are needed. The test normally leaves no files.

`QRCodeParityTest` exercises the Android example with Compose's native test
harness and saves temporary screenshots under the app's external files directory.
The React Native example exposes `qrcode-parity-example` for the repository's
Playwright capture harness. Preview evidence remains separate from physical-device
scanner qualification.
