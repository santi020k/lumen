# Visual product recipes

Three editable compositions extend Lumen's existing primitives: `card-detail`, `metric-card`, and
`task-progress`. Each supports Astro, React, and Elements. The
[product recipes workbench](https://lumen.santi020k.com/docs/visual-playground/recipes) uses their React
sources directly with explicitly illustrative data.

```bash
pnpm exec lumen add card-detail --target react
pnpm exec lumen add metric-card --target react
pnpm exec lumen add task-progress --target react
```

Use `--target astro` or `--target elements` for the other adapters. Load the adapter stylesheet and
the installed recipe styles once in the application's layout or entry:

```ts
import '@santi020k/lumen-react/styles.css'
import './lumen/card-detail.css'
import './lumen/metric-card.css'
import './lumen/task-progress.css'
```

Replace the adapter name with `lumen-astro` or `lumen-elements` where appropriate. Applications that
already use selective component CSS can retain that setup and add the recipe's listed components.
The local CSS only controls recipe layout; public components retain their styling and behavior.
Elements examples need a bundler for package and TypeScript module imports. Register the public
Elements constructors once before calling `renderMetricCard`.

## Card details

`CardDetailRecipe` accepts `title`, `summary`, `openLabel`, `closeLabel`, and
`presentation="dialog" | "sheet"`. Its React children or Astro default slot provide the details.
Astro also requires a unique `id`. The compact card contains a real Button; the entire card is not
turned into a nested interactive control. Public Dialog and Sheet primitives own placement,
transitions, Escape handling, focus containment, and return focus. Reduced motion follows those
public primitives.

```tsx
<CardDetailRecipe title="Release overview" summary="Inspect the scope and evidence.">
  <Typography><p>The application supplies these details.</p></Typography>
</CardDetailRecipe>
```

Astro must mount `@santi020k/lumen-astro/runtime` once in the root layout. The Elements starter uses
`lumen-dialog`; change it to `lumen-sheet` and replace its trigger/close data attributes with
`data-ui-sheet-trigger` and `data-ui-sheet-close` for a sheet. Give each instance unique IDs.

## Metric states

`MetricCardRecipe` composes Card, a bare Stat, AnimatedNumber, Sparkline, Badge, and Skeleton.
The snapshot is a discriminated union:

- `loading`: reserves the card's visual space and exposes a concise status.
- `error`: requires a safe `message`; the React `onRetry` callback or Astro `retry` slot supplies recovery.
- `ready` and `stale`: require `value`, `values`, `change`, `comparison`, `trend`, and `updatedAt`.

Stale data remains visible and explicitly labeled. A failed request does not invent a zero or hide
behind an empty sparkline. `trend` is `positive`, `negative`, or `neutral`; the application decides
whether an increase or decrease is beneficial. Format the explanatory strings in the application's
locale. The numeric renderer accepts `locale`, `prefix`, `suffix`, and `decimals`.

```tsx
<MetricCardRecipe label="Monthly revenue" prefix="$" snapshot={{
  state: 'stale', value: 184320, values: [118, 126, 132, 148, 162, 184],
  change: '+12.4%', comparison: 'versus the previous month', trend: 'positive',
  updatedAt: 'Updated 12 minutes ago'
}} />
```

Elements exports `renderMetricCard(root, options, onRetry?)`. Call it again with the next snapshot;
the application owns requests and can switch to `loading` while recovery is pending. Astro renders
the supplied snapshot on the server; hydrate a React island or rerender through the host's existing
navigation/data mechanism when client-side updates are required.

## Task progress

Supply a snapshot with `status`, `completed`, `total`, and `detail`. Status is `queued`, `running`,
`complete`, `failed`, or `canceled`. Progress represents real completed work; `total` must be positive
and finite, with `completed` between zero and `total`. Use the same unit throughout a task. A complete
snapshot should report all units complete. No timer advances progress or assumes success.

React uses `onAction('cancel' | 'retry')`, optionally returning a promise. Pending requests disable
the action button. Rejected requests show `actionErrorLabel` without exposing internal errors.
The host supplies the next snapshot only after the relevant operation is confirmed. Retry is shown
for failed/canceled tasks, cancel for queued/running tasks, and no action for completed tasks.
Override `labels`, `progressLabel`, `retryLabel`, and `cancelLabel` for localized interfaces.

Astro actions are opt-in with `actions`. Elements actions start disabled. Connect the host before
enabling controls, then mount the installed controller once:

```ts
import { mountTaskProgress } from './lumen/task-progress-controller'

let cleanup: (() => void) | undefined
const mount = () => {
  cleanup?.()
  cleanup = mountTaskProgress(document)
}
mount()
document.addEventListener('astro:page-load', mount)
document.addEventListener('astro:before-swap', () => {
  cleanup?.()
  cleanup = undefined
})
```

Elements already mounts that controller in its starter, cleans it up on `pagehide`, and remounts
after `pageshow` when restored from the back/forward cache. Other SPA hosts should call its cleanup when the view unmounts. Mounting the same DOM nodes twice is harmless.
Each root emits `ui:task-action` with `{ action }`. The host disables its action controls while a
request is pending, handles errors, and re-enables them after the request settles. It sends real
updates directly to that same root:

```ts
root.dispatchEvent(new CustomEvent('ui:task-update', {
  detail: { status: 'running', completed: 1, total: 3, detail: 'Rendering the second file.' }
}))
```

The controller validates unknown update payloads and ignores malformed values. Text is assigned as
text content, never HTML. Keep authorization, request cancellation, idempotency, persistence, and
task identity in the application. A cancel request alone must not display the canceled state.

## Verification

Focused tests cover installed files, modal return focus for dialogs and sheets, metric states,
duplicate React actions, safe callback failures, validated DOM snapshots, cleanup, and real-state
progress. The live workbench provides narrow and wide rendered previews without calling services.

<!-- cspell:words pagehide pageshow -->
