# Studio media workspaces

Studio supplies neutral surfaces, monochrome actions and restrained elevation. Media workflows
compose public Lumen components; photo access, image processing, drafts and publishing stay owned
by the application. Start with the [appearance preset](appearance-presets.md) and keep the preview
opaque. Use glass selectively on a supporting tool rail.

## Workspace recipe

The `media-workspace` starter separates preview, inspector, supporting tools, ordered media and
bottom controls. Its container layout stacks the inspector below the preview when available space
is narrow. Controls wrap instead of shrinking touch targets. Import the installed
`media-workspace.css` once at the application's style boundary.

```bash
pnpm exec lumen add media-workspace --target astro
pnpm exec lumen add media-workspace --target react
pnpm exec lumen add media-workspace --target elements
```

React accepts `preview`, `inspector`, `tools` and `bottomControls` content. Astro uses named slots
with the same names, with `bottom-controls` for the final slot. Supply real accessible labels and
localized copy; the illustrative source media in examples does not represent an editing engine.

## Selection and ordering

`MediaThumbnail` is a selectable button with visible label, pressed state, optional ordinal, and
loading/error framing. Its media is decorative inside the button; make the button label describe
what the user selects. Place move actions beside the thumbnail, never inside it.

`MediaFilmstrip` contains native `li` children on the web. Each child contains a thumbnail and
optional move buttons. `selectionLabel` supplies the application's localized selection count.
Native adapters expose `LumenMediaThumbnail` and `LumenMediaFilmstrip` using view content and
controlled selection callbacks.

```ts
import { moveLumenMediaItem, resolveLumenMediaSelection, toggleLumenMediaSelection } from '@santi020k/lumen-core/media-workspace'

const selected = resolveLumenMediaSelection(items, selectedIds)
const nextSelection = toggleLumenMediaSelection(items, selected, requestedId)
const nextItems = moveLumenMediaItem(items, requestedId, destinationIndex)
```

Helpers preserve stable identities and never mutate the supplied collection. Duplicate or empty
IDs are rejected. Missing selections are pruned; stale moves, disabled item moves and invalid
indices leave order intact. Disabled items may remain selected but cannot be toggled.

Astro and Elements thumbnails emit `ui:media-selection-request` with `{ id, selected }` and retain
current selection until the host accepts the request. React uses `onClick`. The workspace's web
move buttons emit `ui:media-move-request` with `{ id, direction }` in Astro and Elements; React
requests a new array through `onItemsChange`. Persistence, conflict resolution and permissions
remain application responsibilities. After accepting a move, retain focus on the same stable ID
and announce its new position.

## Adjustments

Compose Field, Label, Slider, Badge and Button. `AdjustmentControlRecipe` exposes a controlled
value, formatted visible and accessible value, a modified indicator and a reset to the host's
neutral value. Supply finite ordered bounds, a positive step and an in-range neutral value.
Changing a control requests a value; the application applies its own image-processing algorithm.

Astro's recipe emits `ui:adjustment-change` with `{ id, value }`. Its unit and locale format the
native slider's value, and reset returns focus to that slider. Keep consumer drafts editable after
failed processing or export. Do not use selection order or a reset action as an implicit save.

## Comparison and inspection

`ImageComparison` supports `reveal`, `side-by-side`, `before` and `after`. The latter modes retain
the reveal position and hide and disable the range. Use existing Button or Toggle controls with
pressed state to choose a mode. Supply matching framing and localized side labels. Enhanced Astro
uses `data-mode`; Elements uses `mode`; React uses the `mode` prop. Native enums use platform naming.

`MediaViewport` inspects noninteractive media content. Its `{ zoom, x, y }` state expresses zoom
relative to fit and pan fractions from -1 to 1. Fit is `{ zoom: 1, x: 0, y: 0 }`; `maxZoom` defaults
to 4 and normalizes into 1–16. Match the viewport ratio to the media's framing when possible.
Image loading, cache lifetime, retries and full-resolution decoding remain application-owned.

Web controls support zoom, pan and fit. Focus the preview and use arrow keys to pan, plus/minus to
zoom and Home to fit. Drag pans a zoomed preview; ordinary scrolling remains available at fit.
React accepts controlled `value`/`onValueChange` or `defaultValue`. Astro's initial `value` becomes
`data-zoom`, `data-pan-x` and `data-pan-y`; Elements exposes a reflected `value` property. Astro and
Elements emit `ui:media-viewport-change` with the complete value.

SwiftUI uses a `Binding<LumenMediaViewportValue>` and supports iOS, macOS and visionOS. React Native
and Compose use controlled values and callbacks. Native surfaces provide pan and magnification
gestures plus visible action alternatives. Pass translated action labels and preserve platform
accessibility settings. Watch and television media inspection remain host-owned surfaces.

## Processing and export

`MediaProcessingRecipe` presents application-owned idle, pending, cancelled, error and success
states. Pending work disables duplicate starts and exposes cancellation. Known progress is a
finite percentage; unknown progress uses the status message without inventing completion numbers.
Errors use ErrorState with recovery guidance and a retry action. Success requires host confirmation.

The Elements starter exports `renderMediaProcessing(workspace, state)` with the same discriminated
phases; call it after the host accepts a transition. It updates public Progress and ErrorState
components and writes service messages as plain text.

Keep cancellation pending until the job acknowledges it. Abort or detach work on unmount, identify
each attempt and ignore completions from cancelled or superseded attempts. A retry must preserve
adjustments and selection. The recipe does not upload media, implement retries, expose raw service
errors, or claim a cancelled remote job has stopped.

## Qualification

Check the same editor composition in Studio light and dark at narrow phone and desktop widths.
Cover selected, disabled, loading and failed thumbnails; every comparison mode; pan/zoom bounds;
reset and modified adjustments; and pending, cancelled, failed, retried and completed jobs. Include
long translated labels, large text, keyboard focus, screen-reader state, reduced motion, reduced
transparency and increased contrast. Compare captures using the same media, route, theme and width.

## Release integration

This addition is folded into the prepared, unpublished Lumen 4.0.0 changelogs under the coordinated
major-release policy. Existing comparison callers keep reveal mode by default. Compose consumers
must recompile against the new binary signature for the optional mode parameter; SwiftUI source
callers retain their defaulted initializer. No persisted media format changes. Consumers can roll
back to their prior package revision and keep drafts and job state in the application.

## SwiftUI layout recipe

The compiled [StudioMediaWorkspaceRecipe](../apps/playground-apple/Sources/LumenApplePlayground/PlaygroundMediaWorkspaceView.swift)
provides preview, inspector, tools, media and bottom view-builder slots. Its `ViewThatFits` uses a
side-by-side preview and inspector when their minimum widths fit, and a vertical arrangement on
phones and at large text sizes. Copy this consumer recipe and adapt its width constraints to your
content rather than forcing a phone inspector into a desktop pane. The same file demonstrates
controlled viewport and thumbnail bindings, formatted exposure, modified state and neutral reset.
Compose pending, progress, error and retry presentation with native Lumen feedback and buttons;
your application owns cancellation acknowledgement and export. Apply `.lumenTheme(preset: .studio)`
at the consumer root, and keep critical previews and processing feedback opaque.
