# Visual interactions

Lumen's web adapters share coordinated motion, optional semantic effects, and AI-facing surfaces.
Astro is the reference implementation. Native adapters retain their existing platform motion APIs.
Try the [visual playground](https://lumen.santi020k.com/docs/visual-playground) in the documentation.

## Setup and motion

Import the framework stylesheet once. Astro applications mount `UIPrimitives` once in their layout;
React components own their effects; Elements applications register the components once with
`defineLumenElements`. No animation SDK is required for the standard components.

`MotionGroup` animates direct children with unique `data-ui-motion-key` identities. Applications own
DOM order and list state. Keep a key stable when an item changes; missing and duplicate keys skip
ambiguous animation. Use `duration="fast"`, `"standard"`, or `"slow"` and the existing
`--ui-duration`, `--ui-duration-fast`, `--ui-duration-slow`, and `--ui-ease` tokens. Set
`enterExit={false}` in Astro/React or `enter-exit="false"` in Elements to omit presence fades.
Rapid interruptions cancel the old animation and commit the newest list immediately. Exit fades skip
custom elements and active media to avoid replaying their lifecycle or requests.
The core `createLumenMotionGroupController` exposes `update(change)` for imperative DOM updates
that need to preserve focus during reordering. Destroy manual controllers before removing a view.

`runLumenViewTransition(document, update)` runs an application update exactly once, using the native
View Transition API when available. Give the corresponding old and new surface the same unique CSS
`view-transition-name`. Await the application's render inside `update` if it commits asynchronously.
Do not reuse one name on multiple simultaneous surfaces. Application exceptions remain observable.

Set `indicator` on `Tabs` to add a moving decorative selection underline while retaining the existing
keyboard and focus behavior. Manual integrations can use `bindLumenTabIndicator` and its cleanup.

Import `@santi020k/lumen/styles/motion.css` to opt into native disclosure resizing. It uses
`interpolate-size` when available; unsupported browsers open
immediately. Existing button loading and status compositions provide pending/success feedback.
All animation respects the system reduced-motion preference. A subtree with `data-ui-motion="reduce"`
provides an additional static preview; it never overrides a system preference to enable motion.

## Visual effects

`VisualEffect` supports `mesh`, `aurora`, `spotlight`, `grain`, `border`, `draw`, and `depth`.
Its colors use semantic tokens; `intensity` is bounded to 0–1. Effects sit behind readable content
and do not handle application clicks. `animated` defaults to false. Enable it deliberately and
provide a pause control for continuing movement. Aurora movement is a CSS loop; drawing is finite;
depth uses a native scroll timeline when available. Unsupported features retain a static treatment.

For drawing, supply an ordinary SVG path with `pathLength="1"`. The library does not rewrite artwork.
Spotlight pointer tracking skips touch and reduced motion, batches work into one animation frame,
and resets on pointer leave. Forced colors hide decoration while retaining the content.

## Charts

Wrap `LineChart` (including its filled area) or `BarChart` in `ChartMotion` to animate stable SVG marks during value changes or appended points.
Series IDs and datum IDs identify marks. When an ID is absent, a typed category key supplies identity;
explicit IDs are preferable when categories can change. Duplicate keys skip ambiguous animation.
The SVG transition does not delay tables, summaries, activation payloads, or inspection values.
Path interpolation requires browser support; point geometry and immediate fallback remain usable.

Keep data transport in the application. Use the chart's existing `interactive` and `syncGroup` props
(`sync-group` in Elements) for coordinated inspection. Show loading status with `aria-busy` and a
concise status message; keep the previous data while refreshing when appropriate. Empty series use
the chart's existing empty state. Compose loading and ready status messages in a keyed `MotionGroup`
and set `aria-busy` on the chart region while a request is pending, as the playground demonstrates.
Destroy manual `bindLumenChartMotion` bindings on view removal.

The playground uses a stable line-chart domain and a 900 ms `--ui-duration` override so changes
are easy to follow. It includes line, area, and bar examples, live playback, and an immediate
reduced-motion comparison. Playback pauses while the page is hidden or data is loading and is
disabled when the system requests reduced motion. Accessible data updates without waiting for
animation. The effects preview amplifies the aurora locally, exposes cycle timing, and supports
pause/resume and replay without changing the library's default treatment.

## AI surfaces

- `PromptComposer` owns a labeled textarea, input limits, send validity, and pending/stop affordances.
  `submitOnEnter` is opt-in; modified Enter and text composition retain native editing behavior.
  React exposes `onPromptSubmit({ text })`, `onStop`, and `onValueChange`. Astro and Elements emit
  `ui:prompt-submit` and `ui:prompt-stop`. Cancel the submit event when handling it yourself.
  An explicit native form `action` works without the Astro controller; requests use POST.
- `StreamMessage` keeps token updates outside a live region. Supply a concise localized `statusLabel`
  and `status` (`idle`, `streaming`, `complete`, `error`, or `canceled`). Compose retry controls in its
  actions slot/prop and sources in its sources slot/prop. Elements exposes a plain-text `text` property.
- `SourceCitation` accepts safe HTTP(S) URLs without embedded credentials and local absolute paths.
  Invalid URLs render inert text. Link names should describe the evidence, not just its numeric index.
- `ToolActivity` is an ordinary disclosure with application-owned progress and result content.
- `ApprovalCard` emits a decision for a `requestId`; it does not execute an operation or grant authority.
  React uses `onResponse({ requestId, response })`; other adapters emit `ui:approval-response`.
  Set the application-owned status to `approved` or `rejected` to disable completed decisions.

Consumers own models, streaming, cancellation, retries, server validation, authorization, storage,
and rendering/sanitization of untrusted Markdown. No primitive contacts an AI service.

## Installable product blocks

```bash
lumen add interactive-pricing --target astro
lumen add feature-preview --target react
lumen add guided-onboarding --target elements
lumen add command-center --target react
```

All four recipes support Astro, React, and Elements. They compose public components and use fictional
local state. Pricing switches illustrative billing periods and requests a plan selection; feature
preview selects a workflow stage; onboarding preserves an editable workspace draft; command center
filters and activates keyboard-accessible commands. React callbacks and bubbling DOM events keep
checkout, persistence, navigation, and authorization application-owned.

The React command-center recipe handles search locally. Arrow Down moves from search to the
first result; arrow keys, Home, and End navigate results; Enter selects the focused command;
Escape returns to search. An empty result explains how to recover.

Astro recipe scripts initialize on `astro:page-load` and release their listeners before a view swap.
Elements recipes require a module bundler to compile the installed `product-blocks.ts` module and
resolve package imports. Native form/label children follow Elements' documented form contract.
Include the Lumen stylesheet once in the application shell.
Mount each recipe once per view and dispose manual `mountProductBlocks` bindings before replacing it.
DOM events are `ui:plan-select`, `ui:onboarding-complete`, and `ui:workspace-command`. Cancel onboarding
completion when a consumer must finish a request before showing its own success/error state.

## Optional Motion integration

Install `motion@^14.0.0` only in React applications that need spring, layout, or gesture composition.
Import `LumenMotionConfig`, `MotionButton`, `MotionCard`, and `MotionStack` from
`@santi020k/lumen-react/motion`. The optional entry point wraps public Lumen components and preserves
native semantics and tokens. The configuration fixes `reducedMotion="user"`; MotionButton removes
hover/tap transforms for reduced motion. Use Motion's `AnimatePresence`, `LayoutGroup`, and motion
values directly rather than introducing a second state model.

```tsx
import { LumenMotionConfig, MotionButton } from '@santi020k/lumen-react/motion'

<LumenMotionConfig transition={{ type: 'spring', stiffness: 360, damping: 30 }}>
  <MotionButton whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>Save</MotionButton>
</LumenMotionConfig>
```

The integration uses Motion 14's public API, checked against the installed types. See the official
[Motion component documentation](https://motion.dev/docs/react-motion-component) and
[release notes](https://motion.dev/changelog). SDK code is not imported by the ordinary Lumen entry.

## Optional Rive integration

Install `@rive-app/canvas@^2.44.0` in applications using licensed `.riv` assets. Import
`createLumenRiveController` from `@santi020k/lumen-core/rive` only on the client when needed.
Supply a canvas, asset URL, and state-machine name. The controller uses current data binding with
`autoBind`, not deprecated state-machine inputs. `setValue(path, value)` accepts finite numbers,
booleans, and strings; `trigger(path)` activates a bound trigger. Missing or incompatible properties
return false. Playback is opt-in and pauses for hidden documents and reduced motion.

```ts
import { createLumenRiveController } from '@santi020k/lumen-core/rive'

const controller = createLumenRiveController({
  canvas, src: '/illustrations/workspace.riv', stateMachine: 'Workspace',
  onStatus: status => { fallback.hidden = status === 'ready' }
})
// After ready, update a data-bound property and explicitly start playback.
controller.setValue('progress', 0.5)
controller.play()
// On unmount, disconnect, or Astro view swap:
controller.destroy()
```

Keep a meaningful static fallback and use external semantic controls for important actions.
Handle `loading`, `ready`, `error`, and `destroyed` status; the library does not expose sensitive loader
errors to users. Consumer assets and WASM hosting remain application-owned. Configure the SDK's
runtime loader when a project requires self-hosted WASM or restrictive CSP; do not assume a CDN is
permitted. See [Rive's web runtime documentation](https://rive.app/docs/runtimes/web/web-js) and
[current release notes](https://github.com/rive-app/rive-wasm/releases).

## Performance boundaries

Standard visual effects use CSS. Pointer effects share at most one pending frame per surface;
keyed motion measures only direct keyed children; chart motion visits only explicitly keyed SVG marks.
Avoid motion wrappers on thousands of elements: window large datasets and animate only visible marks.
Decorative effects should be applied selectively, especially on scrolling/mobile pages.
Optional SDKs have their own bundle/runtime cost; load them only on routes that use them.
The repository's selective-import and bundle-size checks remain the package performance gates.
