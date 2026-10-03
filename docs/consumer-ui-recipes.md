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

## Attachment previews and file lists

Use AttachmentList with native `li` children. Compose each row from Attachment without `href` when
it contains separate download, replace, or remove controls. Avoid nesting controls inside a linked
Attachment. The list is a native `ul` in Astro and React; Elements exposes a list role and preserves
its native `li` children.

AttachmentPreview accepts a browser-owned `src`, required `alt`, optional `contentType`, explicit
`state`, localized `labels`, and `retryKey`. Non-image MIME types show a fallback and do not render an
image in Astro or React. Loading, error, and unavailable states can be controlled by the application.
Changing the source or retry identity clears an earlier image failure. This component does not embed
PDFs, execute document content, optimize private images on the server, or fetch attachment metadata.

React uses `caption` and `actions` nodes. Astro uses named `caption` and `actions` slots. Elements
requires an owned native image marked `data-ui-attachment-preview-image` inside a
`data-slot="attachment-preview-media"` container, plus a status paragraph marked
`data-ui-attachment-preview-message` and `data-slot="attachment-preview-fallback"`. Supply only an
image URL to this child contract. Its host supports `content-type`, `state`, `retry-key`, `error-label`,
`loading-label`, and `unavailable-label`; add an accessible name to the figure host.

DOM adapters emit `ui:attachment-preview-change` with only `{ state }`; React provides
`onStateChange`. Transitions are reported after initialization. File URLs are not included in these
events. The application owns validation, authorization, object URL creation and revocation,
replacement, removal confirmation, and persistence. Fallback text does not disable those independent
actions. Never use real identity documents in demonstration data.

## Page and section headers

Install `page-header` or `section-header` through the bundled CLI for Astro, React or Elements:

```bash
pnpm exec lumen add page-header --target astro
pnpm exec lumen add section-header --target react
pnpm exec lumen add page-header --target elements
```

These are copyable recipes composed from Stack, Typography, Breadcrumb, Badge, Link and Button.
They do not add a second heading or navigation primitive. PageHeader names the page with an `h1`,
optional ancestor breadcrumbs, description, status, and actions. SectionHeader uses an `h2` by
default; Astro and React accept a `level` from 2 through 6 to match the surrounding document.
Associate the containing section with the same `headingId` through `aria-labelledby`.

Astro recipes accept required `title` and `headingId`, optional `description`, and translated
`actionsLabel`. PageHeader also accepts `breadcrumbs`, `breadcrumbLabel` and `status`. SectionHeader
accepts a caller-formatted `count`, including an empty string or zero label. Put controls in the
`actions` slot. React uses equivalent props and an `actions` node. Elements recipes contain native
heading markup: edit the heading text, level, id, breadcrumb labels, count and action-group names
in the copied HTML. Breadcrumb uses a native `nav` child and Link wraps a native anchor to retain
link activation and keyboard semantics. Supply an accessible, meaningful count such as “12 records” or “12 registros”.

Identity and action groups wrap naturally. The identity column can shrink to the available width
and wraps long tokens. Optional descriptions, badges and actions leave no empty containers.
Action groups use `role="group"`; ordinary Tab order reaches every control. Do not use Toolbar
for these independent actions unless the application intentionally needs its arrow-key contract.
The application owns navigation, export, refresh and record creation. The recipes do not initiate
requests or announce success before the application confirms it.
