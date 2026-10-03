# Consumer UI recipes

These additions address repeated composition work in real applications. They preserve application
ownership of requests, financial rules, drafts, purchases, and persistence.

## Static React icons

For a known icon set, import the renderer and definitions from the new static entrypoint:

```tsx
import { Button } from '@santi020k/lumen-react'
import { Icon, Search, X } from '@santi020k/lumen-react/icons'

<Button><Icon icon={Search} decorative /> Search</Button>
<Icon icon={X} label="Closed" size="sm" />
```

Definitions are also available from `@santi020k/lumen-core/icon-data`. The interface catalog remains
canonical in `icons/lumen.icons.json`; `pnpm run generate:platform-icons` regenerates its explicit
web exports. No additional consumer dependency is required. Static rendering shares SVG and
accessibility behavior with the existing named `Icon`. A label exposes an image role; an unlabeled
icon is decorative. Filled or custom definitions can be supplied directly.

Keep the root `Icon name="…"` API for runtime names and registered icon packs. Mixing it with static
icons still includes its runtime registry. There is no automatic conversion of dynamic names, and
static interface exports do not replace brand-pack registration. Avoid namespace imports or an
application-created dictionary containing every static icon: both defeat selective imports.

Run `pnpm run measure:react-client-icons` after building core and React. It compares real Vite browser
bundles containing Button, Card, Input, Table, and a named versus static search icon. It rejects a
static bundle retaining most of the registry. The initial local measurement was 749,279 versus
196,922 raw bytes and 197,790 versus 61,803 gzip bytes. This is fixture evidence, not a measurement
of any production application. The older Next.js benchmark remains a separate scenario.

## Responsive record tables

`Table layout="records"` is opt-in in Astro and React; use `<lumen-table layout="records">` in
Elements. The default remains a horizontally scrollable table. Records stack at viewport widths up
to 48rem. Wider views retain the normal column grid.

Use one column definition for headings and mobile labels. The complete typed React composition is
[record-table.tsx](../apps/next-smoke/app/consumer-recipes/record-table.tsx). Its child contract also
works in Astro and Elements:

```html
<table role="table">
  <caption>Upcoming collections</caption>
  <thead role="rowgroup">
    <tr role="row"><th scope="col" role="columnheader">Client</th></tr>
  </thead>
  <tbody role="rowgroup">
    <tr role="row">
      <td role="cell" class="ui-table__cell--wide">
        <span class="ui-table__label" aria-hidden="true">Client</span>
        <div class="ui-table__value">Example studio</div>
      </td>
    </tr>
  </tbody>
</table>
```

Explicit table roles preserve semantics when mobile CSS changes display. Headers remain available
to assistive technology; repeated visible labels are hidden from it. Use `ui-table__cell--wide` for
primary identifiers or action groups that should span the record. Values wrap without truncation.
The recipe uses ordinary table children, as required by Lumen's public compound contract.
Give the wrapper `role="region"`, an accessible name, and `tabIndex={0}` when it can scroll. Labels
and values should use the same active locale; never derive labels from CSS-generated strings.

Use this layout for simple operational records. Keep spreadsheet previews, multi-level headers,
row/column spans, footers, and tables that depend on side-by-side numeric comparison in the default
scroll layout. Empty states and pagination are composed outside the table. The layout does not add
sorting, filtering, or virtualization; those remain the existing DataTable contracts.

The `/consumer-recipes` route in the Next smoke app exercises long names, maximum amounts, both
languages, row actions, and the 768/769-pixel breakpoint. Browser tests capture light and dark
screenshots at 320, 768, 769, and 1440 pixels.

## React Native sheets

The existing `LumenSheet` now accepts optional `scrollable`, `avoidKeyboard`, `safeAreaInsets`,
`keyboardVerticalOffset`, `presentation`, and `dismissible` props:

```tsx
const insets = useSafeAreaInsets() // From the application's existing provider.

<LumenSheet
  title="Edit record"
  visible={open}
  onDismiss={() => setOpen(false)}
  dismissible={!pending}
  presentation="adaptive"
  safeAreaInsets={insets}
  avoidKeyboard
  scrollable
  actions={<LumenButton loading={pending} onPress={save}>Save</LumenButton>}
>
  <LumenTextField accessibilityLabel="Name" value={name} onChangeText={setName} />
</LumenSheet>
```

A scrolling body leaves the heading and actions outside the scroll region. Adaptive presentation
uses a centered, bounded dialog on windows at least 768 points wide. Pass the application's safe
area insets; Lumen does not add a second provider or require a new dependency. Keyboard avoidance
uses React Native's platform behavior. Set `keyboardVerticalOffset` for an external navigation
header when needed; do not also wrap the same content in another keyboard-avoidance container.

The sheet honors the system reduced-motion preference. Its visible title names the modal; supply
`accessibilityLabel` when rendering a sheet without a title. Decorative backdrop targets do not enter
keyboard navigation.

Defaults preserve bottom-sheet presentation, direct children, and ordinary dismissal. Dismissal
locking affects backdrop taps and platform back requests; applications must also disable their own
close actions. Native keyboard overlap still requires device testing in the consuming navigation
and Android window configuration. Web rendering cannot prove that behavior.

## Whole-unit amount entry

[whole-amount-field.tsx](../apps/next-smoke/app/consumer-recipes/whole-amount-field.tsx) is a copyable
consumer recipe built from Field, Label, and NumberField. It retains editable text, so clearing the
field does not become zero. The numeric keyboard and explicit instructions accept ungrouped ASCII
digits; a separately formatted preview follows the locale and currency. Group separators,
exponents, negatives, fractional amounts, unsafe integers, and values above the application's
maximum are rejected rather than guessed or rounded.

This recipe deliberately models whole units, such as whole Colombian pesos. It does not parse
arbitrary localized currency text or convert fractional currencies. Define a minor-unit contract
first for those requirements. Field errors are linked to the input and participate in native form validation; an empty required input uses
native required validation. The caller must enforce validity at submission and validate again at
the API boundary. Currency formatting is presentation, not financial validation.

## Adaptive SwiftUI editor

[adaptive-editor.swift](recipes/adaptive-editor.swift) is a consumer-owned composition using
LumenSurface and SwiftUI layout. Supply preview, controls, and actions. It places controls beside
the preview in a sufficiently wide landscape window, below it in narrow windows, and below it at
accessibility text sizes. Controls scroll independently, while a safe-area action region can wrap
from horizontal to vertical. Use LumenButton, LumenSlider, and other public controls inside slots.

Keep crop geometry, undo history, photo rendering, draft ownership, and export coordination in the
application. Do not copy fixed preview sizes between products. Verify minimum-height windows,
landscape, split view, large text, and long localized action labels in the consuming editor.

## Asynchronous actions and recovery

Use controlled state and the existing Button, Alert/ErrorState, Progress, and status surfaces:

| State | Presentation | Application responsibility |
| --- | --- | --- |
| Idle | Enabled action and clear consequence | Validate prerequisites |
| Pending | Loading action; persistent progress for long work | Guard concurrent calls synchronously; retain request identity |
| Success | Persistent completion text and appropriate next action | Confirm the actual result before declaring success |
| Failure | Safe inline error and explicit recovery | Preserve entered data and distinguish retryable failures |
| Cancelling | Explain that cancellation is in progress | Wait for cancellation acknowledgement before returning to idle |
| Uncertain result | Explain that completion is being checked | Reconcile with the server before repeating a consequential write |

For React, `Button loading={pending}` blocks activation and exposes busy state. A form should also
prevent repeated submit events and disable relevant fields. Use a ref or request controller to guard
same-turn submissions; visual loading state alone is not an idempotency mechanism. Disable dismissal
only while losing the view would lose required context. Restore focus after a dialog closes and
announce completion once through a polite status region.

For SwiftUI and React Native, use native Lumen loading buttons and progress/status surfaces. Keep
operations owned by the application rather than starting them from visual component initialization.
Cancellation support is explicit: only show Cancel when the operation can honor it. Superseded work
must not clear a newer request's pending state. A completed export can show a persistent saved state;
a later edit can make that action available again.

Undo is an application transaction exposed through a status action. Retain focus and announce its
result. Lumen should not decide what can be reversed, retry payments, restore purchases, publish a
post, or store an idempotency key. See [error handling](error-handling.md) for the existing
cross-platform recovery surfaces and announcement contracts.

## Dashboard filters and record details

Use `FilterBar` to group existing SearchField, Select/NativeSelect, date controls, and reset actions.
It does not fetch records or persist filters. In React, `filters` contains stable IDs and display
labels; `onRemoveFilter(id)` and `onReset()` request changes from the host. Keep one
`LumenDataViewState` owner and use `createDataViewServerRequest` for server filtering. Reset the page
when criteria change, abort superseded requests, and ignore responses from older requests. Preserve
URL/storage ownership in the application using the existing data-view helpers.

Pass a complete localized `resultLabel`, such as "0 matching records". Leave it absent while the
count is unknown; do not announce a fabricated zero. `pending` marks the region busy and disables
React removal/reset actions. Disable authored Astro controls in the same state. The native details
control remains keyboard usable without JavaScript. `open` controls the initial Astro disclosure;
React also supports `defaultOpen` and `onOpenChange`. Supply closed mobile defaults only when the
application can reliably determine its layout; hiding active criteria can obscure a filtered view.

Astro provides `active` and `actions` slots. Elements preserves authored native details, controls,
active-filter buttons and a polite status region inside `<lumen-filter-bar aria-label="Filters">`.
Use the public Lumen controls in both adapters. Give each removal action a name containing both
criterion and value. Keep active criteria visible outside the collapsed controls.

React `DataTable` now supports `layout="records"`, `column.render(cell, row)`, and
`renderDetails(row)`. Sorting still reads the original cell or its explicit `sortValue`, never a
badge's rendered text. Use stable `rowValue`/`id` values; expanded IDs must not depend on page order.
`expandedRowIds` plus `onExpandedRowIdsChange` controls expansion across paging. Customize
`expandLabel`, `collapseLabel`, and `detailsLabel` for the current language. Details travel with
their record during sorting. The renderer owns links/actions and should label them by record.

```tsx
const [sort, setSort] = useState<DataTableSort | null>(null)
const columns = [
  { key: 'client', label: 'Client', sortable: true },
  { key: 'balance', label: 'Balance', sortable: true, sort: 'number' as const,
    render: (cell: DataTableCell) => typeof cell === 'number' ? <Badge>{cell}</Badge> : 'Unavailable' }
]
<DataTableSortControls columns={columns} sort={sort} onSortChange={setSort} />
<DataTable columns={columns} rows={serverPage} layout="records" sort={sort}
  sortMode="manual" onSortChange={setSort} renderDetails={row => <p>{String(row.id)}</p>} />
```

The toolbar and headers share one sort state. `sortMode="manual"` preserves the supplied page
order. Astro supports the same mode; Elements uses `sort-mode="manual"`. Both dispatch
`ui:data-table-sort-change` with `{ key, columnIndex, direction }`. Annotate authored headers with
`data-ui-datatable-sort-key` to identify server fields. `direction="none"` requests default order.
Use authored Table children for rich Astro/Elements cells, with native details inside a cell so the
record and its disclosure remain one row. Responsive records use the documented `ui-table__label`
child contract and retain keyboard access to sortable headers.

## Review proposed changes

Use `ChangeSummary` before confirmation for imports, allocations, or settings. Each item has a
stable `id`, a field `label`, explicit `before` and `after` strings, and an application-owned
`changed` boolean. The component never infers financial equality, parses amounts, or applies the
proposal. Supply `summary` for localized counts and customize the four before/after/state labels.
Both changed and unchanged states use visible text, so meaning is available without color.

```tsx
<ChangeSummary label="Review allocation" summary="1 changed field" items={[
  { id: 'amount', label: 'Amount', before: 'COP 25,000', after: 'COP 30,000', changed: true },
  { id: 'owner', label: 'Owner', before: 'Example studio', after: 'Example studio', changed: false }
]} />
```

Astro accepts the same props. Elements accepts `.items` and `label`, `summary`, `before-label`,
`after-label`, `changed-label`, and `unchanged-label` attributes. Its setter validates unique IDs
and typed display values, copies input records, and renders text safely. Authored audit notes remain
intact. Keep original ledger facts in the application; confirmation creates an auditable command.

## Data availability and freshness

Distinguish `available`, `missing`, `pending`, `stale`, and `failed` in the application model. Use
Stat for a value, Badge for the state, FormattedDate for the last successful observation, and
ErrorState/Alert with an explicit recovery action when collection fails. A successful observation
of zero renders zero. Missing metrics render "Unavailable" and chart data uses `y: null`; stale
values retain their last known value and timestamp with a visible stale label. Refreshing should
retain usable prior data rather than replacing it with zero or a misleading empty state.

```tsx
<Stat label="Downloads" value={metric.value === null ? 'Unavailable' : formatNumber(metric.value)}>
  <Badge variant={metric.stale ? 'warning' : 'outline'}>{metric.stale ? 'Stale' : 'Available'}</Badge>
  {metric.observedAt && <FormattedDate dateTime={metric.observedAt}>{formatDate(metric.observedAt)}</FormattedDate>}
  <Button loading={refreshing} onClick={refresh}>Refresh</Button>
</Stat>
```

Use timestamps or stable period keys for chart `x`; put localized date text in `xLabel`. Different
periods may have identical display labels. Do not collapse their identities. Freshness thresholds,
permissions, collection schedules, and retry decisions belong to the application.

## Import review flow

Compose FileUpload, Stepper, Alert, DataTable, ChangeSummary, and explicit confirmation actions.
Use the steps Choose file → Review issues → Review changes → Confirm → Result. Keep parsing and
reconciliation in the host. FileUpload validation is input assistance, not proof of safe content.

Hold a versioned proposal separate from current records. Report invalid rows with line numbers and
safe descriptions; show the accepted, rejected, unchanged, and changed counts. Block confirmation
until blocking issues are resolved. Provide an accessible downloadable issue report if the host
supports it. Use `ChangeSummary` for proposed field changes and a responsive record table for row
preview. A retry must reuse/reconcile the application's transaction identity rather than applying
the same proposal twice. Retain the original file/proposal on failure; let the user correct or cancel.

At confirmation, display the destination and consequence, disable concurrent submissions, and
wait for durable acknowledgement before showing success. Keep an audit record of accepted rows and
changes. A timeout is an uncertain result requiring reconciliation, not automatic failure or retry.
Lumen does not implement CSV/XLSX parsing, merge policy, or destructive import semantics.

## Activity inbox

Compose Popover, FloatingBadge, Timeline, Pagination, and Empty/ErrorState. Count unread events in
the host; omit the badge while the count is unknown. Name the trigger, such as "Activity, 3 unread",
and use a region/list inside Popover rather than a menu role for non-menu content. Each event needs
a stable ID, meaningful action, timestamp, and visible read/unread state. Use an explicit mark-read
command; opening the panel should not silently discard notifications.

Keep unread changes and page requests independently pending. Announce a successful mark-read once,
retain the item and count on failure, and preserve focus while pages load. Preserve historical events
and distinguish empty history from a failed request. The host owns read cursors, permissions,
pagination, subscription cleanup, and durable persistence.

React Popover/DropdownMenu now promote panels to the browser top layer when the Popover API is
available. Placement defaults to `bottom-start`, flips vertically, and clamps to the visual viewport.
Logical start/end follows text direction; `offset` and `collisionPadding` adjust safe spacing.
`positioning="none"` opts out for specialized application layout. The fixed-position fallback cannot
escape every transformed ancestor in older browsers. Cleanup restores styles and owned focus;
focus moved into a newly opened dialog is retained.

## Persistent Kanban moves

Use the existing `useKanban` move request or Astro/Elements `ui:kanban-move-request` event as an
application command. Track stable item IDs, source/destination columns, order, and a server revision.
Prefer pessimistic persistence for consequential workflows: keep the item in its confirmed column,
disable a second move for that item, and announce pending status. Apply the returned canonical board
only after the server acknowledges success. On failure retain confirmed state, explain recovery,
and restore focus to the item or its move action.

For optimistic boards, store a rollback snapshot with the request ID. A rejected or superseded
request must not overwrite newer board state. Reconcile conflicts from the server rather than
replaying stale order. Guard duplicate submissions, cancel listeners on unmount, and offer keyboard
move actions alongside drag interaction. Announce the resulting column after success. Persisting,
reordering, authorization, retries, and audit history belong to the application, not to Lumen.

## Numeric relationships and dashboard quadrants

ScatterChart accepts `formatX` and `formatY` independently; `formatValue` remains the fallback for
Y/size presentation. `xDomain` and `domain` define explicit X/Y bounds. `xScale="log"` places positive
raw X values logarithmically; zero, negative, or missing X and unavailable Y are omitted. Explicit log
bounds must be positive, finite, and increasing. Empty log charts use finite fallback bounds.

```tsx
<ScatterChart aria-label="Reach and momentum" xScale="log"
  xDomain={{ min: 1, max: 100000 }} domain={{ min: -10, max: 10 }}
  formatX={value => formatNumber(Number(value))} formatY={value => `${value}%`}
  series={growthSeries} references={[
    { id: 'reach', label: 'Reach threshold: 1,000', x: 1000 },
    { id: 'momentum', label: 'No change: 0%', y: 0 },
    { id: 'target', label: 'High reach and positive momentum', x: 1000, xEnd: 100000, y: 0, yEnd: 10 }
  ]} />
```

References are descriptive lines (`x` or `y`) or regions (`x`, `xEnd`, `y`, `yEnd`). Visible reference
labels accompany the plot for nonvisual access. Keep thresholds, momentum calculations, audience
normalization, and quadrant classification in the host. Astro has the same props. Elements uses
`x-scale`, `x-min`, `x-max`, `domain-min`, and `domain-max`; set `.references`, `.categoryFormatter`,
and `.valueFormatter` for reference geometry and independent axis presentation. No application
business formula belongs in the chart component.
