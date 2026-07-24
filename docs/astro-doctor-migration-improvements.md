# Astro Doctor Migration Improvements

Observed while migrating the Astro Doctor documentation site to
`@santi020k/lumen-astro@0.1.0`.

## ThemeToggle behavior parity

`ThemeToggle` renders the public control and theme-aware icons, but Astro's `UIPrimitives` does not
bind click behavior or persist the selected theme. Astro Doctor must keep a local event listener,
while React exposes `useThemeToggle` and Elements includes theme-toggle behavior.

Improve Astro parity by adding the behavior to `UIPrimitives`:

- toggle the configured light and dark theme names;
- update `data-theme` on the document element;
- persist through one documented storage key;
- synchronize every mounted `ThemeToggle`;
- emit a documented theme-change event;
- cover initialization, persistence, and repeated navigation in tests.

## Tailwind cascade guidance

The documented Tailwind setup imports Tailwind before Lumen. Lumen declares its component cascade
layers after Tailwind's layers, so Lumen component rules can override Tailwind utilities passed
through a component's public `class` prop. This makes a design-preserving migration require
component-specific unlayered CSS.

Investigate one stable recommendation:

- declare Lumen layers before Tailwind utilities;
- publish an explicit layer-order prelude consumers can import;
- or document and test the supported import order for utility overrides.

Add an integration fixture that verifies common utilities such as spacing, display, radius, width,
and responsive visibility override Lumen defaults through `class`.

## Inherit and unstyled variants

`Link`, `NavigationMenu`, and `Sidebar` apply strong visual defaults. Astro Doctor needed narrow CSS
resets to preserve its existing header, footer, and documentation navigation while still using the
public components.

Consider public variants for migrations and embedded design systems:

- `Link variant="inherit"` for surrounding color and font weight;
- `NavigationMenu variant="unstyled"` for semantics and behavior without a container surface;
- `Sidebar variant="unstyled"` for layout semantics without width, border, background, shadow, or
  padding.

These variants should keep accessibility and behavior contracts intact and only remove presentation.

## Tabs composition contract

`Tabs` currently supplies the root and runtime behavior, while consumers author every tab,
tabpanel, ID, and ARIA relationship. Astro Doctor also persists the preferred package manager
across multiple tab groups, which requires a parallel local script.

Consider compound Astro primitives or a documented data-driven API that:

- generates stable tab and panel relationships;
- supports an initial value and a storage key;
- synchronizes tab groups sharing the same key;
- emits a documented selection event for both pointer and keyboard activation;
- retains the existing keyboard behavior;
- works without requiring consumers to duplicate activation logic.

## Migration regression fixture

Add a small downstream Astro fixture using Tailwind and custom semantic tokens. It should exercise
`NavigationMenu`, `ThemeToggle`, `ButtonLink`, `Sidebar`, `Tabs`, `Prose`, `Pagination`, `Callout`,
`Card`, `Badge`, and `Link`, with visual and interaction checks. This would catch the integration
issues above before publishing.

## Unsupported icons and brand-icon extensibility

`LumenIconName` accepts any string, while `renderLumenIconSvg()` silently returns an empty string
for names that Lucide does not provide. Astro Doctor used `name="github"`, which compiled but
rendered an empty icon because Lucide does not include brand marks.

Lumen should either:

- provide a generated union of supported icon names;
- warn during development when an icon cannot be resolved;
- document the slotted custom-icon pattern for brand icons;
- or expose an extension registry for project-specific icons.

## Navigation focus-group boundaries

`NavigationMenu` applies roving focus to every link and button inside its subtree. Wrapping a
complete site header therefore puts the logo, primary navigation, theme control, and external
actions into one arrow-key group and removes the independent controls from the normal tab sequence.

The documentation should show that `NavigationMenu` wraps only one related navigation group, with
brand and utility actions outside it. A development warning for mixed navigation links and
unrelated buttons would make this failure easier to catch.

## Responsive visibility on interactive primitives

`ButtonLink` includes an internal `inline-flex` display utility that can override a consumer's
`hidden` utility depending on generated CSS order. This made Astro Doctor's desktop-only npm action
visible on mobile.

Lumen should avoid encoding display mode in a way that defeats responsive consumer classes, or
document a stable visibility API for `Button`, `ButtonLink`, and similar primitives.

## Complete theme-boundary overrides

Lumen primitives set `font-family: var(--ui-font)` and some components consume `--canvas`, so
overriding only `surface`, `ink`, `line`, and brand tokens leaves a migrated application with mixed
typography and mismatched background semantics. Astro Doctor's body used Montserrat while every
Lumen primitive silently reverted to the default Inter stack.

The theming documentation should include a complete minimal override example covering `canvas`,
all surface and text roles, brand and status roles, and `--ui-font`. A migration check could warn
when the host body font and `--ui-font` resolve to visibly different stacks.
