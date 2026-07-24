# AI Usage Guide

Use this guide when an AI agent is building an app with Lumen or updating examples that teach
another agent how to use the library.

## Install the Lumen Agent Skill

Lumen ships a portable Agent Skill for AI coding tools that support the open `SKILL.md` format:

```bash
npx skills add santi020k/lumen --skill lumen-ui
```

The source lives in [`skills/lumen-ui`](../skills/lumen-ui). The skill provides the durable
framework-selection, component-composition, theming, accessibility, and verification workflow.
Use it by naming `$lumen-ui` in a prompt, or let a compatible agent trigger it from Lumen-specific
requests.

The skill and MCP server complement each other: the skill explains how to work, while
`@santi020k/lumen-mcp` supplies structured catalog search, framework-specific contracts, recipes,
source, tokens, resources, and rules.

## Pick the Right Package

Use the framework requested by the user. Every adapter shares the same Lumen foundation.

| App Target | Install | Import Components From | Load Styles From |
| --- | --- | --- | --- |
| Astro | `@santi020k/lumen-astro` | `@santi020k/lumen-astro` | `@santi020k/lumen-astro/styles.css` |
| React | `@santi020k/lumen-react` | `@santi020k/lumen-react` | `@santi020k/lumen-react/styles.css` |
| Web Components | `@santi020k/lumen-elements` | `@santi020k/lumen-elements/define` | `@santi020k/lumen-elements/styles.css` |
| Package metadata | `@santi020k/lumen-core` | `@santi020k/lumen-core` | Not applicable |

Each framework package includes the shared foundation. Install `@santi020k/lumen` separately only
when you need its framework-neutral CLI or registry metadata.

## MCP-Assisted Workflow

Connect `@santi020k/lumen-mcp` when the agent supports Model Context Protocol. The server returns
validated structured content as well as readable text, so agents can select components without
scraping documentation.

```bash
codex mcp add lumen -- npx -y @santi020k/lumen-mcp
```

For Codex project configuration:

```toml
[mcp_servers.lumen]
enabled = true
command = "npx"
args = ["-y", "@santi020k/lumen-mcp"]
```

Use this sequence:

1. Read `lumen://meta` and `lumen://diagnostics` to identify and verify the snapshot.
2. Read `lumen://rules`.
3. Search for the use case with `lumen_search`, passing the target `framework` when known.
4. Inspect the selected framework with `lumen_get_component` and `detail: "usage"`.
5. Follow its framework behavior setup and hook/controller contract.
6. Read related multi-component guidance with `lumen_get_recipe`.
7. Request `detail: "source"` only when the usage contract is insufficient.
8. Read `lumen://tokens` before introducing custom styling.
9. Retain `lumen://catalog-manifest` and use `lumen_diff_catalog` after upgrades to identify contracts that need refreshing.

Example framework-aware component request:

```json
{
  "name": "lumen_get_component",
  "arguments": {
    "name": "DateRangePicker",
    "framework": "react",
    "detail": "usage"
  }
}
```

Stable resources are available at `lumen://rules`, `lumen://tokens`, `lumen://components`,
`lumen://meta`, `lumen://catalog-manifest`, `lumen://diagnostics`,
`lumen://components/{name}`, and `lumen://recipes/{name}`. See
[`packages/mcp/README.md`](../packages/mcp/README.md) for Claude Desktop, Cursor, generic stdio,
local repository, and programmatic examples.

## Minimal Setup

Import the stylesheet once in the app's global CSS, root layout, or app entry.

```css
@import "@santi020k/lumen-react/styles.css";
```

If Tailwind is present, keep both imports in the same shared CSS entry.

```css
@import "@santi020k/lumen-react/layers.css";
@import "tailwindcss";
@import "@santi020k/lumen-react/styles.css";
```

Keep the layer prelude first. It places Tailwind base styles below Lumen components and Tailwind
utilities above them, so consumer spacing, display, radius, width, and responsive visibility
classes override Lumen defaults predictably.

Astro apps should mount `UIPrimitives` once in the root layout when using interactive primitives
such as dialogs, menus, popovers, tabs, carousels, command lists, toggles, validated forms, or
toasts. Do not place `UIPrimitives` in each component example or next to each primitive instance;
one root include enhances all matching `data-ui-*` markup on the page.

```astro
---
import { UIPrimitives } from '@santi020k/lumen-astro'
---

<UIPrimitives />
```

## Astro

Use direct named imports from `@santi020k/lumen-astro`.

```astro
---
import { Button, Card, Input, Label } from '@santi020k/lumen-astro'
---

<Card>
  <Label for="email">Email</Label>
  <Input id="email" type="email" placeholder="you@example.com" />
  <Button type="submit">Subscribe</Button>
</Card>
```

## React

React components share the same visual classes and data attributes as Astro components. For
behavior-heavy primitives, use the React behavior hooks from `@santi020k/lumen-react` (`useDialog`,
`usePopover`, `useDropdownMenu`, `useTabs`, `useSelect`, `useToast`, and `useTooltip`), which track
the Astro runtime's ARIA, keyboard, Escape, dismissal, and toast controller semantics.

The React package entry is a client boundary. In Next.js, it can be imported by a Server Component
without evaluating Lumen's contexts and hooks in the React server runtime; the rendered Lumen
subtree becomes a Client Component boundary. Vite and other client-rendered React applications use
the same entry without additional setup.
`Button`, `Link`, `ButtonLink`, and `Input` forward their DOM refs. `Button asChild` composes the
button contract onto one child element, while `Input visualSize` controls presentation without
shadowing the native numeric `size` attribute.

```tsx
import '@santi020k/lumen-react/styles.css'
import { Button, Card, Input, Label } from '@santi020k/lumen-react'

export function SubscribeForm() {
  return (
    <Card>
      <Label htmlFor="email">Email</Label>
      <Input id="email" type="email" placeholder="you@example.com" />
      <Button type="submit">Subscribe</Button>
    </Card>
  )
}
```

## Web Components

Register custom elements once, then use `lumen-*` tags in HTML. The elements adapter includes
interactive behavior parity for DataTable, Dialog, Popover, DropdownMenu, ContextMenu, Tabs,
Select, ThemeBuilder, Toast, Tooltip, forms, RichTextEditor, Schedule, and VirtualList: selection,
validation, rich text command, context menu, schedule drag/drop, theme, and range events, ARIA
state, roving/listbox keyboard paths, Escape/outside dismissal, focus return/trapping, native
select form participation, and the same toast controller events as the Astro runtime.

```html
<script type="module">
  import { defineLumenElements } from '@santi020k/lumen-elements/define'

  defineLumenElements()
</script>

<lumen-card>
  <label for="email">Email</label>
  <lumen-input id="email" type="email" placeholder="you@example.com"></lumen-input>
  <lumen-button type="submit">Subscribe</lumen-button>
</lumen-card>
```

## Component Selection

The shared catalog includes:

`Accordion`, `Alert`, `AlertDialog`, `Agenda`, `AspectRatio`, `Attachment`, `Autocomplete`,
`Avatar`, `Badge`, `Breadcrumb`, `Bubble`, `Button`, `ButtonGroup`, `Calendar`, `Card`,
`Carousel`, `Chart`, `Checkbox`, `Collapsible`, `Code`, `Combobox`, `Command`, `ColorPicker`,
`ContextMenu`, `DataTable`, `DatePicker`, `DateRangePicker`, `Dialog`, `Direction`, `Drawer`,
`DropdownMenu`, `Empty`, `Field`, `HoverCard`, `Icon`, `Input`, `InputGroup`, `InputOTP`, `Item`, `Kbd`,
`Label`, `Marker`, `Menubar`, `Message`, `MessageScroller`, `NativeSelect`, `NavigationMenu`,
`NumberField`, `Pagination`, `Popover`, `Progress`, `RadioGroup`, `Resizable`, `RichTextEditor`,
`ScrollArea`, `Schedule`, `SearchField`, `Select`, `Separator`, `Sheet`, `Sidebar`, `Skeleton`,
`Slider`, `Spinner`, `Switch`, `Table`, `Tabs`, `TagGroup`, `Textarea`, `ThemeBuilder`,
`TimeField`, `Toast`, `Toggle`, `ToggleGroup`, `Tooltip`, `Tree`, `TreeGrid`, `Typography`, and
`VirtualList`.

## Product Recipes

- Use `Icon name="search"` or any Lucide icon name for standard interface pictograms. Kebab-case
  names and Lucide aliases work. Pair decorative icons with `decorative`, and pass `label` only
  when the icon carries meaning on its own. Lucide does not include brand marks such as GitHub;
  render a project-owned SVG through the default `Icon` slot for brand and custom icons. Astro
  reports unknown named icons during development instead of failing silently.
- Use `Schedule` with `Agenda`, `Calendar`, and `DatePicker` for booking, CRM, content calendar, and
  event planning screens. Mark slots with `data-ui-schedule-slot` and events with
  `data-ui-schedule-event`; the runtime emits `ui:schedule-change` when a draggable event is moved.
  `Calendar` renders a hidden input plus selectable date grid; Astro `UIPrimitives` and registered
  Web Components wire month navigation and roving keyboard focus directly, while React apps can use
  the `Calendar` component or `useCalendar` for the same date selection contract.
  Astro `UIPrimitives` and registered Web Components bind schedule drag/drop directly; React apps
  can use `useSchedule` for `rootProps`, `getEventProps`, `getSlotProps`, and `ui:schedule-change`
  parity. Use `createScheduleSlots`, `moveScheduleEvent`, and `expandRecurringScheduleEvent` from
  `@santi020k/lumen-core` for reusable schedule state; use `getScheduleConflicts` and
  `canPlaceScheduleEvent` before committing drag/drop changes. Persist local schedule edits with
  `createScheduleStorageKey`, `saveScheduleEvents`, and `loadScheduleEvents` against any
  `localStorage`-compatible adapter. Use `resizeScheduleEvent` and `resizeScheduleEvents` for
  snap-to-grid resize handles.
- Use `DataTable`, `Tree`, `TreeGrid`, `VirtualList`, `Pagination`, and `Command` for dense data
  collection workflows. Astro and Elements wire selectable/sortable `DataTable` behavior and
  `VirtualList` range events; React emits the same data attributes for app-level adapters. `Tree`
  and `TreeGrid` use roving keyboard focus, and `VirtualList` emits `ui:virtual-list-range` as the
  rendered range changes. Use `createDataViewState`,
  `serializeDataViewState`, `parseDataViewState`, `applyDataViewState`, and `getVirtualRange` for
  saved views, filtering, sorting, pagination, and virtualization math. Use
  `createDataViewStorageKey`, `saveDataViewState`, and `loadDataViewState` when saved views should
  survive navigation or reloads. Use `pinDataViewColumn`, `unpinDataViewColumn`,
  `toggleDataViewSelection`, `createDataViewSearchParams`, and `createDataViewServerRequest` when
  connecting dense views to router state or server-backed data.
- Use `Resizable` for split-pane editors, dashboards, inspectors, and side-by-side review layouts.
  Astro `UIPrimitives` and registered Web Components generate separator handles and pane sizing
  directly; React apps can use the `Resizable` component or `useResizable` for pointer, keyboard,
  min/max, and double-click reset parity.
- Use `ThemeBuilder`, `ColorPicker`, `Card`, `Button`, and `Input` to build token preview and export
  tools. Add `data-ui-theme-brand-hue`, `data-ui-theme-accent-hue`, `data-ui-theme-scheme`,
  `data-ui-theme-mode`, manual color inputs such as `data-ui-theme-primary-hex`, and
  `data-ui-theme-target` for scoped live previews. Add `data-ui-theme-export-format`,
  `data-ui-theme-export`, and `data-ui-theme-output` to copy CSS, Figma variable JSON, or design
  token JSON. Astro `UIPrimitives` and registered Web Components wire those controls directly;
  React apps can use `useThemeBuilder` for the same tokens, exports, and control props. Use
  `createThemePalette`, `createThemeBuilderTokens`, `exportThemeBuilderValue`, `exportThemeCss`,
  `parseThemeCss`, and `scoreThemeContrast`
  for theme import/export and accessibility checks. Use `suggestReadableInk`, `mergeThemeTokens`,
  and `tuneThemeContrast` when generated palettes need readable foreground repair.
- Use `RichTextEditor` with `ButtonGroup`, `ToggleGroup`, and `Textarea` for editor compositions.
  Controls with `data-ui-editor-command` dispatch browser editing commands and emit
  `ui:editor-command`; use `data-ui-editor-value` for headings, links, and other value-bearing
  commands. Editable surfaces support common formatting shortcuts, synchronize toggle
  `aria-pressed` state, and emit `ui:editor-change` with HTML and plain text. Astro `UIPrimitives`
  and registered Web Components bind those controls directly; React apps can use
  `useRichTextEditor` for `rootProps`, `getCommandProps`, `getEditableProps`, and `executeCommand`.
  For Tiptap, ProseMirror, Lexical, or Markdown engines, keep the external editor
  package in the app and bridge toolbar buttons through the emitted command event instead of adding
  the editor engine to Lumen.
- Use `Autocomplete`, `SearchField`, `NumberField`, `TimeField`, `DateRangePicker`, `ColorPicker`,
  and `TagGroup` when forms need more than plain text inputs. Add `data-ui-form` to forms that
  should reflect native Constraint Validation API state into `Field` error slots on blur and submit.
  For `InputOTP`, Astro `UIPrimitives` and registered Web Components render/sync a real native input
  with visual OTP segments; React apps can use the `InputOTP` component or `useInputOTP` for the
  same sanitization, paste handling, and caret navigation.
  For `DateRangePicker`, Astro `UIPrimitives` and registered Web Components sync the paired native
  date input `min`/`max` constraints directly; React apps can use `useDateRangePicker` for the same
  start/end syncing props.
  Use native attributes such as `required`, `pattern`, `min`, `max`, and `type`; add
  `data-error-required`, `data-error-pattern`, `data-error-min`, `data-error-max`, or
  `data-error-custom` when a control needs custom copy. Listen for `ui:validate` to call
  `control.setCustomValidity(message)` before the runtime reads validity, and listen for
  `ui:invalid` or `ui:valid` on the form for submission state. Astro `UIPrimitives` and registered
  Web Components bind `data-ui-form` directly; React apps can use `useFormValidation` with `Field`
  to get the same control props, CustomEvents, and error slot updates.
- Use `Toast` for transient feedback. Static `<Toast>` markup works without
  JavaScript. With Astro `UIPrimitives` or registered Web Components, create toasts with
  `window.LumenToast.create(detail)`, `LumenToast.create(detail)` from `@santi020k/lumen-elements`,
  or `document.dispatchEvent(new CustomEvent('ui:toast', { detail }))`; update them with
  `.update(id, detail)` or `ui:toast-update`; and dismiss them with `.dismiss(id?)` or
  `ui:toast-dismiss`. `detail` supports `title`, `description`, `variant`, `duration`, `placement`,
  `max`, and `action: { label, value }`. Destructive toasts use `role="alert"`; other variants use
  `role="status"`. Runtime toasts pause their timeout on hover or focus, and Escape dismisses the
  focused toast.

## Runtime CustomEvents

When `UIPrimitives` is mounted, or when Web Components are registered for matching behavior, Lumen
uses these CustomEvents:

| Event | Target | Detail | Fires When |
| --- | --- | --- | --- |
| `ui:data-table-selection-change` | `DataTable` root `[data-ui-datatable]` | `{ values: string[] }` | Selectable row checkboxes, the select-all checkbox, or form reset changes selected row values. |
| `ui:schedule-change` | `Schedule` root `[data-ui-schedule]` | `{ eventId?: string, slot?: string }` | A draggable schedule event is dropped on a `[data-ui-schedule-slot]`. |
| `ui:virtual-list-range` | `VirtualList` root `[data-ui-virtual-list]` | `{ startIndex: number, endIndex: number }` | The virtual list calculates its visible range on init or scroll. |
| `ui:tag-remove` | `TagGroup` root `.ui-tag-group` or `[data-ui-tag-group]` | `{ value?: string }` | A `[data-ui-tag-remove]` control removes its closest tag or list item. |
| `ui:editor-command` | `RichTextEditor` root `[data-ui-rich-text-editor]` | `{ command: string, executed: boolean, value?: string }` | A toolbar control or keyboard shortcut runs an editor command. |
| `ui:editor-change` | `RichTextEditor` root `[data-ui-rich-text-editor]` | `{ html: string, text: string }` | Editable content changes or an editor command runs. |
| `ui:theme-change` | `ThemeBuilder` root `[data-ui-theme-builder]` | `{ hue: number, accentHue: number, mode: 'generated' \| 'manual', scheme: 'dark' \| 'light', tokens: Record<string, string> }` | Hue, manual color, mode, or scheme controls update generated tokens. |
| `ui:theme-export` | `ThemeBuilder` root `[data-ui-theme-builder]` | `{ css?: string, format: 'css' \| 'figma' \| 'tokens', tokens: Record<string, string> \| null, value: string }` | A `[data-ui-theme-export]` control writes the selected export to the output and clipboard when available. |
| `ui:validate` | Form `[data-ui-form]` | `{ control, form, value }` | Before validation state is read, so custom code can call `control.setCustomValidity(message)`. |
| `ui:invalid` | Form `[data-ui-form]` | `{ control?, controls?, form }` | Blur or submit validation finds invalid controls. Failed submits focus the first invalid control. |
| `ui:valid` | Form `[data-ui-form]` | `{ control?, controls?, form }` | Blur or submit validation finds the checked control or form valid. |
| `ui:toast` | `document` | `{ id?, title?, description?, variant?, duration?, placement?, action? }` | Creates a runtime toast in the matching notification viewport. |
| `ui:toast-update` | `document` | `{ id, title?, description?, variant?, duration? }` | Updates a runtime toast. |
| `ui:toast-dismiss` | `document` | `{ id? }` | Dismisses one runtime toast, or all runtime toasts when `id` is omitted. |
| `ui:toast-action` | Toast `[data-ui-toast]` | `{ id, value? }` | A runtime toast action button is pressed, unless the action specifies a custom event name. |

## Registry Helper

`@santi020k/lumen` exports typed component, recipe, and documentation metadata from
`@santi020k/lumen/registry`. The package also ships a small `lumen` binary. Individual components
are addressable by name, including kebab-case aliases such as `data-table`:

```bash
lumen list
lumen show Button
lumen show data-table
lumen add Button
lumen add Button --target react
lumen add Button --target elements
lumen add data-table
lumen show scheduler
lumen add scheduler
lumen add scheduler --target react
lumen add scheduler --target elements
lumen add scheduler --dry-run
lumen add scheduler --fail-on-conflict
lumen add scheduler --force
lumen add scheduler --merge
lumen list --registry ./registry/lumen.registry.json
lumen add custom-recipe --registry ./registry/custom.registry.json
lumen add private-recipe --registry https://example.com/lumen.registry.json --registry-token "$TOKEN"
lumen install
```

`lumen add <component>` defaults to an Astro wrapper. Use `--target react` for a local React wrapper
or `--target elements` for a custom-elements starter. Bundled recipes also accept `--target astro`,
`--target react`, and `--target elements`; external registry inline files keep their authored paths
and sources.

Before inventing a wrapper or custom class pattern, check the component source in
`packages/astro/components`. Astro is the reference implementation for props, class names, data
attributes, and accessible markup.

## Styling Rules for Generated Code

- Do not require consumers to configure Tailwind for Lumen components.
- Prefer component props and composition before adding custom CSS.
- Use the shared token names for custom surfaces: `canvas`, `surface`, `surface-muted`,
  `surface-strong`, `line`, `ink`, `ink-soft`, `ink-muted`, `brand`, `brand-solid`, `brand-soft`,
  `accent`, `success`, `warning`, and `danger`.
- Use `glass` as a boolean prop or attribute for glass surfaces when supported.
- Do not generate `surface="glass"` for overlays; it is a deprecated alias that maps to `glass`.
- Preserve semantic labels, keyboard paths, focus states, and native form attributes.

## Figma Handoff

Use `exportThemeFigmaVariables` from `@santi020k/lumen-core/figma` when a design workflow needs
Figma variable-friendly color values, and `exportThemeDesignTokens` when exporting standard design
token JSON for token importers. See [docs/figma.md](figma.md) for the recommended Figma workflow.

## When Editing This Repo

- Shared contracts belong in `packages/core`.
- Astro implementation and standalone CSS belong in `packages/astro`.
- React-specific primitives belong in `packages/react`.
- Web Component-specific primitives belong in `packages/elements`.
- Update the relevant package README when public usage changes.
- Add tests beside package code as `*.test.ts` when behavior, exported metadata, or component
  contracts change.
