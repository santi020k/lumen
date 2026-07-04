# AI Usage Guide

Use this guide when an AI agent is building an app with Lumen or updating examples that teach
another agent how to use the library.

## Pick the Right Package

Start with Astro unless the user explicitly asks for another framework.

| App Target | Install | Import Components From | Load Styles From |
| --- | --- | --- | --- |
| Astro | `@santi020k/lumen-astro` | `@santi020k/lumen-astro` | `@santi020k/lumen-astro/styles.css` |
| React | `@santi020k/lumen-react @santi020k/lumen-astro` | `@santi020k/lumen-react` | `@santi020k/lumen-astro/styles.css` |
| Web Components | `@santi020k/lumen-elements @santi020k/lumen-astro` | `@santi020k/lumen-elements/define` | `@santi020k/lumen-astro/styles.css` |
| Package metadata | `@santi020k/lumen-core` | `@santi020k/lumen-core` | Not applicable |

`@santi020k/lumen` is the umbrella package map. Prefer the framework package for component imports.

## Minimal Setup

Import the stylesheet once in the app's global CSS, root layout, or app entry.

```css
@import "@santi020k/lumen-astro/styles.css";
```

If Tailwind is present, keep both imports in the same shared CSS entry.

```css
@import "tailwindcss";
@import "@santi020k/lumen-astro/styles.css";
```

Astro apps should mount `UIPrimitives` once in the root layout when using interactive primitives
such as dialogs, menus, popovers, tabs, carousels, command lists, toggles, or toasts.

```astro
---
import { UIPrimitives } from '@santi020k/lumen-astro'
---

<UIPrimitives />
```

## Astro Default

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

React components share the same visual classes and data attributes as Astro components, but the
Astro progressive-enhancement runtime is not a React behavior layer. For behavior-heavy primitives,
wire the expected React-side state and keyboard interactions in the application.

```tsx
import '@santi020k/lumen-astro/styles.css'
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

Register custom elements once, then use `lumen-*` tags in HTML.

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
`DropdownMenu`, `Empty`, `Field`, `HoverCard`, `Input`, `InputGroup`, `InputOTP`, `Item`, `Kbd`,
`Label`, `Marker`, `Menubar`, `Message`, `MessageScroller`, `NativeSelect`, `NavigationMenu`,
`NumberField`, `Pagination`, `Popover`, `Progress`, `RadioGroup`, `Resizable`, `RichTextEditor`,
`ScrollArea`, `Schedule`, `SearchField`, `Select`, `Separator`, `Sheet`, `Sidebar`, `Skeleton`,
`Slider`, `Sonner`, `Spinner`, `Switch`, `Table`, `Tabs`, `TagGroup`, `Textarea`, `ThemeBuilder`,
`TimeField`, `Toast`, `Toggle`, `ToggleGroup`, `Tooltip`, `Tree`, `TreeGrid`, `Typography`, and
`VirtualList`.

## Product Recipes

- Use `Schedule` with `Agenda`, `Calendar`, and `DatePicker` for booking, CRM, content calendar, and
  event planning screens. Mark slots with `data-ui-schedule-slot` and events with
  `data-ui-schedule-event`; the runtime emits `ui:schedule-change` when a draggable event is moved.
  Use `createScheduleSlots`, `moveScheduleEvent`, and `expandRecurringScheduleEvent` from
  `@santi020k/lumen-core` for reusable schedule state; use `getScheduleConflicts` and
  `canPlaceScheduleEvent` before committing drag/drop changes. Persist local schedule edits with
  `createScheduleStorageKey`, `saveScheduleEvents`, and `loadScheduleEvents` against any
  `localStorage`-compatible adapter. Use `resizeScheduleEvent` and `resizeScheduleEvents` for
  snap-to-grid resize handles.
- Use `DataTable`, `Tree`, `TreeGrid`, `VirtualList`, `Pagination`, and `Command` for dense data
  collection workflows. `Tree` and `TreeGrid` use roving keyboard focus, and `VirtualList` emits
  `ui:virtual-list-range` as the rendered range changes. Use `createDataViewState`,
  `serializeDataViewState`, `parseDataViewState`, `applyDataViewState`, and `getVirtualRange` for
  saved views, filtering, sorting, pagination, and virtualization math. Use
  `createDataViewStorageKey`, `saveDataViewState`, and `loadDataViewState` when saved views should
  survive navigation or reloads. Use `pinDataViewColumn`, `unpinDataViewColumn`,
  `toggleDataViewSelection`, `createDataViewSearchParams`, and `createDataViewServerRequest` when
  connecting dense views to router state or server-backed data.
- Use `ThemeBuilder`, `ColorPicker`, `Card`, `Button`, and `Input` to build token preview and export
  tools. Add `data-ui-theme-export` and `data-ui-theme-output` to copy the current CSS token block.
  Use `createThemePalette`, `exportThemeCss`, `parseThemeCss`, and `scoreThemeContrast` for theme
  import/export and accessibility checks. Use `suggestReadableInk`, `mergeThemeTokens`, and
  `tuneThemeContrast` when generated palettes need readable foreground repair.
- Use `RichTextEditor` with `ButtonGroup`, `ToggleGroup`, and `Textarea` for editor compositions.
  Controls with `data-ui-editor-command` dispatch browser editing commands and emit
  `ui:editor-command`. For Tiptap, ProseMirror, Lexical, or Markdown engines, keep the external
  editor package in the app and bridge toolbar buttons through the emitted command event instead of
  adding the editor engine to Lumen.
- Use `Autocomplete`, `SearchField`, `NumberField`, `TimeField`, `DateRangePicker`, `ColorPicker`,
  and `TagGroup` when forms need more than plain text inputs.

## Registry Helper

`@santi020k/lumen` exports typed recipe metadata from `@santi020k/lumen/registry`. The package also
ships a small `lumen` binary:

```bash
lumen list
lumen show scheduler
lumen add scheduler
lumen add scheduler --dry-run
lumen add scheduler --fail-on-conflict
lumen add scheduler --force
lumen add scheduler --merge
lumen list --registry ./registry/lumen.registry.json
lumen add custom-recipe --registry ./registry/custom.registry.json
lumen add private-recipe --registry https://example.com/lumen.registry.json --registry-token "$TOKEN"
lumen install
```

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
- Preserve semantic labels, keyboard paths, focus states, and native form attributes.

## When Editing This Repo

- Shared contracts belong in `packages/core`.
- Astro implementation and standalone CSS belong in `packages/astro`.
- React-specific primitives belong in `packages/react`.
- Web Component-specific primitives belong in `packages/elements`.
- Update the relevant package README when public usage changes.
- Add tests beside package code as `*.test.ts` when behavior, exported metadata, or component
  contracts change.
