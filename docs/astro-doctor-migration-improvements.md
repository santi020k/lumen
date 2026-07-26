# Astro Doctor Migration Improvements

Observed while migrating the Astro Doctor documentation site to
`@santi020k/lumen-astro@0.1.0`, with a follow-up validation against `0.2.0`.

## Implementation status

The July 2026 migration pass implemented the reusable library work:

- Astro `ThemeToggle` persistence, configured theme names, synchronization, events, and
  navigation-safe idempotent initialization;
- a published Tailwind layer-order prelude with a compile fixture covering spacing, display,
  radius, width, and responsive visibility utilities;
- inherit/unstyled variants for established visual systems;
- Astro Tabs relationship generation, initial value, shared storage synchronization, and
  `ui:tabs-change`;
- development diagnostics and slotted-SVG guidance for unsupported Lucide/brand icons;
- complete theme-boundary and `NavigationMenu` focus-group guidance.

The broader downstream visual fixture remains complementary product-level coverage; Lumen's
catalog visual suite and the focused Tailwind compile fixture cover the reusable library contracts.

## Lumen 0.2.0 follow-up: Code and cascade integration

Updating Astro Doctor from `@santi020k/lumen-astro@0.1.0` to `0.2.0` exposed a failure that passed
Astro typechecking and linting but was visually severe: block-code headers, frames, and highlighted
`pre` elements rendered as separate nested cards with large gaps.

The failure had three interacting causes:

- the application imported `styles.css` before Tailwind without importing `layers.css`, so the
  first declaration of the cascade layers put the host `base` layer after Lumen's component layers;
- the host's generic `pre` styles then beat Lumen's block-code reset, restoring a border, radius,
  background, and padding on the highlighted `pre`;
- an unlayered `.prose pre` rule reached inside Lumen's `<figure><pre>…</pre></figure>` structure
  and added vertical margins even after the layer order was corrected.

The working integration uses the published prelude and this exact order:

```css
@import "@santi020k/lumen-astro/layers.css";
@import "tailwindcss";
@import "@santi020k/lumen-astro/styles.css";
```

Host typography rules should also distinguish standalone prose blocks from component internals. For
example, `.prose > pre` preserves spacing for a direct prose code block without styling the `pre`
owned by Lumen's `Code` component.

The Astro wrapper should use the public `Code` contract rather than reproducing internal classes or
CSS:

```astro
---
import { Code as HighlightedCode } from 'astro:components'
import { Code } from '@santi020k/lumen-astro'
---

<Code
  copy
  highlighted
  language="astro"
  theme="auto"
  variant="block"
  wrap
>
  <HighlightedCode
    code={source}
    defaultColor={false}
    lang="astro"
    themes={{
      dark: 'github-dark',
      light: 'github-light'
    }}
  />
</Code>
```

Passing `wrap` is preferable to manually adding `ui-code--wrap`, and consumers should not duplicate
the component's width, overflow, whitespace, or wrapping rules. `highlighted` is the explicit
contract that lets the slotted Astro highlighter provide the nested `pre` and `code`.

Future improvements from this follow-up:

- add the exact layer-prelude import order to every Astro, React, and Elements setup surface,
  including the portable skill and generated setup snippets;
- add a development diagnostic or audit check for `styles.css` used with Tailwind without the
  matching `layers.css` prelude;
- add a downstream compile/browser fixture with host `@layer base` rules for `pre` and an unlayered
  `.prose pre` rule, then assert that a highlighted `Code` block still has one frame, no inner
  border or radius, and no gap between its header and body;
- document the highlighted Astro composition as a first-class recipe instead of requiring
  consumers to infer the slot contract from source;
- consider a small Astro adapter or example wrapper for `astro:components` `Code` so theme,
  `defaultColor={false}`, language metadata, wrapping, and copy behavior stay aligned;
- include computed-style or screenshot validation for structural CSS migrations because
  typechecking, linting, and static builds cannot detect cascade-order regressions;
- exercise the copy control with `UIPrimitives` mounted and verify both copied state and clipboard
  payload in an interaction test.

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
Lumen primitive silently reverted to Lumen's previous default Inter stack.

The theming documentation should include a complete minimal override example covering `canvas`,
all surface and text roles, brand and status roles, and `--ui-font`. A migration check could warn
when the host body font and `--ui-font` resolve to visibly different stacks.
