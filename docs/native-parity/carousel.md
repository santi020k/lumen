# Carousel native parity

The Astro reference scrolls a viewport by one viewport width through previous/next
controls. Native `LumenCarousel` adds controlled index selection, stable slide IDs,
localizable indicators and platform paging. It has no autoplay, wrapping, requests,
images or business logic. Hosts render slide content and own selection.

## Shared contract

Slides use unique, nonempty `id` and accessible `label`. The controlled `index` is a
zero-based integer within the supplied ordered slides. Empty slides display `labels.empty`;
invalid identity/index or invalid height display `labels.invalid`, with no callback or
silent host correction. Height defaults to 200 and must be finite, positive and at most
4096 points. Changing slide order preserves content identity while the host index selects
its new ordered position; hosts update index deliberately when retaining a selected ID.

Previous/next stop at the first/last page. Selected indicators do not re-emit selection.
`disabled` guards all navigation callbacks and native swipe gestures. `status` supports
ready/loading/error and hides stale navigation in unavailable states. Labels provide
previous, next, empty, invalid, loading, error and a position formatter receiving slide,
zero-based index and total. Visible controls/indicators have at least 44-point targets.
Native indicators scroll horizontally; RN indicators wrap. Navigation controls wrap or
stack at narrow widths using existing Lumen primitives.

React Native uses native `ScrollView` paging. iOS uses a page-style `TabView` bound to
host selection. Compose uses `HorizontalPager`; settled native scrolls, including accessibility paging, request a new index, and rejected requests restore the host page.
RN and iOS also reconcile rejected swipe selection to the host index.
Native programmatic selection updates do not emit callbacks. Native platform drag motion
is retained; programmatic changes snap and no extra animation timer runs. SwiftUI's other
platforms expose the selected content with the same navigation/indicator controls; this
gap's paging target is iOS.

## API

React Native exports `LumenCarousel`, `LumenCarouselProps`, `LumenCarouselLabels`,
`LumenCarouselSlide`, `LumenCarouselState`, `resolveLumenCarousel` and `lumenCarouselTarget`.
The view takes `label`, `slides`, `index`, `onIndexChange` and `renderSlide`, plus height,
disabled/status/labels. SwiftUI uses `LumenCarousel(_:slides:index:height:disabled:status:labels:content:)`
with `Binding<Int>` and a host view closure. `LumenCarouselState(slides:index:)` and
`target(_:)` expose the same guarded model. Compose uses the same property names with
`onIndexChange` and composable `content`. Swift/Compose status uses `LumenCarouselStatus`.

All three `CarouselParityExample` fragments use synthetic template slides and demonstrate
English/Spanish, empty, loading/error, invalid host index/restore and disabled controls.
No new dependency was added. Central exports/catalogs and release integration are owned
by the parent task.

## Verification

Focused model tests cover boundaries, invalid/duplicate identities, invalid indices,
empty lists and preserved input order. RN interaction tests cover indicators, external
host changes, measured viewport swipes, rejected swipe restoration and disabled/status
guards. `CarouselInteractionTest` exercises Compose native gestures and controlled state.
Rendered narrow/desktop light/dark app captures, iOS gesture/VoiceOver paths and physical
device qualification remain distinct from model tests and native compilation.

Focused checks passed: RN 3 tests, strict package/app types and zero-warning lint; Swift
2 model tests, iOS simulator library build and actual example typechecking with warnings
as errors; Compose 2 model tests, Android lint and 3 actual emulator interaction tests.
The Android tests cover touch swipe, rejected swipe restoration, disabled/invalid states
and native accessibility ScrollToIndex selection. Exact Android example copies compiled
through a temporary test source set, leaving build configuration unchanged. Temporary logs
are `/private/tmp/lumen-carousel-{swift,ios-build,swift-example,gradle,interaction}.log`.
Full combined app builds and narrow/desktop light/dark captures remain parent integration
gates; these focused checks do not qualify physical devices or public release.
