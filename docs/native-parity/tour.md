# Native Tour

`LumenTour` follows Astro's targeted guidance with a measured native highlight and a nearby panel.
It wraps host content, which remains visible while the open overlay blocks interaction and hides
that content from assistive technology. React Native uses a transparent native Modal; Compose uses
a focusable native Popup aligned to the measured host; SwiftUI overlays its host content and disables
that content while presenting a named modal accessibility region. This is targeted guidance, with
four dimmed regions surrounding a visible highlight, rather than a renamed sheet.

Hosts control `open` and zero-based `index`. React Native / Compose emit change requests; SwiftUI uses
bindings. `onFinish` receives the original current step and does not implicitly close, reset the
index or persist completion. The examples explicitly close on finish. Hosts own routing, scrolling
to targets, completion persistence, data and any action performed by an underlying target.

Each `LumenTourStep` supplies globally unique nonblank `id`, nonblank `targetId`, `title`, `content`
and optional `disabled`. Multiple steps may refer to the same target. Duplicate/blank identity and
out-of-range/noninteger indices fail closed. Previous/next helpers skip disabled destinations,
do not wrap and never rewrite the controlled index. A directly selected disabled step displays a
localized unavailable state and keeps close available. Last enabled steps offer finish.

The `anchors` map supplies `LumenTourRect` bounds in logical points/dp relative to the Tour host's
origin. Measure actual controls, convert pixels with the platform density, and include every nested
container offset. React Native examples use direct-child `onLayout` bounds, which include their
parent padding; the library translates local anchors through measured host and modal origins.
SwiftUI examples use a named coordinate space and preference measurements; Compose examples use
`boundsInParent` and density conversion. Update bounds when targets move or layouts change. React
Native only reads own map properties; prototype entries cannot become targets. Native dictionaries
have their platform's key lookup semantics. No selector, screen coordinate, route or element ID
is inferred.

`resolveLumenTourLayout` takes a viewport rooted at `(0, 0)` with its current width/height. It rejects
nonfinite/nonpositive dimensions and viewports smaller than 48 points/dp. It clips partially visible
anchors to that viewport, places a bounded panel below or above the highlight without overlap,
and clamps the horizontal position. Missing, invalid, fully offscreen or geometrically cramped
targets show centered guidance with localized `unavailableLabel` and no misleading highlight.
The panel scrolls when content or text scaling exceeds its available height; action controls retain
at least 44-unit targets. Insets and host padding define the safe native container; hosts should
place their Tour container inside their existing safe-area layout. Anchors are informational and
remain noninteractive during the tour.

Read-only/disabled states prevent index/finish requests. Loading/error/empty/invalid states hide
stale guidance actions and highlights. Close/backdrop/native dismissal remain usable in every
state. All headings, button/status labels and progress formatting are host-localizable. React
Native focuses the heading through its existing native focus/accessibility APIs and accepts an
optional `returnFocusRef`; SwiftUI focuses the heading and accepts an `onDismiss` hook for the host
to restore its trigger. Compose's native focusable Popup supplies focus containment and Back
dismissal, and the overlay handles Escape. SwiftUI supplies an Escape shortcut; React Native
supplies native modal dismissal and iOS accessibility Escape. Hardware Escape delivery on React
Native is platform-dependent; native close and Back remain available.

All three no-prop `TourParityExample` fragments measure actual preview/save controls, include an
intentionally unavailable target, and demonstrate controlled progress, finish, read-only/loading/
error states and host actions. RN has six focused model/component tests, strict package/playground
type checks and zero-warning focused lint. Swift compiles with two focused model tests; the exact
Swift playground fragment typechecks with Swift 6. Compose passes two model tests, exact Android
fragment compilation, Android lint and two actual emulator UI tests. The UI tests assert the
measured highlight's exact geometry, hidden underlying semantics, disabled-step skipping,
controlled finish, previous/close behavior, Back, focused Escape and status guards.

Parent-rendered React Native web checks passed at 390/1280 pixels in light/dark themes, with
highlight alignment within 2 pixels of the actual target and Next/finish/unavailable-target behavior.
Screenshots are in `/private/tmp/lumen-native-parity-rendered/tour-*-ready.png`.
Apple/native React Native phone alignment, screen-reader narration, modal focus restoration,
large-text/RTL visual review and physical-device qualification remain integration evidence owned
by the host playground/release workflow. Simulator/emulator checks do not replace those gates.
