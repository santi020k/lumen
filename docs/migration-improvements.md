# Lumen Migration Improvements

This document collects reusable improvements discovered while moving existing projects onto Lumen.
It is intentionally a backlog: migrations should preserve each product's current design, while
library changes can be evaluated and implemented separately.

## Dep Beacon

### Make semantic token adoption safer for existing stylesheets

Dep Beacon already used common custom-property names such as `--surface`, `--ink`, and `--line`,
but stored complete CSS colors. Lumen uses the same names as HSL channel values and consumes them
through `hsl(var(--token))`. Importing Lumen therefore made either the existing site styles or the
Lumen components invalid, depending on stylesheet order.

Consider one or more of these options:

- publish a documented compatibility migration for full-color custom properties;
- provide namespaced channel aliases that avoid collisions during incremental adoption;
- add a CLI or MCP audit that reports conflicting token names and value formats before migration.

### Add a low-style migration mode for primitives

Existing sites often need Lumen semantics and contracts while retaining mature local visual
classes. Components such as `Card`, `ButtonLink`, and `Link` always add their complete visual class
set, so migrations must carefully override the library CSS to preserve the current design.

Consider a public `unstyled` or `appearance="inherit"` contract that keeps semantic markup,
accessibility behavior, prop normalization, and stable `data-ui-*` hooks without applying the
default presentation layer.

### Align external-link ergonomics

`ButtonLink` exposes `newTab`, while `Link` requires callers to repeat `target="_blank"` and
`rel="noopener noreferrer"`. A shared `newTab` contract would make migrations less repetitive and
reduce the chance of an unsafe or incomplete external-link setup.

## PostLens

### Keep `Toggle` presentation synchronized with `aria-pressed`

PostLens already had a small client-side controller that updates `aria-pressed` as someone previews
different looks. Lumen's `Toggle` adds `ui-toggle--pressed` only from the server-rendered `pressed`
prop, so a host script that correctly changes `aria-pressed` can leave the Lumen state class stale.

Prefer styling the pressed state through `[aria-pressed="true"]`, or provide a small public helper
that updates both the accessibility state and presentation hook. The DOM accessibility contract
should be the authoritative state wherever possible.

## Website

### Support externally controlled `Toggle` state

The website uses two toggles as a radio-like sort choice. Its controller sets the selected
button's `aria-pressed` value, but Lumen's independent click listener then inverts the clicked
toggle again. The migration had to defer synchronization to a microtask so the product state wins
after Lumen's listener runs.

Consider a controlled-state opt-out for the automatic toggle listener, or make the runtime emit a
cancelable intent event and let the host own state. `ToggleGroup` should also document the
recommended single-selection contract so consumers do not need competing click handlers.

### Make Astro HTML attribute passthrough exact-optional safe

Spreading an `HTMLAttributes<'time'>` object into `FormattedDate` fails under
`exactOptionalPropertyTypes` because the public component narrows `class` to `string`, while Astro
allows `string | null | undefined`. Audit the shared Astro prop pattern so standard attribute
objects can be forwarded to every primitive in strict projects without hand-picking attributes.

### Let `Pill` render an interactive element

The website uses visually identical pills both as metadata and as topic links. Lumen's `Pill`
always renders a `span`, forcing consumers to switch to `Link` and restyle it when a pill is
interactive. Consider an `href` contract or a typed `as` option that produces an anchor with the
same pill presentation and focus treatment.
