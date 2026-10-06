# Content flow and spacing

Lumen layouts express relationships between content. Keep related text and controls close, give
separate groups more room, and use the largest gaps between major sections. A consistent numeric
scale supports those relationships; it does not mean every gap should be equal.

## Ownership

| Concern | Owner |
| --- | --- |
| Distance between siblings | The parent `Stack` or `Grid` |
| Distance from content to a surface edge | `Card` or the matching surface component |
| Label, control, hint and error spacing | `Field` |
| Heading, paragraph and list rhythm | `Prose` or `Typography` |
| Outer border and corners | One enclosing surface |

Do not add child margins on top of a parent's gap. `Stack` and `Grid` clear direct-child external
margins. `Card` owns its direct-child gap; its parts have no external margins. Empty parts and parts
marked `hidden` do not occupy layout space. Omit optional sections rather than rendering
whitespace-only wrappers. Use a nested `Stack` for groups inside `CardContent`.

## Canonical scale and roles

`tokens/lumen.tokens.json` owns the scale and role aliases. The platform-token generator emits
web variables into the shared stylesheet alongside the native numeric foundations.

| Gap | Default size | CSS variable |
| --- | --- | --- |
| `none` | 0 | `--ui-space-zero` |
| `xs` | 4px | `--ui-space-xs` |
| `sm` | 8px | `--ui-space-sm` |
| `md` | 12px | `--ui-space-md` |
| `lg` | 16px | `--ui-space-lg` |
| `xl` | 24px | `--ui-space-xl` |
| `2xl` | 32px | `--ui-space-2xl` |
| `3xl` | 48px | `--ui-space-3xl` |
| `related` | `sm` / 8px | `--ui-space-related` |
| `group` | `lg` / 16px | `--ui-space-group` |
| `section` | `2xl` / 32px | `--ui-space-section` |

Web dimensions use `rem`; pixel equivalents assume a 16px root. Stack and Grid default to `group`,
preserving their previous 16px default. The `inset` role maps to `xl` / 24px for comfortable surface
padding; it is a CSS token, not a Stack/Grid gap option. Override role aliases at a product or theme
boundary; individual size tokens stay predictable.

## Settings surface

```astro
---
import {
  Button, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle,
  Field, Input, Label, Stack
} from '@santi020k/lumen-astro'
---

<Stack gap="section">
  <Card>
    <CardHeader>
      <CardTitle as="h2">Notifications</CardTitle>
      <CardDescription>Choose where your team receives updates.</CardDescription>
    </CardHeader>
    <CardContent>
      <Stack gap="group">
        <Field>
          <Label for="team-email">Team email</Label>
          <Input id="team-email" name="email" type="email" />
        </Field>
        <Field>
          <Label for="team-name">Team name</Label>
          <Input id="team-name" name="team" />
        </Field>
      </Stack>
    </CardContent>
    <CardFooter>
      <Button>Save changes</Button>
      <Button variant="secondary">Cancel</Button>
    </CardFooter>
  </Card>
</Stack>
```

React uses the same component and prop names, with `htmlFor` on Label. Elements uses
`<lumen-stack gap="section">` and the corresponding `<lumen-card-*>` parts. Read the adapter's
setup and field accessibility contract before connecting validation or actions.

## Density, borders and text

Card `density="compact"` uses a 16px inset and 12px part gap. The default `comfortable` density
uses a 24px inset and 16px part gap; `spacious` uses a 32px inset and 24px part gap. Density adjusts
the surface, not control heights or touch targets. Existing `--ui-card-padding`, `--ui-card-gap`
and `--ui-card-section-gap` overrides remain available.

Card footers wrap actions when their labels cannot fit. Prefer natural content height, readable
line lengths and aligned edges over fixed heights or manual offsets. Check long headings,
translated labels, field errors and enlarged text. Use spacing to group content where another
bordered surface would add no meaning.

One frame owns each outer border and radius. Use a single Separator at a shared edge, and place
artwork in its own clipping frame so controls retain visible focus. Use Image `radius="none"`
when artwork sits flush against that frame. Keep responsive gutters in one outer Container;
nesting Containers unnecessarily reduces available width.

## Reading rhythm and page gutters

Prose and Typography give headings more space above than below. Their first and last direct children
have no external block margin, so a reading block fits naturally inside a Card or Stack. Keep the
heading and its description in one Typography block; do not give each paragraph its own Card.
Nested lists retain a smaller internal gap. Prose keeps its 65-character reading measure.

Container uses `--ui-container-gutter: clamp(1rem, 4vw, 2rem)` through the group and section spacing
tokens. At the default root, the side gutter is 16px at 320px, 24px at 600px, and 32px from 800px.
The existing size limits still apply. `size="full"` intentionally remains edge-to-edge. Products
can override `--ui-container-gutter` at the theme root or on an individual Container;
avoid adding a second page padding. Rem bounds grow with enlarged text.

## Clipping and overlays

Card allows overflow so a focus ring or dropdown can extend beyond its border. Put artwork in
AspectRatio, which owns rounded clipping, and use Image `radius="none"` inside it. A card-wide
clipping rule can hide keyboard focus and menu options. If an existing consumer used Card to crop
media, move that clipping to the media frame when upgrading.

Dialog retains scrollable overflow for short viewports. TabsList retains horizontal scrolling for
long labels. Accordion retains its disclosure clipping, with controls inset inside the content.
Accordion and Collapsible own their horizontal content padding on the disclosure container, so
paragraph margin resets cannot remove the inset. Their summaries share that text alignment while
keeping the full header clickable; the chevron rotates inside a fixed circular background.
Bordered disclosures keep an inset between the header background and the body, including on hover.
Flush accordions retain their compact list spacing.
These overflow rules serve different purposes; do not replace them with one global overflow rule.
The regression fixture checks disclosure controls, menu escape and focus restoration, dialog
scrolling, tab empty states and field errors at normal and enlarged text sizes.

## Installable compositions

The CLI provides complete starter compositions for all three web adapters:

```bash
lumen add content-flow-header --target astro
lumen add content-flow-settings --target react
lumen add content-flow-list --target elements
lumen add content-flow-actions --target astro
```

Each recipe uses public components and semantic gaps. The header groups its title and description;
settings separates field groups from surface insets; the list uses semantic list roles and wrapping
rows; the action bar groups status and wrapping actions. Put them under one Container and a Stack
with `gap="section"`. Use an Empty component when a dynamic list has no records.

Elements Stack accepts `align`, `justify` and `wrap` attributes. Use `wrap` or `wrap="true"` to wrap;
`wrap="false"` and removing the attribute disable wrapping. The alignment names match Astro and React.

The examples are compositions, not persistence implementations. Connect save, discard, invite and
activity actions to the application; wrap settings in the application's Form contract when it is
submitted. Replace sample IDs when rendering multiple instances. In Elements, labels use explicit
`aria-labelledby` references to the internal native controls. Keep input errors associated with
`aria-describedby` and `aria-invalid`. The MCP `lumen_get_recipe` response includes the complete
source for the selected framework, so agents can reuse the same examples installed by the CLI.

## AI and verification

Retrieve `lumen_get_tokens` for spacing dimensions and roles, then read the selected component
contracts. Prefer semantic gap roles in generated screens. Keep paragraph rhythm inside Prose or
Typography; do not combine their margins with another gap for the same relationship. Verify phone
and desktop widths in both themes, enlarged text, shared edges, wrapping, overflow, keyboard focus
and missing-header, missing-footer, hidden, empty and validation states.

The v4 migration guide records changed explicit gaps and defaults. Native adapters retain their
platform layout APIs; web density props and CSS variables do not imply native props.
