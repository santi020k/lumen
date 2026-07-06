# Figma Design-to-Code Workflow

This guide describes how to turn a Figma design into Lumen components. It targets both humans and
AI agents working in a session with the official Figma MCP server connected. Token export in the
other direction (code to Figma variables) is covered in [figma.md](figma.md).

## Workflow

1. Get the Figma URL for the frame or component to implement. Node-specific URLs
   (`figma.com/design/:fileKey/:fileName?node-id=...`) work best.
2. Pull design context with the Figma MCP tools:
   - `get_design_context` for structure, layout, text, and styling of the selected node.
   - `get_screenshot` for a visual reference to validate against.
   - `get_variable_defs` for the variables/tokens used by the node.
3. Map the output to Lumen using the rules below and the machine-readable map in
   [`registry/figma-design-map.json`](../registry/figma-design-map.json).
4. Build with Lumen primitives first. Only write custom markup for layout containers and content
   that no Lumen component covers.
5. Validate: compare against the screenshot, then run `pnpm run typecheck` and relevant tests.

## Mapping Rules

### Components over divs

Match Figma nodes to Lumen components by role, not by name. A rectangle with text and an
`onClick`-looking affordance is a `Button`; a bordered container grouping content is a `Card`; a
text node paired with an input rectangle is `Label` + `Input` (or `Field`). The full component
inventory lives in `packages/core/src/components.ts` (`lumenComponentNames`).

Common Figma pattern → Lumen component mappings:

| Figma pattern | Lumen component |
| --- | --- |
| Clickable filled/outlined rectangle with label | `Button` |
| Row of related buttons | `ButtonGroup` or `ToggleGroup` |
| Bordered/elevated content container | `Card` |
| Text input with placeholder | `Input` (with `Label`, or use `Field`) |
| Input with leading/trailing icon or addon | `InputGroup` |
| Multi-line text input | `Textarea` |
| Dropdown with options | `Select` or `NativeSelect` |
| Dropdown with free text filtering | `Combobox` or `Autocomplete` |
| Small status pill | `Badge` |
| User photo or initials circle | `Avatar` |
| Horizontal/vertical divider line | `Separator` |
| Overlay panel centered on screen | `Dialog` (destructive confirm: `AlertDialog`) |
| Overlay panel from screen edge | `Sheet` or `Drawer` |
| Small floating panel anchored to a trigger | `Popover` (hover-only: `HoverCard`, text-only: `Tooltip`) |
| Row of section switchers | `Tabs` |
| Expandable sections | `Accordion` (single: `Collapsible`) |
| On/off toggle | `Switch` or `Toggle` |
| Checkbox / radio rows | `Checkbox` / `RadioGroup` |
| Data grid | `Table` or `DataTable` |
| Page navigation numbers | `Pagination` |
| Left navigation column | `Sidebar` |
| Progress bar | `Progress` |
| Loading placeholder blocks | `Skeleton` |
| Inline notification banner | `Alert` |
| Transient corner notification | `Toast` / `Sonner` |
| Date picking UI | `DatePicker`, `DateRangePicker`, or `Calendar` |
| Keyboard shortcut hint | `Kbd` |
| Empty-state illustration block | `Empty` |

### Colors: variables to semantic tokens

Never copy raw hex values from Figma output. Map every color to a Lumen semantic token and use it
via `hsl(var(--token))` in CSS or the matching utility class. If the Figma file uses Lumen-named
variables (`color/brand`, `color/surface`, ...), the mapping is direct. Otherwise map by role:

| Figma color role | Lumen token |
| --- | --- |
| Page background | `canvas` |
| Component background | `surface` (subtle: `surface-muted`, raised: `surface-strong`) |
| Primary text | `ink` (secondary: `ink-muted`, tertiary: `ink-soft`) |
| Borders and dividers | `line` |
| Primary/accent brand color | `brand` (fills: `brand-solid`, tints: `brand-soft`) |
| Secondary emphasis | `accent` |
| Error/destructive | `danger` |
| Positive/complete | `success` |
| Caution | `warning` |

A color in the design that maps to none of these is a signal to talk to the design owner, not to
hard-code a hex value.

### Layout, spacing, and typography

- Reproduce auto-layout with flex/grid, not absolute positioning. Figma auto-layout direction,
  gap, and padding translate directly to CSS flex properties.
- Prefer the spacing and radius already used by Lumen components; do not override component
  internals to chase pixel values from Figma.
- Fixed frame sizes in Figma are design-canvas artifacts. Implement responsive behavior unless the
  design explicitly specifies fixed dimensions.
- Text styles map to the `Typography` component or existing docs-app text patterns.

### Interaction states

Figma usually shows only the default state. Lumen components already implement hover, focus,
active, and disabled states; do not recreate them from Figma-exported CSS. If the design includes
explicit state variants, use them only to verify token choices.

## Agent Checklist

- [ ] Pulled `get_design_context` (and `get_screenshot`) for the target node.
- [ ] Every UI element matched against `lumenComponentNames` before writing custom markup.
- [ ] Zero hard-coded colors; all colors map to semantic tokens.
- [ ] Layout uses flex/grid, no absolute positioning from Figma coordinates.
- [ ] No re-implemented hover/focus/disabled styles for Lumen components.
- [ ] Result visually compared against the Figma screenshot.
