# Lumen Design System

## Character

Aim for calm, precise, product-focused interfaces. Favor legibility, clear hierarchy, restrained
surfaces, and predictable interaction over ornamental effects. Make the product feel authored by
its content and workflow, not by adding generic dashboard decoration.

## Semantic Color Contract

Use these public tokens:

| Role | Tokens |
| --- | --- |
| Base | `canvas`, `surface`, `surface-muted`, `surface-strong` |
| Text | `ink`, `ink-soft`, `ink-muted` |
| Border | `line` |
| Primary action | `brand`, `brand-solid`, `brand-soft` |
| Secondary accent | `accent` |
| Status | `success`, `warning`, `danger` |

In CSS, consume tokens through `hsl(var(--token))`, for example:

```css
.product-panel {
  border: 1px solid hsl(var(--line));
  background: hsl(var(--surface));
  color: hsl(var(--ink));
}
```

Override the semantic variables at a theme boundary rather than styling every component
individually. Keep foreground/background contrast valid in both light and dark modes.

## Composition Principles

- For v4, choose `default`, `studio`, or `glass` through `data-lumen-preset` on a web theme
  boundary. Keep the light/dark scheme independent with `data-lumen-scheme`. Preset changes
  preserve application state. Retrieve the matching installed contract before using these
  attributes; native adapters use their documented theme APIs.

- Establish hierarchy with spacing, alignment, weight, and content grouping before adding effects.
- Keep primary actions visually dominant and destructive actions unmistakable.
- Use `surface-muted` to group supporting content and `surface-strong` sparingly for emphasis.
- Use borders to clarify structure. Use shadows and large radii only when they explain elevation.
- Use `glass`, `glass="subtle"`, or `glass="strong"` only where the selected component exposes the
  public glass contract. Keep dense reading and form surfaces opaque when translucency hurts clarity.
- Reuse spacing and alignment patterns across a screen; avoid one-off offsets.
- Provide responsive behavior based on content pressure, not arbitrary device labels.
- Respect reduced-motion preferences and keep transitions short and functional.

## Content flow

- Retrieve complete content-flow-header/settings/list/actions recipes with lumen_get_recipe.
  Container gutters grow from group to section spacing; avoid a second page padding.
  Reading blocks trim outer child margins. Card allows overlays and focus to extend beyond its
  border; use AspectRatio to clip media. Wire recipe actions and replace sample IDs for repeats.

- Retrieve spacing and spacingRoles through `lumen_get_tokens` before choosing layout values.
- Stack and Grid own sibling gaps; surfaces own padding; Field owns label/control/feedback spacing.
  Do not add child margins on top of a gap. Use related for closely related controls, group for
  separate groups and section for major sections. The default is group (16px).
- Size gaps follow the canonical scale: xs=4, sm=8, md=12, lg=16, xl=24, 2xl=32, 3xl=48.
  Web variables use rem. The inset role is a padding token, not a gap prop.
- Use Card parts and nested Stack for body groups. Card owns part spacing, omits empty/hidden
  parts from layout and wraps footer actions. Choose compact, comfortable or spacious density.
- Keep text rhythm inside Prose or Typography. Avoid another gap for the same text relationship.
- Verify long translated labels, enlarged text, optional sections and error messages at phone and
  desktop widths in both themes. Keep page gutters in one outer Container.

## Borders and rounded compositions

Before styling a composed surface, identify which element owns each visible boundary.

- Let one container own each outer border and radius. Content flush against that container
  should not repeat its rounding. Lumen `Image` defaults to `radius="lg"`; use
  `<Image radius="none" ... />` when placing it directly below a header inside a rounded frame.
  Keep standalone image rounding when appropriate.
- Use one divider between attached sections rather than overlapping full borders.
- Inset surfaces separated by padding can own their borders and radii. Account for the inset
  so the inner and outer curves align instead of blindly applying the same radius.
- Clip artwork at its frame. Avoid applying clipping to an entire interactive surface when
  it would cut off focus rings, shadows, or overlays.
- Inspect the rendered shared edges at phone and desktop widths in light and dark themes.
  Check for rounded gaps, doubled borders, and clipped keyboard focus.

## Accessibility and Product States

- Associate every field with a visible label or an equivalent accessible name.
- Preserve logical heading order and landmark structure.
- Keep focus visible and return focus after dismissing overlays.
- Give icon-only controls a clear pointer target and an accessible label.
- Do not rely on color alone for selection, validation, or status.
- Design loading, empty, error, success, disabled, selected, and destructive states when relevant.
- Use `AlertDialog` or confirmation patterns only for consequential actions; avoid confirmation
  friction for safe, reversible changes.

## Review Smells

Revise interfaces that show these patterns:

- hardcoded brand hex values alongside Lumen tokens;
- hand-built buttons, fields, dialogs, or menus that duplicate a Lumen primitive;
- excessive cards nesting every piece of content;
- several equal-weight primary actions;
- glass on every surface;
- emoji used as functional icons;
- placeholder charts or metrics unrelated to the product;
- hover-only cues or interactions with no keyboard path;
- desktop-only fixed widths that force horizontal scrolling;
- visual polish that removes labels, context, or status feedback.
