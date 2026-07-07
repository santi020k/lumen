export interface ComponentDoc {
  apiReference: ComponentApiRow[]
  name: string
  category: 'Actions' | 'Data display' | 'Feedback' | 'Forms' | 'Layout' | 'Navigation' | 'Overlays'
  glass?: boolean
  keyboardInteractions?: KeyboardInteractionRow[]
  runtimeEvents?: RuntimeEventRow[]
  summary: string
  example: string
}

interface ComponentApiRow {
  attribute: string
  defaultValue: string
  description: string
  values: string
}

export interface KeyboardInteractionRow {
  action: string
  key: string
}

export interface RuntimeEventRow {
  detail: string
  name: string
  target: string
  when: string
}

type ComponentDocTuple = readonly [
  name: string,
  category: ComponentDoc['category'],
  summary: string,
  example: string
]

interface InstallCommand {
  command: string
  label: 'npm' | 'pnpm' | 'yarn'
}

export interface FrameworkSetup {
  id: 'astro' | 'elements' | 'react'
  installCommands: InstallCommand[]
  label: string
  lang: 'astro' | 'html' | 'tsx'
  note: string
  packageName: string
  usage: string
}

export interface GlobalStyleSetup {
  code: string
  description: string
  label: string
  lang: 'astro' | 'css' | 'ts'
}

export interface GlassSurfaceExample {
  code: string
  description: string
  label: string
  lang: 'astro' | 'html' | 'tsx'
}

export interface ThemeSetup {
  code: string
  description: string
  label: string
  lang: 'css' | 'html' | 'ts'
}

const packageManagerCommands = [
  ['pnpm', 'pnpm add'],
  ['npm', 'npm install'],
  ['yarn', 'yarn add']
] as const

const buildInstallCommands = (...packages: string[]): InstallCommand[] =>
  packageManagerCommands.map(([label, command]) => ({
    command: `${command} ${packages.join(' ')}`,
    label
  }))

const installCommands = buildInstallCommands('@santi020k/lumen-astro')

const astroUsage = `---
import { Button, Card, Input } from '@santi020k/lumen-astro'
---

<Card>
  <label for="email">Email</label>
  <Input id="email" type="email" placeholder="you@example.com" />
  <Button>Subscribe</Button>
</Card>`

const reactUsage = `import { Button, Card, Input } from '@santi020k/lumen-react'

export function SubscribeForm() {
  return (
    <Card>
      <label htmlFor="email">Email</label>
      <Input id="email" type="email" placeholder="you@example.com" />
      <Button>Subscribe</Button>
    </Card>
  )
}`

const elementsUsage = `<script type="module">
  import { defineLumenElements } from '@santi020k/lumen-elements/define'

  defineLumenElements()
</script>

<lumen-card>
  <label for="email">Email</label>
  <lumen-input id="email" type="email" placeholder="you@example.com"></lumen-input>
  <lumen-button>Subscribe</lumen-button>
</lumen-card>`

export const globalStyleSetups: GlobalStyleSetup[] = [
  {
    code: `@import "tailwindcss";
@import "@santi020k/lumen-astro/styles.css";`,
    description: 'Use this in your main Tailwind CSS entry, such as src/styles/global.css or app.css.',
    label: 'Tailwind CSS',
    lang: 'css'
  },
  {
    code: `---
import '@santi020k/lumen-astro/styles.css'
---

<html lang="en">
  <body>
    <slot />
  </body>
</html>`,
    description: 'Use this in an Astro root layout when you do not already have a shared CSS entry.',
    label: 'Astro layout',
    lang: 'astro'
  },
  {
    code: `import '@santi020k/lumen-astro/styles.css'

import { createRoot } from 'react-dom/client'

import { App } from './App'`,
    description: 'Use this in a bundled app entry, such as main.tsx, main.ts, or client.ts.',
    label: 'App entry',
    lang: 'ts'
  }
]

export const themeSetups: ThemeSetup[] = [
  {
    code: `<html data-theme="light">
  <body>...</body>
</html>

<html data-theme="dark">
  <body>...</body>
</html>`,
    description: 'Omit data-theme or set data-theme="light" for the default light theme; set data-theme="dark" for the built-in dark theme.',
    label: 'Default themes',
    lang: 'html'
  },
  {
    code: `const nextTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
  ? 'dark'
  : 'light'

document.documentElement.dataset.theme = nextTheme`,
    description: 'Switch themes by updating document.documentElement.dataset.theme; components read the CSS variables from the root element.',
    label: 'Runtime switch',
    lang: 'ts'
  },
  {
    code: `@import "@santi020k/lumen-astro/styles.css";

:root[data-theme="santi020k-light"] {
  color-scheme: light;
  --canvas: 268 20% 98%;
  --surface: 268 20% 100%;
  --ink: 268 10% 20%;
  --brand: 264 92% 47%;
  --accent: 264 95% 57%;
  /* ...override the remaining tokens */
}

:root[data-theme="santi020k-dark"] {
  color-scheme: dark;
  --canvas: 260 43% 8%;
  --surface: 260 30% 12%;
  --ink: 260 10% 88%;
  --brand: 264 90% 58%;
  --accent: 264 90% 68%;
  /* ...override the remaining tokens */
}`,
    description: 'These docs run santi020k-light and santi020k-dark, a custom theme family built on the same token contract. Copy the shape and adapt the values to your brand.',
    label: 'Custom theme',
    lang: 'css'
  }
]

export const glassSurfaceExamples: GlassSurfaceExample[] = [
  {
    code: `<Card glass>
  <h2>Launch window</h2>
  <p>Shared glass tokens.</p>
</Card>`,
    description: 'Use the glass prop for standalone content surfaces.',
    label: 'Astro card',
    lang: 'astro'
  },
  {
    code: `<Popover glass>
  <Button data-ui-trigger>
    Invite
  </Button>
  <div>
    <Input type="email" />
  </div>
</Popover>`,
    description: 'Use the same glass prop for overlays without changing their semantics.',
    label: 'Overlay surface',
    lang: 'astro'
  },
  {
    code: `<lumen-card glass>
  <h2>Production</h2>
  <p>Same class contract.</p>
</lumen-card>`,
    description: 'Elements support glass with a boolean attribute.',
    label: 'Elements',
    lang: 'html'
  }
]

export const glassComponentNames = [
  'Alert',
  'AlertDialog',
  'Agenda',
  'Attachment',
  'Bubble',
  'Calendar',
  'Card',
  'Carousel',
  'Chart',
  'Command',
  'ContextMenu',
  'DataTable',
  'Dialog',
  'Drawer',
  'DropdownMenu',
  'Empty',
  'Field',
  'HoverCard',
  'Item',
  'Menubar',
  'MessageScroller',
  'NavigationMenu',
  'Popover',
  'RichTextEditor',
  'ScrollArea',
  'Schedule',
  'Sheet',
  'Sidebar',
  'Table',
  'Tabs',
  'ThemeBuilder',
  'Toast',
  'Tree',
  'TreeGrid',
  'VirtualList'
] as const

const glassComponentNameSet = new Set<string>(glassComponentNames)

const glassApiComponentNameSet = new Set<string>([
  ...glassComponentNames,
  'Select'
])

export const frameworkSetups: FrameworkSetup[] = [
  {
    id: 'astro',
    installCommands,
    label: 'Astro',
    lang: 'astro',
    note: 'With the stylesheet loaded globally, import components where you use them. Mount UIPrimitives once in your root layout only if you use interactive primitives; do not add it beside every component.',
    packageName: '@santi020k/lumen-astro',
    usage: astroUsage
  },
  {
    id: 'react',
    installCommands: buildInstallCommands('@santi020k/lumen-react', '@santi020k/lumen-astro'),
    label: 'React',
    lang: 'tsx',
    note: 'Install the adapter alongside the shared stylesheet package, then import primitives directly. React ships the same styled markup and data contract, including data-display, overlay, form, rich text, and schedule attributes; use hooks for behavior-heavy primitives.',
    packageName: '@santi020k/lumen-react',
    usage: reactUsage
  },
  {
    id: 'elements',
    installCommands: buildInstallCommands('@santi020k/lumen-elements', '@santi020k/lumen-astro'),
    label: 'Elements',
    lang: 'html',
    note: 'Install the adapter alongside the shared stylesheet package, register Lumen elements once, and use lumen-* tags anywhere HTML is valid. Behavior-backed elements include overlays, context menus, select, forms, rich text, schedule, toast, DataTable, ThemeBuilder, and VirtualList.',
    packageName: '@santi020k/lumen-elements',
    usage: elementsUsage
  }
]

export const frameworkPackages = [
  ['Astro', '@santi020k/lumen-astro', 'Complete', 'Full component catalog, shared CSS, and the UIPrimitives runtime.'],
  ['React', '@santi020k/lumen-react', 'Adapter', 'React components for the full primitive catalog using the shared class and data contract.'],
  ['Elements', '@santi020k/lumen-elements', 'Adapter', 'Standards-based custom elements for the full primitive catalog using the shared class and data contract.'],
  ['Core', '@santi020k/lumen-core', 'Shared', 'Design tokens, component metadata, and small adapter utilities.']
] as const

export const frameworkGuides = [
  {
    body: [
      'Reference implementation for markup, props, standalone CSS, and progressive enhancement.',
      'Mount UIPrimitives once in the root layout for interactive primitives and CustomEvents.',
      'Use lumen add Component or lumen add recipe-name --target astro when you want local .astro starter files.'
    ],
    code: `---
import { Button, Card, UIPrimitives } from '@santi020k/lumen-astro'
import '@santi020k/lumen-astro/styles.css'
---

<UIPrimitives />
<Card><Button>Save</Button></Card>`,
    id: 'astro',
    lang: 'astro',
    packageName: '@santi020k/lumen-astro',
    title: 'Astro'
  },
  {
    body: [
      'React components mirror the same ui-* classes, data attributes, and prop names where React naming allows it.',
      'DataTable renders the same structured row contract and VirtualList emits the shared sizing attributes for app-level adapters.',
      'Use React hooks such as useDialog, usePopover, useDropdownMenu, useContextMenu, useTabs, useSelect, useFormValidation, useCalendar, useInputOTP, useDateRangePicker, useRichTextEditor, useSchedule, useResizable, useThemeBuilder, useToast, and useTooltip for behavior-heavy primitives.',
      'Use lumen add Component --target react or lumen add recipe-name --target react when you want local .tsx starter files.'
    ],
    code: `import '@santi020k/lumen-astro/styles.css'
import { Button, Card, useDialog } from '@santi020k/lumen-react'

export function Actions() {
  const dialog = useDialog()

  return <Card><Button {...dialog.triggerProps}>Open</Button></Card>
}`,
    id: 'react',
    lang: 'tsx',
    packageName: '@santi020k/lumen-react',
    title: 'React'
  },
  {
    body: [
      'Custom elements expose the shared class and data contract through lumen-* tags that work in plain HTML or any framework.',
      'Call defineLumenElements once before using the tags; behavior-backed elements include DataTable selection/sort, form validation, calendar grids, OTP segmentation, date range syncing, rich text commands, context menu triggers, schedule drag/drop, resizable pane sizing, ThemeBuilder export, VirtualList range events, overlays, select, tabs, tooltip, and toast.',
      'Use lumen add Component --target elements or lumen add recipe-name --target elements when you want local Elements starter files.'
    ],
    code: `<script type="module">
  import { defineLumenElements } from '@santi020k/lumen-elements/define'
  import '@santi020k/lumen-astro/styles.css'

  defineLumenElements()
</script>

<lumen-card><lumen-button>Save</lumen-button></lumen-card>`,
    id: 'elements',
    lang: 'html',
    packageName: '@santi020k/lumen-elements',
    title: 'Elements'
  }
] as const

export const runtimeFeatures = [
  ['Dialogs and sheets', 'Trigger, dismiss, escape-key, and focus behavior for modal surfaces.'],
  ['Menus and popovers', 'Lightweight disclosure patterns for contextual actions and floating content.'],
  ['Tabs and command lists', 'Progressively enhanced keyboard navigation and client-side filtering.'],
  ['Toasts and carousel controls', 'Document-level behavior for transient feedback and slide navigation.']
] as const

const apiRow = (
  attribute: string,
  values: string,
  defaultValue: string,
  description: string
): ComponentApiRow => ({
  attribute,
  defaultValue,
  description,
  values
})

const commonApiRows = [
  apiRow('class, className', 'string', '""', 'Merges custom classes with the generated ui-* root classes.'),
  apiRow('...native attributes', 'HTML attributes', '-', 'Forwards standard attributes to the root element unless the component consumes them.')
] as const

const surfaceApiRow = apiRow(
  'surface',
  '"default" | "glass"',
  '"default"',
  'Deprecated alias for glass; surface="glass" maps to glass={true}.'
)

const glassApiRow = apiRow(
  'glass',
  'boolean | "subtle" | "strong"',
  'false',
  'Applies the tokenized liquid-glass surface treatment with backdrop-filter fallbacks; "subtle" and "strong" adjust the fill intensity.'
)

const disclosureTriggerApiRow = apiRow(
  'data-ui-trigger',
  'boolean attribute',
  '-',
  'Marks the child trigger that opens and closes the adjacent disclosure panel.'
)

const dialogTriggerApiRows = (name: string) => [
  apiRow('id', 'string', '-', 'Connects the dialog surface to a matching trigger attribute value.'),
  apiRow(`data-ui-${name}-trigger`, 'target id', '-', 'Marks an external trigger and points it at the dialog id.'),
  apiRow(`data-ui-${name}-close`, 'boolean attribute', '-', 'Marks a child control that closes the nearest dialog.')
] as const

const keyboardRows = (...rows: [key: string, action: string][]): KeyboardInteractionRow[] =>
  rows.map(([key, action]) => ({ action, key }))

const disclosureKeyboardInteractions = keyboardRows(
  ['ArrowDown, Enter, Space on trigger', 'Open the panel and move focus to the first focusable item.'],
  ['Escape in panel', 'Close the panel and return focus to the trigger.'],
  ['ArrowDown, ArrowUp in panel', 'Move focus through focusable panel items, wrapping at the ends.'],
  ['Home, End in panel', 'Move focus to the first or last focusable panel item.']
)

const rovingGroupKeyboardInteractions = keyboardRows(
  ['ArrowRight, ArrowDown', 'Move roving focus to the next item, wrapping at the end.'],
  ['ArrowLeft, ArrowUp', 'Move roving focus to the previous item, wrapping at the start.'],
  ['Home, End', 'Move roving focus to the first or last item.']
)

const keyboardInteractionsByComponent: Partial<Record<string, readonly KeyboardInteractionRow[]>> = {
  Calendar: keyboardRows(
    ['Enter, Space on a day', 'Select the focused day, update the hidden input, and dispatch native input and change events from that input.'],
    ['ArrowRight, ArrowLeft', 'Move day focus by one day.'],
    ['ArrowDown, ArrowUp', 'Move day focus by one week.'],
    ['Home, End', 'Move focus to the first or last day in the current week row.'],
    ['PageDown, PageUp', 'Move focus to the same date in the next or previous month.']
  ),
  Combobox: keyboardRows(
    ['Escape in input or option', 'Close the listbox. Escape on an option also returns focus to the input.'],
    ['ArrowDown, ArrowUp in input', 'Open the listbox and move focus to the first or last visible option.'],
    ['Enter in input', 'Select the first visible option.'],
    ['Enter, Space on an option', 'Select the focused option.'],
    ['ArrowDown, ArrowUp on an option', 'Move focus through visible options, wrapping at the ends.'],
    ['Home, End on an option', 'Move focus to the first or last visible option.']
  ),
  ContextMenu: keyboardRows(
    ['ContextMenu, Shift+F10 on trigger', 'Open the linked menu near the trigger and focus the first focusable menu item.'],
    ['Escape in menu', 'Close the menu and return focus to the trigger.'],
    ['ArrowDown, ArrowUp in menu', 'Move focus through focusable menu items, wrapping at the ends.'],
    ['Home, End in menu', 'Move focus to the first or last focusable menu item.']
  ),
  DropdownMenu: disclosureKeyboardInteractions,
  InputOTP: keyboardRows(
    ['ArrowLeft, ArrowRight', 'Move the native input selection one position left or right and sync the visible segments.'],
    ['Home, End', 'Move the native input selection to the start or end of the current value and sync the visible segments.']
  ),
  Menubar: rovingGroupKeyboardInteractions,
  NavigationMenu: rovingGroupKeyboardInteractions,
  RadioGroup: rovingGroupKeyboardInteractions,
  Resizable: keyboardRows(
    ['ArrowLeft, ArrowRight on a horizontal handle', 'Resize the leading panel by 2 percentage points, or 10 with Shift held.'],
    ['ArrowUp, ArrowDown on a vertical handle', 'Resize the leading panel by 2 percentage points, or 10 with Shift held.'],
    ['Home, End on a handle', 'Resize the leading panel to its configured minimum or maximum size.']
  ),
  Select: keyboardRows(
    ['Printable key on trigger or option', 'Open the listbox and focus the next enabled option whose text starts with the typed buffer.'],
    ['Escape on trigger or option', 'Close the listbox. Escape on an option also returns focus to the trigger.'],
    ['ArrowDown, ArrowUp on trigger', 'Open the listbox and focus the next or previous enabled option.'],
    ['Home, End on trigger', 'Open the listbox and focus the first or last enabled option.'],
    ['Enter, Space on trigger', 'Open the listbox and focus the selected option, or the first enabled option.'],
    ['Enter, Space on an option', 'Select the focused option, sync the native select, and dispatch native input and change events from the select.'],
    ['ArrowDown, ArrowUp on an option', 'Move focus through enabled options, wrapping at the ends.'],
    ['Home, End on an option', 'Move focus to the first or last enabled option.']
  ),
  Tabs: keyboardRows(
    ['ArrowRight', 'Activate and focus the next tab, wrapping at the end.'],
    ['ArrowLeft', 'Activate and focus the previous tab, wrapping at the start.'],
    ['Home, End', 'Activate and focus the first or last tab.']
  ),
  Toast: keyboardRows(
    ['Escape in a toast', 'Dismiss the focused toast.']
  ),
  ToggleGroup: rovingGroupKeyboardInteractions
}

export const runtimeEvents: RuntimeEventRow[] = [
  {
    detail: '{ values: string[] }',
    name: 'ui-datatable-selectionchange',
    target: 'DataTable root ([data-ui-datatable])',
    when: 'Fires after a selectable DataTable row checkbox, select-all checkbox, or form reset changes the selected row values.'
  },
  {
    detail: '{ eventId: string | undefined, slot: string | undefined }',
    name: 'ui:schedule-change',
    target: 'Schedule root ([data-ui-schedule])',
    when: 'Fires after a draggable schedule event is dropped on a [data-ui-schedule-slot] drop zone.'
  },
  {
    detail: '{ startIndex: number, endIndex: number }',
    name: 'ui:virtual-list-range',
    target: 'VirtualList root ([data-ui-virtual-list])',
    when: 'Fires when the virtual list calculates its visible range on initialization or scroll.'
  },
  {
    detail: '{ value: string | undefined }',
    name: 'ui:tag-remove',
    target: 'TagGroup root (.ui-tag-group or [data-ui-tag-group])',
    when: 'Fires after a [data-ui-tag-remove] control removes its closest tag or list item.'
  },
  {
    detail: '{ command: string }',
    name: 'ui:editor-command',
    target: 'RichTextEditor root ([data-ui-rich-text-editor])',
    when: 'Fires after a [data-ui-editor-command] control runs document.execCommand(command).'
  },
  {
    detail: "{ hue: number, accentHue: number, mode: 'generated' | 'manual', scheme: 'dark' | 'light', tokens: Record<string, string> }",
    name: 'ui:theme-change',
    target: 'ThemeBuilder root ([data-ui-theme-builder])',
    when: 'Fires after ThemeBuilder hue, manual color, mode, or scheme controls update theme tokens on the target element.'
  },
  {
    detail: "{ css?: string, format: 'css' | 'figma' | 'tokens', tokens: Record<string, string> | null, value: string }",
    name: 'ui:theme-export',
    target: 'ThemeBuilder root ([data-ui-theme-builder])',
    when: 'Fires after a [data-ui-theme-export] control writes the selected CSS, Figma, or design-token export to the output and clipboard when available.'
  },
  {
    detail: '{ control: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement, form: HTMLFormElement, value: string }',
    name: 'ui:validate',
    target: 'Form ([data-ui-form])',
    when: 'Fires before the runtime reads native validity so custom validators can call control.setCustomValidity(message).'
  },
  {
    detail: '{ control?: HTMLElement, controls?: HTMLElement[], form: HTMLFormElement }',
    name: 'ui:invalid',
    target: 'Form ([data-ui-form])',
    when: 'Fires after blur or submit validation finds one or more invalid controls.'
  },
  {
    detail: '{ control?: HTMLElement, controls?: HTMLElement[], form: HTMLFormElement }',
    name: 'ui:valid',
    target: 'Form ([data-ui-form])',
    when: 'Fires after blur or submit validation finds the checked control or form valid.'
  },
  {
    detail: '{ id?: string, title?: string, description?: string, variant?: string, duration?: number, placement?: string, action?: { label: string } }',
    name: 'ui:toast',
    target: 'Document',
    when: 'Creates a programmatic toast in the matching Sonner viewport.'
  },
  {
    detail: '{ id: string, title?: string, description?: string, variant?: string, duration?: number }',
    name: 'ui:toast-update',
    target: 'Document',
    when: 'Updates a programmatic toast created by ui:toast or window.LumenToast.create(detail).'
  },
  {
    detail: '{ id?: string }',
    name: 'ui:toast-dismiss',
    target: 'Document',
    when: 'Dismisses one programmatic toast by id, or all runtime toasts when id is omitted.'
  },
  {
    detail: '{ id: string, value?: unknown }',
    name: 'ui:toast-action',
    target: 'Toast ([data-ui-toast])',
    when: 'Fires after a programmatic toast action button is pressed unless the action specifies a custom event name.'
  }
]

const runtimeEventsByComponent: Partial<Record<string, readonly RuntimeEventRow[]>> = {
  DataTable: runtimeEvents.filter(event => event.name === 'ui-datatable-selectionchange'),
  Field: runtimeEvents.filter(event => event.name === 'ui:validate' || event.name === 'ui:invalid' || event.name === 'ui:valid'),
  RichTextEditor: runtimeEvents.filter(event => event.name === 'ui:editor-command'),
  Schedule: runtimeEvents.filter(event => event.name === 'ui:schedule-change'),
  Sonner: runtimeEvents.filter(event => event.name === 'ui:toast' || event.name === 'ui:toast-update' || event.name === 'ui:toast-dismiss'),
  TagGroup: runtimeEvents.filter(event => event.name === 'ui:tag-remove'),
  ThemeBuilder: runtimeEvents.filter(event => event.name === 'ui:theme-change' || event.name === 'ui:theme-export'),
  Toast: runtimeEvents.filter(event => event.name === 'ui:toast' || event.name === 'ui:toast-update' || event.name === 'ui:toast-dismiss' || event.name === 'ui:toast-action'),
  VirtualList: runtimeEvents.filter(event => event.name === 'ui:virtual-list-range')
}

const apiReferenceByComponent: Partial<Record<string, readonly ComponentApiRow[]>> = {
  Alert: [
    apiRow('variant', '"default" | "destructive" | "success" | "warning"', '"default"', 'Controls the alert tone.')
  ],
  AlertDialog: [
    surfaceApiRow,
    ...dialogTriggerApiRows('alert-dialog')
  ],
  AspectRatio: [
    apiRow('ratio', 'number | string', '"16 / 9"', 'Sets the preferred CSS aspect-ratio value; invalid values fall back to 16 / 9.')
  ],
  Attachment: [
    apiRow('href', 'string', '-', 'Renders the root as a link when provided; otherwise renders an article.')
  ],
  Autocomplete: [
    apiRow('list', 'string', 'required', 'Connects the search input to a datalist id.'),
    apiRow('type', 'HTML input type', '"search"', 'Sets the native input type.')
  ],
  Avatar: [
    apiRow('src', 'string', '-', 'Shows an image when present.'),
    apiRow('alt', 'string', '""', 'Accessible text for the image.'),
    apiRow('fallback', 'string', '-', 'Fallback text shown when no image source is provided.')
  ],
  Badge: [
    apiRow('variant', '"default" | "secondary" | "outline" | "destructive" | "success" | "warning"', '"default"', 'Controls the badge tone.')
  ],
  Bubble: [
    apiRow('from', '"assistant" | "user"', '"assistant"', 'Aligns and styles the bubble for the message author.')
  ],
  Breadcrumb: [
    apiRow('children', '<ol><li>...</li></ol>', 'required', 'Use an ordered list inside the nav and set aria-current="page" on the final item.')
  ],
  Button: [
    apiRow('variant', '"default" | "secondary" | "outline" | "ghost" | "link" | "destructive"', '"default"', 'Controls the button emphasis.'),
    apiRow('size', '"default" | "sm" | "lg" | "icon"', '"default"', 'Controls button height, padding, and icon-only sizing.'),
    apiRow('loading', 'boolean', 'false', 'Shows a spinner, sets aria-busy, and blocks pointer interaction while pending.'),
    apiRow('type', '"button" | "submit" | "reset"', '"button"', 'Sets the native button type.')
  ],
  Card: [
    apiRow('as', '"div" | "article" | "section"', '"div"', 'Changes the rendered HTML element.'),
    apiRow('variant', '"default" | "muted" | "interactive" | "glass"', '"default"', 'Controls the card surface and affordance; variant="glass" is kept as a compatibility alias.')
  ],
  Calendar: [
    apiRow('disabled', 'boolean', 'false', 'Disables month navigation, date selection, and the hidden form input.'),
    apiRow('max', 'YYYY-MM-DD string', '-', 'Disables dates after the inclusive maximum date.'),
    apiRow('min', 'YYYY-MM-DD string', '-', 'Disables dates before the inclusive minimum date.'),
    apiRow('month', 'YYYY-MM string', 'current or selected month', 'Sets the initially visible month.'),
    apiRow('name', 'string', '-', 'Sets the name of the hidden input that stores the selected ISO date.'),
    apiRow('value', 'YYYY-MM-DD string', '""', 'Sets the selected date and hidden input value.')
  ],
  Carousel: [
    apiRow('data-ui-carousel-viewport', 'boolean attribute', '-', 'Marks the scrollable slide viewport.'),
    apiRow('data-ui-carousel-prev, data-ui-carousel-next', 'boolean attribute', '-', 'Marks child controls that move the viewport backward or forward.')
  ],
  Checkbox: [
    apiRow('checked, defaultChecked', 'boolean', '-', 'Uses the native checkbox checked state.'),
    apiRow('type', '"checkbox"', '"checkbox"', 'Fixed by the component.')
  ],
  Code: [
    apiRow('variant', '"inline" | "block"', '"inline"', 'Switches between inline code and a framed code block.'),
    apiRow('code', 'string', '-', 'Renders a normalized multiline code string with lightweight token colors.'),
    apiRow('language', 'string', '-', 'Labels the code language in block headers.'),
    apiRow('label', 'string', '-', 'Adds a compact filename or title to the block header.'),
    apiRow('copy', 'boolean', 'false', 'Shows a copy button when UIPrimitives is mounted.'),
    apiRow('highlighted', 'boolean', 'false', 'Allows a pre-highlighted pre/code tree, such as Shiki output, to render directly.'),
    apiRow('theme', '"auto" | "lumen" | "santi020k"', '"auto"', 'Selects the code palette family.')
  ],
  Combobox: [
    apiRow('list', 'string', 'required', 'Sets the id for the generated listbox and connects it to the combobox input.'),
    apiRow('label', 'string', '-', 'Adds a visible label above the input.'),
    apiRow('options', 'Array<string | { label, value, disabled? }>', '[]', 'Creates selectable listbox options from strings or value/label objects.'),
    apiRow('type', 'HTML input type', '"text"', 'Sets the native input type.')
  ],
  Command: [
    apiRow('data-ui-command-item', 'boolean attribute', '-', 'Marks filterable command items for the runtime.')
  ],
  ContextMenu: [
    surfaceApiRow
  ],
  ColorPicker: [
    apiRow('type', 'HTML input type', '"color"', 'Sets the native input type.')
  ],
  DataTable: [
    apiRow('columns', 'DataTableColumn[]', '[]', 'Generates table headers and maps row cells by column key when rows are provided.'),
    apiRow('rows', 'DataTableRow[]', '[]', 'Generates table body rows from structured data.'),
    apiRow('name', 'string', '-', 'Scopes selectable row checkbox names for form submission and runtime selection state.'),
    apiRow('selectable', 'boolean', 'false', 'Enables selectable row behavior for the UIPrimitives runtime.')
  ],
  DatePicker: [
    apiRow('type', 'HTML input type', '"date"', 'Sets the native input type.')
  ],
  Dialog: [
    surfaceApiRow,
    ...dialogTriggerApiRows('dialog')
  ],
  Direction: [
    apiRow('dir', '"ltr" | "rtl" | "auto"', '"ltr"', 'Sets text and layout direction for the subtree.')
  ],
  Drawer: [
    surfaceApiRow,
    ...dialogTriggerApiRows('drawer')
  ],
  DropdownMenu: [
    surfaceApiRow,
    disclosureTriggerApiRow,
    apiRow('[role="menu"]', 'child panel', '-', 'Marks the dropdown panel that contains role="menuitem" actions.')
  ],
  HoverCard: [
    surfaceApiRow,
    disclosureTriggerApiRow
  ],
  Icon: [
    apiRow('name', 'string', '-', 'Renders any Lucide icon by name, including kebab-case names and Lucide aliases.'),
    apiRow('label', 'string', '-', 'Adds an accessible name and exposes the icon as an image.'),
    apiRow('decorative', 'boolean', 'true when unlabelled', 'Keeps decorative icons hidden from assistive technology.'),
    apiRow('size', '"default" | "sm" | "lg" | "xl"', '"default"', 'Controls the icon box size.')
  ],
  Field: [
    apiRow('controlId', 'string', '-', 'Connects the field to a control elsewhere in the field root.'),
    apiRow('describedBy', 'space-separated ids', '-', 'Adds ids to the control aria-describedby value.'),
    apiRow('data-ui-form', 'boolean attribute', '-', 'Opts a form into native Constraint Validation API enhancement.'),
    apiRow('data-error-required, data-error-pattern, data-error-min, data-error-max, data-error-custom', 'string', '-', 'Overrides browser validationMessage text for matching constraints.')
  ],
  Input: [
    apiRow('type', 'HTML input type', '"text"', 'Sets the native input type.'),
    apiRow('size', '"default" | "sm" | "lg"', '"default"', 'Controls the field height and font size.')
  ],
  InputOTP: [
    apiRow('autocomplete', 'HTML autocomplete value', '"one-time-code"', 'Hints that password managers and mobile keyboards can offer one-time code autofill.'),
    apiRow('disabled', 'boolean', 'false', 'Disables the native input and generated visual segments.'),
    apiRow('length', 'number', '6', 'Sets the number of visual code segments and the default maxlength.'),
    apiRow('maxlength', 'number', 'length', 'Overrides the native maximum character count.'),
    apiRow('inputmode', 'HTML inputmode value', '"numeric"', 'Hints the preferred on-screen keyboard.'),
    apiRow('pattern', 'string', '"[0-9]*"', 'Sets the native input pattern for accepted characters.')
  ],
  Marker: [
    apiRow('variant', '"default" | "success" | "warning" | "danger"', '"default"', 'Controls the marker tone.')
  ],
  Menubar: [
    surfaceApiRow
  ],
  Message: [
    apiRow('from', '"assistant" | "user"', '"assistant"', 'Aligns and styles the message for the author.')
  ],
  NativeSelect: [
    apiRow('options', 'Array<string | { label, value, disabled? }>', '[]', 'Creates native option elements.'),
    apiRow('placeholder', 'string', '-', 'Adds a disabled placeholder option.'),
    apiRow('size', '"default" | "sm" | "lg"', '"default"', 'Controls select height and font size.')
  ],
  NavigationMenu: [
    surfaceApiRow
  ],
  NumberField: [
    apiRow('type', 'HTML input type', '"number"', 'Sets the native input type.')
  ],
  Popover: [
    surfaceApiRow,
    disclosureTriggerApiRow
  ],
  Progress: [
    apiRow('value', 'number', '0', 'Sets the current progress value, clamped between 0 and max.'),
    apiRow('max', 'number', '100', 'Sets the upper bound for progress.')
  ],
  Resizable: [
    apiRow('defaultSizes', 'number[]', '-', 'Sets initial pane sizes as percentages, serialized for the runtime.'),
    apiRow('direction', '"horizontal" | "vertical"', '"horizontal"', 'Sets the resize axis and generated handle orientation.'),
    apiRow('maxSize', 'number | number[]', '-', 'Limits pane growth by percentage; pass an array for per-pane limits.'),
    apiRow('minSize', 'number | number[]', '-', 'Limits pane shrinkage by percentage; pass an array for per-pane limits.'),
    apiRow('resetOnDoubleClick', 'boolean', 'true', 'Restores default pane sizes when a resize handle is double-clicked.')
  ],
  Select: [
    apiRow('options', 'Array<string | { label, value, disabled? }>', '[]', 'Creates native option elements.'),
    apiRow('placeholder', 'string', '-', 'Adds a disabled placeholder option and trigger placeholder text.'),
    apiRow('size', '"default" | "sm" | "md" | "lg"', '"default"', 'Controls select height and font size. The md value maps to the default size.'),
    apiRow('disabled', 'boolean', 'false', 'Disables the native select and enhanced trigger.'),
    apiRow('required', 'boolean', 'false', 'Forwards required validation to the native select.'),
    apiRow('value', 'string | number', '-', 'Selects the matching option value.')
  ],
  Separator: [
    apiRow('orientation', '"horizontal" | "vertical"', '"horizontal"', 'Sets the separator direction.')
  ],
  SearchField: [
    apiRow('type', 'HTML input type', '"search"', 'Sets the native input type.')
  ],
  RichTextEditor: [
    apiRow('data-ui-editor-command', 'bold | italic | underline | insertUnorderedList | insertOrderedList | createLink | unlink | formatBlock | removeFormat', '-', 'Marks toolbar controls that call document.execCommand(command) and emit ui:editor-command.')
  ],
  Sheet: [
    surfaceApiRow,
    ...dialogTriggerApiRows('sheet')
  ],
  Sidebar: [
    surfaceApiRow
  ],
  Sonner: [
    apiRow('placement', '"top-left" | "top-center" | "top-right" | "bottom-left" | "bottom-center" | "bottom-right"', '"bottom-right"', 'Positions the toast viewport.'),
    apiRow('maxCount', 'number', '-', 'Limits the number of runtime toasts kept in the viewport. The runtime default is 5 when omitted.'),
    apiRow('aria-atomic', 'ARIA boolean string', '"false"', 'Sets the live-region atomicity attribute.'),
    apiRow('aria-live', '"off" | "polite" | "assertive"', '"polite"', 'Sets the live-region announcement priority.')
  ],
  Slider: [
    apiRow('type', 'HTML input type', '"range"', 'Sets the native input type.')
  ],
  Skeleton: [
    apiRow('aria-label, aria-labelledby', 'string', '-', 'Makes the placeholder accessible and changes the default role to status.'),
    apiRow('aria-hidden', 'ARIA boolean string', 'true unless labelled', 'Overrides whether the loading placeholder is exposed to assistive technology.'),
    apiRow('role', 'ARIA role', '"status" when labelled', 'Overrides the generated status role.')
  ],
  Spinner: [
    apiRow('aria-label, aria-labelledby', 'string', '-', 'Makes the spinner accessible and changes the default role to status.'),
    apiRow('aria-hidden', 'ARIA boolean string', 'true unless labelled', 'Overrides whether the loading indicator is exposed to assistive technology.'),
    apiRow('role', 'ARIA role', '"status" when labelled', 'Overrides the generated status role.')
  ],
  Switch: [
    apiRow('checked, defaultChecked', 'boolean', '-', 'Uses the native checkbox checked state.'),
    apiRow('role', 'ARIA role', '"switch"', 'Sets the switch role on the checkbox input.'),
    apiRow('type', '"checkbox"', '"checkbox"', 'Fixed by the component.')
  ],
  Textarea: [
    apiRow('rows', 'number', '4', 'Sets the visible text rows.')
  ],
  Toast: [
    apiRow('variant', '"default" | "destructive" | "success" | "warning"', '"default"', 'Controls the toast tone.'),
    apiRow('window.LumenToast.create(detail)', 'function', '-', 'Creates a runtime toast and returns its id. Also available through document ui:toast.'),
    apiRow('window.LumenToast.update(id, detail)', 'function', '-', 'Updates the title, description, variant, action, or duration for a runtime toast.'),
    apiRow('window.LumenToast.dismiss(id?)', 'function', '-', 'Dismisses one runtime toast, or all runtime toasts when id is omitted.'),
    surfaceApiRow
  ],
  Toggle: [
    apiRow('pressed', 'boolean', 'false', 'Sets the initial pressed state.'),
    apiRow('type', '"button" | "submit" | "reset"', '"button"', 'Sets the native button type.')
  ],
  TimeField: [
    apiRow('type', 'HTML input type', '"time"', 'Sets the native input type.')
  ]
}

export const componentDocs: ComponentDoc[] = ([
  ['Accordion', 'Layout', 'Stacks collapsible content sections.', '<Accordion><details open><summary>Billing</summary><p>Invoices and payment methods.</p></details></Accordion>'],
  ['Alert', 'Feedback', 'Surfaces contextual status messages.', '<Alert><strong>Project synced.</strong><p>Your tokens are available.</p></Alert>'],
  ['AlertDialog', 'Overlays', 'Confirms destructive or high-commitment actions.', '<Button data-ui-alert-dialog-trigger="delete-project">Delete</Button><AlertDialog id="delete-project"><h2>Delete this project?</h2><Button data-ui-alert-dialog-close>Cancel</Button></AlertDialog>'],
  ['Agenda', 'Data display', 'Lists upcoming appointments, tasks, or dated events.', '<Agenda><header><h2>Today</h2></header><ol><li><strong>Design review</strong><span>10:00</span></li></ol></Agenda>'],
  ['AspectRatio', 'Layout', 'Keeps media and embeds in a predictable ratio.', '<AspectRatio ratio="16/9"><img src="/logo.svg" alt="Lumen logo" /></AspectRatio>'],
  ['Attachment', 'Data display', 'Displays a file attachment with metadata.', '<Attachment href="/logo.svg"><strong>lumen-logo.svg</strong><span>2 KB</span></Attachment>'],
  ['Autocomplete', 'Forms', 'Captures searchable text connected to suggestions.', '<Autocomplete list="cities" placeholder="Search city" /><datalist id="cities"><option value="Bogota" /></datalist>'],
  ['Avatar', 'Data display', 'Represents a person, team, or entity.', '<Avatar src="/icon.svg" alt="Lumen">LU</Avatar>'],
  ['Badge', 'Data display', 'Labels status, type, plan, or count information.', '<Badge variant="secondary">Astro</Badge>'],
  ['Breadcrumb', 'Navigation', 'Shows page hierarchy and parent navigation.', '<Breadcrumb><ol><li><a href="/docs">Docs</a></li><li><span aria-current="page">Components</span></li></ol></Breadcrumb>'],
  ['Bubble', 'Data display', 'Frames chat messages and short comments.', '<Bubble from="user">Can you summarize the release?</Bubble>'],
  ['Button', 'Actions', 'Triggers primary, secondary, destructive, and quiet actions.', '<Button variant="default">Save changes</Button><Button variant="secondary">Cancel</Button>'],
  ['ButtonGroup', 'Actions', 'Groups related button actions.', '<ButtonGroup><Button variant="secondary">Back</Button><Button>Publish</Button></ButtonGroup>'],
  ['Calendar', 'Forms', 'Presents a calendar surface for date selection.', '<Calendar aria-label="Choose a delivery date" />'],
  ['Card', 'Layout', 'Frames a focused item, metric, plan, or form.', '<Card><h2>Starter</h2><p>For personal projects.</p></Card>'],
  ['Carousel', 'Layout', 'Displays a horizontal sequence of slides.', '<Carousel aria-label="Featured templates"><article>Dashboard</article><article>Portfolio</article></Carousel>'],
  ['Chart', 'Data display', 'Frames metric headers, SVG plots, and captions for lightweight data visualization.', '<Chart aria-label="Revenue"><header><h3>Revenue</h3><strong data-ui-chart-value>$128K</strong></header><svg viewBox="0 0 120 40" role="img" aria-label="Revenue trend"><path d="M0 35 L30 26 L60 18 L90 22 L120 8" fill="none" stroke="currentColor" stroke-width="3" /></svg><figcaption>Revenue is up 42% since Q1.</figcaption></Chart>'],
  ['Checkbox', 'Forms', 'Captures a binary form value.', '<label><Checkbox name="updates" /> Email me product updates</label>'],
  ['Collapsible', 'Layout', 'Shows and hides one optional content region.', '<Collapsible><summary>Advanced filters</summary><p>Filter controls</p></Collapsible>'],
  ['Code', 'Data display', 'Renders inline code and framed code blocks with theme-aware palettes.', '<Code code={`const theme = "lumen";\nconst accent = "hsl(var(--accent))";`} variant="block" language="ts" label="theme.ts" copy />'],
  ['Combobox', 'Forms', 'Combines text entry and option selection.', '<Combobox label="Framework" list="framework-options" options={["Astro", { label: "React", value: "react" }, { label: "Vue", value: "vue", disabled: true }]} placeholder="Search package" />'],
  ['Command', 'Navigation', 'Builds command palettes and filterable action lists.', '<Command><Input placeholder="Type a command..." /><button data-ui-command-item>Open docs</button></Command>'],
  ['ContextMenu', 'Overlays', 'Provides contextual actions for a selected object.', '<ContextMenu><button role="menuitem">Duplicate</button></ContextMenu>'],
  ['ColorPicker', 'Forms', 'Captures a color token or brand swatch value.', '<ColorPicker name="brand" aria-label="Brand color" value="#2563eb" />'],
  ['DataTable', 'Data display', 'Styles dense tabular data and records.', '<DataTable><table><thead><tr><th>Name</th><th>Status</th></tr></thead><tbody><tr><td>Docs</td><td>Ready</td></tr></tbody></table></DataTable>'],
  ['DatePicker', 'Forms', 'Provides a styled date input.', '<DatePicker name="launchDate" aria-label="Launch date" />'],
  ['DateRangePicker', 'Forms', 'Groups start and end date controls for range selection.', '<DateRangePicker><DatePicker aria-label="Start date" /><DatePicker aria-label="End date" /></DateRangePicker>'],
  ['Dialog', 'Overlays', 'Presents modal content for focused tasks.', '<Button data-ui-dialog-trigger="profile-dialog">Edit profile</Button><Dialog id="profile-dialog"><p>Profile form</p><Button data-ui-dialog-close>Close</Button></Dialog>'],
  ['Direction', 'Layout', 'Controls directional layout and text flow.', '<Direction dir="rtl"><p>Localized content</p></Direction>'],
  ['Drawer', 'Overlays', 'Slides in supporting navigation, filters, or task panels.', '<Button data-ui-drawer-trigger="filters-drawer">Open filters</Button><Drawer id="filters-drawer"><p>Filter controls</p><Button data-ui-drawer-close>Close</Button></Drawer>'],
  ['DropdownMenu', 'Overlays', 'Shows compact actions from a trigger.', '<DropdownMenu><Button data-ui-trigger>More</Button><div role="menu"><button role="menuitem">Rename</button></div></DropdownMenu>'],
  ['Empty', 'Feedback', 'Explains an empty state and next action.', '<Empty><h2>No projects yet</h2><p>Create your first workspace.</p></Empty>'],
  ['Field', 'Forms', 'Groups labels, controls, descriptions, and errors.', '<Field><Label for="email">Email</Label><Input id="email" type="email" /></Field>'],
  ['HoverCard', 'Overlays', 'Shows extra context on hover and focus.', '<HoverCard><a href="/team/santiago">Santiago</a><div role="tooltip">Maintainer of Lumen UI.</div></HoverCard>'],
  ['Icon', 'Data display', 'Renders Lucide icons with Lumen sizing and accessibility defaults.', '<Icon name="search" label="Search" /><Icon name="wand-sparkles" decorative />'],
  ['Input', 'Forms', 'Captures short text, email, password, search, or numeric values.', '<Input id="email" name="email" type="email" placeholder="you@example.com" />'],
  ['InputGroup', 'Forms', 'Combines inputs with prefixes, suffixes, or controls.', '<InputGroup><span>https://</span><Input aria-label="Domain" placeholder="example.com" /></InputGroup>'],
  ['InputOTP', 'Forms', 'Collects one-time passcodes and verification codes.', '<InputOTP name="code" length={6} inputmode="numeric" />'],
  ['Item', 'Data display', 'Creates a compact row for lists and search results.', '<Item><strong>Production docs</strong><span>Ready for review</span></Item>'],
  ['Kbd', 'Data display', 'Displays keyboard shortcuts.', '<p>Open the command menu with <Kbd>Cmd K</Kbd>.</p>'],
  ['Label', 'Forms', 'Labels form controls with consistent spacing.', '<Label for="workspace">Workspace name</Label><Input id="workspace" />'],
  ['Marker', 'Data display', 'Highlights status, position, or annotations.', '<Marker variant="success">Live</Marker>'],
  ['Menubar', 'Navigation', 'Creates horizontal application menus.', '<Menubar><button role="menuitem">File</button><button role="menuitem">View</button></Menubar>'],
  ['Message', 'Data display', 'Structures a chat, activity, or system message.', '<Message><Avatar>LM</Avatar><Bubble>Lumen components are installed.</Bubble></Message>'],
  ['MessageScroller', 'Layout', 'Provides a scrollable message feed.', '<MessageScroller><Message>First event</Message><Message>Second event</Message></MessageScroller>'],
  ['NativeSelect', 'Forms', 'Styles the browser-native select element.', '<NativeSelect name="plan" options={["Free", "Pro", "Team"]} />'],
  ['NavigationMenu', 'Navigation', 'Builds grouped top-level navigation.', '<NavigationMenu><a href="/docs">Docs</a><a href="/docs/components">Components</a></NavigationMenu>'],
  ['NumberField', 'Forms', 'Captures constrained numeric values.', '<NumberField min="1" max="10" step="1" aria-label="Seats" />'],
  ['Pagination', 'Navigation', 'Moves through paginated records or result sets.', '<Pagination><a href="?page=1">Previous</a><a aria-current="page" href="?page=2">2</a><a href="?page=3">Next</a></Pagination>'],
  ['Popover', 'Overlays', 'Displays lightweight floating content from a trigger.', '<Popover><Button data-ui-trigger>Invite</Button><div>Email form</div></Popover>'],
  ['Progress', 'Feedback', 'Shows completion, loading progress, or quota usage.', '<Progress value={64} max={100} aria-label="Upload progress" />'],
  ['RadioGroup', 'Forms', 'Groups mutually exclusive options.', '<RadioGroup><label><input type="radio" name="theme" value="light" /> Light</label><label><input type="radio" name="theme" value="dark" /> Dark</label></RadioGroup>'],
  ['Resizable', 'Layout', 'Frames panes that can be resized.', '<Resizable><aside>Navigation</aside><main>Editor</main></Resizable>'],
  ['RichTextEditor', 'Forms', 'Frames rich text toolbar and editing compositions.', '<RichTextEditor><div role="toolbar"><ButtonGroup><Button data-ui-editor-command="bold">B</Button><Button data-ui-editor-command="italic">I</Button></ButtonGroup></div><div contenteditable="true">Draft release notes...</div></RichTextEditor>'],
  ['ScrollArea', 'Layout', 'Provides a styled scroll container.', '<ScrollArea style="max-height: 18rem"><p>Long release notes...</p></ScrollArea>'],
  ['Schedule', 'Data display', 'Displays calendar events across day, week, or resource grids.', '<Schedule><header><h2>Launch week</h2></header><div data-ui-schedule-grid><article data-ui-schedule-event>Planning</article><article data-ui-schedule-event>Ship</article></div></Schedule>'],
  ['SearchField', 'Forms', 'Captures search queries with native search semantics.', '<SearchField name="q" placeholder="Search docs" />'],
  ['Select', 'Forms', 'Creates a custom select control.', '<Select name="framework" options={["Astro", "React", "Web Components"]} />'],
  ['Separator', 'Layout', 'Separates related content groups.', '<Separator /><p>Next section</p>'],
  ['Sheet', 'Overlays', 'Shows a side sheet for secondary flows.', '<Button data-ui-sheet-trigger="details-sheet">Open details</Button><Sheet id="details-sheet"><p>Details panel</p><Button data-ui-sheet-close>Close</Button></Sheet>'],
  ['Sidebar', 'Navigation', 'Builds persistent app navigation.', '<Sidebar><a href="/dashboard">Dashboard</a><a href="/settings">Settings</a></Sidebar>'],
  ['Skeleton', 'Feedback', 'Reserves space during loading states.', '<Skeleton style="height: 2.5rem" aria-label="Loading profile" />'],
  ['Slider', 'Forms', 'Captures numeric values across a bounded range.', '<Slider name="opacity" min="0" max="100" value="80" />'],
  ['Sonner', 'Feedback', 'Provides the toast viewport for notifications.', '<Sonner aria-live="polite" />'],
  ['Spinner', 'Feedback', 'Indicates short loading states.', '<Spinner aria-label="Saving" />'],
  ['Switch', 'Forms', 'Toggles a single setting on or off.', '<Switch name="notifications" aria-label="Enable notifications" />'],
  ['Table', 'Data display', 'Styles semantic tables for records and comparisons.', '<Table><thead><tr><th>Package</th><th>Status</th></tr></thead><tbody><tr><td>Astro</td><td>Complete</td></tr></tbody></Table>'],
  ['Tabs', 'Navigation', 'Switches between related panels.', '<Tabs><div role="tablist"><button role="tab" aria-selected="true">Preview</button></div><section role="tabpanel">Preview content</section></Tabs>'],
  ['TagGroup', 'Forms', 'Groups removable or selectable tags.', '<TagGroup><span data-ui-tag role="listitem">Astro</span><span data-ui-tag role="listitem">Accessible</span></TagGroup>'],
  ['Textarea', 'Forms', 'Captures longer free-form text.', '<Textarea name="notes" rows={5} placeholder="Add release notes..." />'],
  ['ThemeBuilder', 'Data display', 'Builds scoped token previews with hue, scheme, manual color, and export controls.', '<ThemeBuilder data-ui-theme-target="#preview"><input data-ui-theme-brand-hue type="range" min="0" max="359" value="264" /><button data-ui-theme-export type="button">Copy CSS</button><textarea data-ui-theme-output></textarea></ThemeBuilder>'],
  ['TimeField', 'Forms', 'Captures a native time value.', '<TimeField name="startTime" aria-label="Start time" />'],
  ['Toast', 'Feedback', 'Displays temporary feedback for background actions.', '<Toast><strong>Saved</strong><p>Your changes are live.</p></Toast>'],
  ['Toggle', 'Actions', 'Represents an on/off action.', '<Toggle aria-label="Pin project" pressed={false}>Pin</Toggle>'],
  ['ToggleGroup', 'Actions', 'Groups related toggles.', '<ToggleGroup><Toggle>Day</Toggle><Toggle pressed>Week</Toggle><Toggle>Month</Toggle></ToggleGroup>'],
  ['Tooltip', 'Overlays', 'Adds concise helper text to compact controls.', '<Tooltip><button aria-label="Save changes">Save</button><span role="tooltip">Save changes</span></Tooltip>'],
  ['Tree', 'Data display', 'Displays hierarchical navigation or object collections.', '<Tree><div role="treeitem" aria-expanded="true">src</div><div role="treeitem">index.ts</div></Tree>'],
  ['TreeGrid', 'Data display', 'Displays hierarchical rows with grid-like columns.', '<TreeGrid><div role="row"><span role="gridcell">Docs</span><span role="gridcell">Ready</span></div></TreeGrid>'],
  ['Typography', 'Data display', 'Applies Lumen text rhythm to article content.', '<Typography><h1>Release notes</h1><p>Lumen now includes production documentation.</p></Typography>'],
  ['VirtualList', 'Data display', 'Frames long scrollable collections for virtualization adapters.', '<VirtualList style="--ui-list-height: 16rem"><div>Row 1</div><div>Row 2</div></VirtualList>']
] as const satisfies readonly ComponentDocTuple[]).map(([name, category, summary, example]) => ({
  apiReference: [
    ...(glassApiComponentNameSet.has(name) ? [glassApiRow] : []),
    ...(apiReferenceByComponent[name] ?? []),
    ...commonApiRows
  ],
  glass: glassComponentNameSet.has(name),
  ...(keyboardInteractionsByComponent[name] ? { keyboardInteractions: [...keyboardInteractionsByComponent[name]] } : {}),
  name,
  category,
  ...(runtimeEventsByComponent[name] ? { runtimeEvents: [...runtimeEventsByComponent[name]] } : {}),
  summary,
  example
}))

export const componentCategories = [...new Set(componentDocs.map(component => component.category))].sort()

// ---------------------------------------------------------------------------
// React hooks reference
// ---------------------------------------------------------------------------

export interface ReactHookDoc {
  code: string
  controller: readonly ReactHookApiRow[]
  description: string
  name: string
  options: readonly ReactHookApiRow[]
}

export interface ReactHookApiRow {
  defaultValue: string
  description: string
  name: string
  type: string
}

const hookApiRow = (
  name: string,
  type: string,
  defaultValue: string,
  description: string
): ReactHookApiRow => ({
  defaultValue,
  description,
  name,
  type
})

export const reactHooksReference: ReactHookDoc[] = [
  {
    name: 'useDialog',
    description: 'Manages modal and alert dialog lifecycle — open, close, focus trapping, backdrop click dismiss, and Escape key handling. Spreads props onto a <dialog> element.',
    options: [
      hookApiRow('alert', 'boolean', 'false', 'Render as an alert dialog that blocks backdrop-click dismiss.'),
      hookApiRow('defaultOpen', 'boolean', 'false', 'Initial open state for uncontrolled usage.'),
      hookApiRow('open', 'boolean', '-', 'Controlled open state. When provided the hook does not manage open internally.'),
      hookApiRow('onOpenChange', '(open: boolean) => void', '-', 'Callback fired when the open state changes.'),
      hookApiRow('id', 'string', 'auto', 'Explicit id for the dialog element.')
    ],
    controller: [
      hookApiRow('dialogProps', 'LumenProps<"dialog">', '-', 'Spread onto the <dialog> element. Includes aria-modal, data attributes, click and keydown handlers.'),
      hookApiRow('triggerProps', 'LumenProps<"button">', '-', 'Spread onto the trigger button. Binds the click handler that opens the dialog.'),
      hookApiRow('closeProps', 'LumenProps<"button">', '-', 'Spread onto any close button inside the dialog.'),
      hookApiRow('dialogRef', 'RefObject<HTMLDialogElement>', '-', 'Ref to the dialog DOM element.'),
      hookApiRow('triggerRef', 'RefObject<HTMLElement>', '-', 'Ref to the trigger DOM element.'),
      hookApiRow('open', 'boolean', '-', 'Current open state.'),
      hookApiRow('close', '() => void', '-', 'Imperatively close the dialog.'),
      hookApiRow('setOpen', 'Dispatch<SetStateAction<boolean>>', '-', 'State setter for controlled usage.')
    ],
    code: `import { Button, Dialog, Card } from '@santi020k/lumen-react'
import { useDialog } from '@santi020k/lumen-react'

export function ConfirmDialog() {
  const dialog = useDialog()

  return (
    <>
      <Button {...dialog.triggerProps}>Open dialog</Button>
      <Dialog {...dialog.dialogProps}>
        <Card>
          <h2>Confirm action</h2>
          <p>Are you sure you want to continue?</p>
          <Button {...dialog.closeProps}>Close</Button>
        </Card>
      </Dialog>
    </>
  )
}`
  },
  {
    name: 'usePopover',
    description: 'Manages popover disclosure — toggle, outside click close, Escape key dismiss, and arrow key navigation through focusable panel items.',
    options: [
      hookApiRow('defaultOpen', 'boolean', 'false', 'Initial open state for uncontrolled usage.'),
      hookApiRow('open', 'boolean', '-', 'Controlled open state.'),
      hookApiRow('onOpenChange', '(open: boolean) => void', '-', 'Callback fired when the open state changes.'),
      hookApiRow('id', 'string', 'auto', 'Explicit id for the panel element.')
    ],
    controller: [
      hookApiRow('rootProps', 'LumenProps<"div">', '-', 'Spread onto the root wrapper element.'),
      hookApiRow('triggerProps', 'LumenProps<"button">', '-', 'Spread onto the trigger button. Binds click, ArrowDown, Enter, and Space key handlers.'),
      hookApiRow('panelProps', 'LumenProps<"div">', '-', 'Spread onto the popover panel. Includes Escape, arrow, Home, and End key handlers.'),
      hookApiRow('rootRef', 'RefObject<HTMLElement>', '-', 'Ref to the root wrapper.'),
      hookApiRow('triggerRef', 'RefObject<HTMLElement>', '-', 'Ref to the trigger element.'),
      hookApiRow('panelRef', 'RefObject<HTMLElement>', '-', 'Ref to the panel element.'),
      hookApiRow('open', 'boolean', '-', 'Current open state.'),
      hookApiRow('close', '() => void', '-', 'Close the popover.'),
      hookApiRow('toggle', '() => void', '-', 'Toggle the popover.'),
      hookApiRow('setOpen', 'Dispatch<SetStateAction<boolean>>', '-', 'State setter for controlled usage.')
    ],
    code: `import { Button, Popover, PopoverTrigger, PopoverPanel } from '@santi020k/lumen-react'
import { usePopover } from '@santi020k/lumen-react'

export function NotificationsPopover() {
  const popover = usePopover()

  return (
    <Popover {...popover.rootProps}>
      <PopoverTrigger {...popover.triggerProps}>Notifications</PopoverTrigger>
      <PopoverPanel {...popover.panelProps}>
        <p>No new notifications.</p>
      </PopoverPanel>
    </Popover>
  )
}`
  },
  {
    name: 'useDropdownMenu',
    description: 'Manages dropdown menu disclosure — identical API to usePopover but sets aria-haspopup to "menu" for correct ARIA semantics on menu triggers.',
    options: [
      hookApiRow('defaultOpen', 'boolean', 'false', 'Initial open state.'),
      hookApiRow('open', 'boolean', '-', 'Controlled open state.'),
      hookApiRow('onOpenChange', '(open: boolean) => void', '-', 'Callback fired when the open state changes.'),
      hookApiRow('id', 'string', 'auto', 'Explicit id for the menu panel.')
    ],
    controller: [
      hookApiRow('rootProps', 'LumenProps<"div">', '-', 'Spread onto the root wrapper.'),
      hookApiRow('triggerProps', 'LumenProps<"button">', '-', 'Spread onto the menu trigger. Sets aria-haspopup="menu".'),
      hookApiRow('panelProps', 'LumenProps<"div">', '-', 'Spread onto the menu panel with keyboard navigation.'),
      hookApiRow('open', 'boolean', '-', 'Current open state.'),
      hookApiRow('close', '() => void', '-', 'Close the menu.'),
      hookApiRow('toggle', '() => void', '-', 'Toggle the menu.')
    ],
    code: `import { Button, DropdownMenu, DropdownMenuTrigger, DropdownMenuContent } from '@santi020k/lumen-react'
import { useDropdownMenu } from '@santi020k/lumen-react'

export function ActionsMenu() {
  const menu = useDropdownMenu()

  return (
    <DropdownMenu {...menu.rootProps}>
      <DropdownMenuTrigger {...menu.triggerProps}>Actions</DropdownMenuTrigger>
      <DropdownMenuContent {...menu.panelProps}>
        <button>Edit</button>
        <button>Delete</button>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}`
  },
  {
    name: 'useContextMenu',
    description: 'Binds a trigger to a context menu that opens on right-click or Shift+F10 and supports Escape and roving item focus.',
    options: [
      hookApiRow('defaultOpen', 'boolean', 'false', 'Initial open state.'),
      hookApiRow('open', 'boolean', '-', 'Controlled open state.'),
      hookApiRow('onOpenChange', '(open: boolean) => void', '-', 'Callback fired when the context menu opens or closes.'),
      hookApiRow('id', 'string', 'auto', 'Explicit id for the menu.')
    ],
    controller: [
      hookApiRow('triggerProps', 'LumenProps<"button">', '-', 'Spread onto the trigger. Handles contextmenu and Shift+F10.'),
      hookApiRow('menuProps', 'LumenProps<"menu">', '-', 'Spread onto ContextMenu. Includes data-ui-context-menu, role, hidden state, and keyboard handlers.'),
      hookApiRow('triggerRef', 'RefObject<HTMLElement>', '-', 'Ref to the trigger.'),
      hookApiRow('menuRef', 'RefObject<HTMLElement>', '-', 'Ref to the menu.'),
      hookApiRow('open', 'boolean', '-', 'Current open state.'),
      hookApiRow('openAt', '(x: number, y: number) => void', '-', 'Open the menu at viewport coordinates.'),
      hookApiRow('close', '() => void', '-', 'Close the menu.')
    ],
    code: `import { ContextMenu, useContextMenu } from '@santi020k/lumen-react'

export function ProjectActions() {
  const menu = useContextMenu({ id: 'project-actions' })

  return (
    <>
      <button {...menu.triggerProps}>Project</button>
      <ContextMenu {...menu.menuProps}>
        <button role="menuitem">Duplicate</button>
        <button role="menuitem">Delete</button>
      </ContextMenu>
    </>
  )
}`
  },
  {
    name: 'useTabs',
    description: 'Manages a tabbed interface with controlled/uncontrolled value, arrow key navigation, roving tabindex, and automatic ARIA attributes for tab triggers and panels.',
    options: [
      hookApiRow('defaultValue', 'string', '""', 'Initial active tab value for uncontrolled usage.'),
      hookApiRow('value', 'string', '-', 'Controlled active tab value.'),
      hookApiRow('onValueChange', '(value: string) => void', '-', 'Callback fired when the active tab changes.'),
      hookApiRow('orientation', '"horizontal" | "vertical"', '"horizontal"', 'Tab navigation direction — affects which arrow keys are used.'),
      hookApiRow('id', 'string', 'auto', 'Base id for generated tab and panel ids.')
    ],
    controller: [
      hookApiRow('rootProps', 'LumenProps<"div">', '-', 'Spread onto the tabs root wrapper.'),
      hookApiRow('listProps', 'LumenProps<"div">', '-', 'Spread onto the tablist element.'),
      hookApiRow('getTriggerProps(value)', '(value, props?) => LumenProps<"button">', '-', 'Returns props for a tab trigger with the given value. Includes aria-selected, role, keyboard handlers.'),
      hookApiRow('getPanelProps(value)', '(value, props?) => LumenProps<"div">', '-', 'Returns props for a tab panel. Automatically hides non-active panels.'),
      hookApiRow('value', 'string', '-', 'Currently active tab value.'),
      hookApiRow('setValue', 'Dispatch<SetStateAction<string>>', '-', 'State setter for controlled usage.'),
      hookApiRow('rootRef', 'RefObject<HTMLElement>', '-', 'Ref to the tabs root element.')
    ],
    code: `import { Tabs, TabsList, TabsTrigger, TabsPanel } from '@santi020k/lumen-react'
import { useTabs } from '@santi020k/lumen-react'

export function SettingsTabs() {
  const tabs = useTabs({ defaultValue: 'general' })

  return (
    <Tabs {...tabs.rootProps}>
      <TabsList {...tabs.listProps}>
        <TabsTrigger {...tabs.getTriggerProps('general')}>General</TabsTrigger>
        <TabsTrigger {...tabs.getTriggerProps('security')}>Security</TabsTrigger>
      </TabsList>
      <TabsPanel {...tabs.getPanelProps('general')}>
        <p>General settings content.</p>
      </TabsPanel>
      <TabsPanel {...tabs.getPanelProps('security')}>
        <p>Security settings content.</p>
      </TabsPanel>
    </Tabs>
  )
}`
  },
  {
    name: 'useSelect',
    description: 'Manages a fully custom select with native <select> fallback, ARIA listbox, typeahead character search, keyboard navigation, and external form integration.',
    options: [
      hookApiRow('options', 'Array<string | SelectOption>', '[]', 'Available options. Strings are converted to { label, value } objects.'),
      hookApiRow('defaultValue', 'string', '""', 'Initial selected value.'),
      hookApiRow('value', 'string', '-', 'Controlled selected value.'),
      hookApiRow('onValueChange', '(value: string) => void', '-', 'Callback fired when the selected value changes.'),
      hookApiRow('placeholder', 'string', '-', 'Placeholder text shown when no option is selected.'),
      hookApiRow('disabled', 'boolean', 'false', 'Disable the select trigger.'),
      hookApiRow('required', 'boolean', 'false', 'Mark the hidden native select as required for form validation.'),
      hookApiRow('name', 'string', '-', 'Name attribute for the hidden native select.'),
      hookApiRow('id', 'string', 'auto', 'Explicit id for the listbox.')
    ],
    controller: [
      hookApiRow('rootProps', 'LumenProps<"div">', '-', 'Spread onto the select root wrapper.'),
      hookApiRow('triggerProps', 'LumenProps<"button">', '-', 'Spread onto the trigger button. Includes keyboard navigation.'),
      hookApiRow('listProps', 'LumenProps<"div">', '-', 'Spread onto the listbox container.'),
      hookApiRow('controlProps', 'LumenProps<"div">', '-', 'Spread onto the visual control wrapper.'),
      hookApiRow('nativeSelectProps', 'LumenProps<"select">', '-', 'Spread onto a hidden native <select> for form compatibility.'),
      hookApiRow('getOptionProps(option)', '(option, props?) => LumenProps<"button">', '-', 'Returns props for an option button.'),
      hookApiRow('selectedOption', 'SelectOption | undefined', '-', 'Currently selected option object.'),
      hookApiRow('triggerText', 'string', '-', 'Display text for the trigger (selected label or placeholder).'),
      hookApiRow('value', 'string', '-', 'Currently selected value.'),
      hookApiRow('options', 'SelectOption[]', '-', 'Normalized options array.'),
      hookApiRow('open', 'boolean', '-', 'Whether the listbox is open.'),
      hookApiRow('close', '() => void', '-', 'Close the listbox.'),
      hookApiRow('selectOption', '(value: string) => void', '-', 'Programmatically select an option by value.')
    ],
    code: `import { Select } from '@santi020k/lumen-react'
import { useSelect } from '@santi020k/lumen-react'

export function CountrySelect() {
  const select = useSelect({
    options: ['United States', 'Canada', 'Mexico'],
    placeholder: 'Choose a country',
    onValueChange: (value) => console.log('Selected:', value)
  })

  return (
    <div {...select.rootProps}>
      <button {...select.triggerProps}>{select.triggerText}</button>
      <select {...select.nativeSelectProps} />
      <div {...select.listProps}>
        {select.options.map(option => (
          <button key={option.value} {...select.getOptionProps(option)}>
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}`
  },
  {
    name: 'useTooltip',
    description: 'Manages tooltip show/hide with configurable delay, hover and focus triggers, and Escape key dismissal.',
    options: [
      hookApiRow('delay', 'number', '400', 'Milliseconds to wait before showing the tooltip on hover.'),
      hookApiRow('defaultOpen', 'boolean', 'false', 'Initial open state.'),
      hookApiRow('open', 'boolean', '-', 'Controlled open state.'),
      hookApiRow('onOpenChange', '(open: boolean) => void', '-', 'Callback fired when the tooltip opens or closes.')
    ],
    controller: [
      hookApiRow('rootProps', 'LumenProps<"span">', '-', 'Spread onto the wrapper span. Includes hover and focus listeners.'),
      hookApiRow('tooltipProps', 'LumenProps<"span">', '-', 'Spread onto the tooltip content span. Includes role="tooltip" and visibility.'),
      hookApiRow('open', 'boolean', '-', 'Current open state.'),
      hookApiRow('close', '() => void', '-', 'Close the tooltip.'),
      hookApiRow('setOpen', 'Dispatch<SetStateAction<boolean>>', '-', 'State setter for controlled usage.')
    ],
    code: `import { Button, Tooltip, TooltipContent } from '@santi020k/lumen-react'
import { useTooltip } from '@santi020k/lumen-react'

export function SaveButton() {
  const tooltip = useTooltip({ delay: 300 })

  return (
    <Tooltip {...tooltip.rootProps}>
      <Button>Save</Button>
      <TooltipContent {...tooltip.tooltipProps}>Save your changes</TooltipContent>
    </Tooltip>
  )
}`
  },
  {
    name: 'useToast',
    description: 'Consumes the ToastProvider context to create, update, and dismiss toast notifications. Requires a ToastProvider ancestor in the component tree.',
    options: [],
    controller: [
      hookApiRow('create', '(detail: ToastDetail) => string', '-', 'Create a toast and return its id. Accepts title, description, variant, duration, placement, and an optional action.'),
      hookApiRow('dismiss', '(id?: string) => void', '-', 'Dismiss a specific toast by id, or dismiss the most recent toast if no id is provided.'),
      hookApiRow('update', '(id: string, detail: ToastDetail) => void', '-', 'Update an existing toast with new content.'),
      hookApiRow('toasts', 'ToastRecord[]', '-', 'Array of all active toast records.')
    ],
    code: `import { Button, ToastProvider } from '@santi020k/lumen-react'
import { useToast } from '@santi020k/lumen-react'

function SaveButton() {
  const toast = useToast()

  return (
    <Button onClick={() => toast.create({
      title: 'Saved',
      description: 'Your changes are live.',
      variant: 'success'
    })}>
      Save
    </Button>
  )
}

// Wrap your app with ToastProvider
export function App() {
  return (
    <ToastProvider placement="bottom-right" maxCount={5}>
      <SaveButton />
    </ToastProvider>
  )
}`
  },
  {
    name: 'useFormValidation',
    description: 'Enhances native HTML form validation with custom error messages via data-error-* attributes, live field description syncing, and programmatic validity control.',
    options: [
      hookApiRow('onValidate', '(detail: FormValidationValidateDetail) => void', '-', 'Callback fired when a single control is validated.'),
      hookApiRow('onValid', '(detail: FormValidationStateDetail) => void', '-', 'Callback fired when the form becomes valid.'),
      hookApiRow('onInvalid', '(detail: FormValidationStateDetail) => void', '-', 'Callback fired when the form has invalid controls.')
    ],
    controller: [
      hookApiRow('formProps', 'LumenProps<"form">', '-', 'Spread onto the <form> element. Adds native validation bypass and submit handler.'),
      hookApiRow('formRef', 'RefObject<HTMLFormElement>', '-', 'Ref to the form element.'),
      hookApiRow('getControls', '(form?) => NativeFormControl[]', '-', 'Returns all form controls, including inputs, selects, and text areas.'),
      hookApiRow('setFieldValidity', '(control, invalid, message?) => void', '-', 'Programmatically set a field as valid or invalid with a custom message.'),
      hookApiRow('validateControl', '(control, form?) => boolean', '-', 'Validate a single control and return whether it is valid.'),
      hookApiRow('validateForm', '(form?) => NativeFormControl[]', '-', 'Validate all controls and return the array of invalid controls.')
    ],
    code: `import { Button, Field, Input, Label } from '@santi020k/lumen-react'
import { useFormValidation } from '@santi020k/lumen-react'

export function SignupForm() {
  const form = useFormValidation({
    onValid: () => console.log('Form is valid'),
    onInvalid: ({ controls }) =>
      console.log('Invalid fields:', controls?.length)
  })

  return (
    <form {...form.formProps}>
      <Field>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          required
          data-error-required="Please enter your email"
          data-error-type="Enter a valid email address"
        />
      </Field>
      <Button type="submit">Sign up</Button>
    </form>
  )
}`
  },
  {
    name: 'useCalendar',
    description: 'Builds an Astro-compatible calendar grid with hidden input value, min/max clamping, month navigation, selection, and roving keyboard focus.',
    options: [
      hookApiRow('value', 'string', '-', 'Controlled selected date in YYYY-MM-DD format.'),
      hookApiRow('defaultValue', 'string', '""', 'Initial selected date for uncontrolled usage.'),
      hookApiRow('month', 'string', 'selected month or today', 'Visible month in YYYY-MM format.'),
      hookApiRow('min / max', 'string', '-', 'Inclusive date bounds in YYYY-MM-DD format.'),
      hookApiRow('onValueChange', '(value: string) => void', '-', 'Callback fired when a date is selected.')
    ],
    controller: [
      hookApiRow('rootProps', 'LumenProps<"div">', '-', 'Spread onto the calendar root.'),
      hookApiRow('inputProps', 'LumenProps<"input">', '-', 'Spread onto the hidden input.'),
      hookApiRow('previousProps / nextProps', 'LumenProps<"button">', '-', 'Spread onto month navigation buttons.'),
      hookApiRow('weeks', 'CalendarDay[][]', '-', 'Six calendar rows of generated day models.'),
      hookApiRow('getDayProps', '(day, props?) => LumenProps<"td">', '-', 'Returns gridcell props for a generated day.'),
      hookApiRow('selectDate', '(date) => void', '-', 'Select a date programmatically.')
    ],
    code: `import { Calendar } from '@santi020k/lumen-react'

export function DeliveryDate() {
  return (
    <Calendar
      max="2026-07-31"
      min="2026-07-01"
      month="2026-07"
      name="delivery"
    />
  )
}`
  },
  {
    name: 'useDateRangePicker',
    description: 'Keeps paired native date inputs constrained so the end date cannot be before the start date.',
    options: [
      hookApiRow('onRangeChange', '(detail: DateRangePickerChangeDetail) => void', '-', 'Callback fired after the date range is synchronized.')
    ],
    controller: [
      hookApiRow('rootProps', 'LumenProps<"div">', '-', 'Spread onto the date range root.'),
      hookApiRow('rootRef', 'RefObject<HTMLElement>', '-', 'Ref to the date range root.'),
      hookApiRow('getStartProps', '(props?) => LumenProps<"input">', '-', 'Returns props for the start date input.'),
      hookApiRow('getEndProps', '(props?) => LumenProps<"input">', '-', 'Returns props for the end date input.'),
      hookApiRow('syncRange', '(root?) => DateRangePickerChangeDetail', '-', 'Synchronize min/max constraints and return the current range.')
    ],
    code: `import { useDateRangePicker } from '@santi020k/lumen-react'

export function BookingRange() {
  const range = useDateRangePicker()

  return (
    <div className="ui-date-range-picker" {...range.rootProps}>
      <input className="ui-input ui-date-picker" aria-label="Start date" {...range.getStartProps()} />
      <input className="ui-input ui-date-picker" aria-label="End date" {...range.getEndProps()} />
    </div>
  )
}`
  },
  {
    name: 'useInputOTP',
    description: 'Builds an Astro-compatible OTP field with a native input, visual segments, sanitized values, and caret navigation.',
    options: [
      hookApiRow('length', 'number', '6', 'Number of visible OTP segments.'),
      hookApiRow('value', 'string', '-', 'Controlled OTP value.'),
      hookApiRow('defaultValue', 'string', '""', 'Initial value for uncontrolled usage.'),
      hookApiRow('onValueChange', '(value: string) => void', '-', 'Callback fired when input or paste changes the sanitized value.'),
      hookApiRow('inputMode', 'string', '"numeric"', 'Native inputMode forwarded to the hidden input. Numeric mode removes non-digits.'),
      hookApiRow('pattern', 'string', '"[0-9]*"', 'Native pattern forwarded to the hidden input.')
    ],
    controller: [
      hookApiRow('rootProps', 'LumenProps<"div">', '-', 'Spread onto the OTP field root.'),
      hookApiRow('getInputProps', '(props?) => LumenProps<"input">', '-', 'Returns props for the native input.'),
      hookApiRow('segmentsProps', 'LumenProps<"div">', '-', 'Spread onto the visual segment container.'),
      hookApiRow('getSegmentProps', '(index, props?) => LumenProps<"button">', '-', 'Returns props for a visual segment button.'),
      hookApiRow('getSegmentChar', '(index) => string', '-', 'Returns the character or blank placeholder for a segment.'),
      hookApiRow('setValue', '(value) => string', '-', 'Sanitize and set the current OTP value.')
    ],
    code: `import { useInputOTP } from '@santi020k/lumen-react'

export function VerificationCode() {
  const otp = useInputOTP({ length: 6 })

  return (
    <div {...otp.rootProps}>
      <input aria-label="Verification code" name="code" {...otp.getInputProps()} />
      <div {...otp.segmentsProps}>
        {otp.segmentIndexes.map(index => (
          <button key={index} {...otp.getSegmentProps(index)}>
            <span data-ui-input-otp-char>{otp.getSegmentChar(index)}</span>
          </button>
        ))}
      </div>
    </div>
  )
}`
  },
  {
    name: 'useRichTextEditor',
    description: 'Provides rich text editing via document.execCommand. Returns props for the editable root and factory for toolbar command buttons.',
    options: [
      hookApiRow('onCommand', '(detail: { command: string }) => void', '-', 'Callback fired when a command is executed.')
    ],
    controller: [
      hookApiRow('rootProps', 'LumenProps<"section">', '-', 'Spread onto the editor root section.'),
      hookApiRow('rootRef', 'RefObject<HTMLElement>', '-', 'Ref to the editor root.'),
      hookApiRow('executeCommand', '(command: string, root?) => boolean', '-', 'Execute a rich text command (bold, italic, insertUnorderedList, etc.).'),
      hookApiRow('getCommandProps', '(command, props?) => LumenProps<"button">', '-', 'Returns props for a toolbar button bound to a specific command.')
    ],
    code: `import { Button, RichTextEditor } from '@santi020k/lumen-react'
import { useRichTextEditor } from '@santi020k/lumen-react'

export function Editor() {
  const editor = useRichTextEditor()

  return (
    <RichTextEditor {...editor.rootProps}>
      <div role="toolbar" aria-label="Formatting">
        <Button {...editor.getCommandProps('bold')} size="icon">B</Button>
        <Button {...editor.getCommandProps('italic')} size="icon">I</Button>
        <Button {...editor.getCommandProps('insertUnorderedList')} size="icon">•</Button>
      </div>
      <div contentEditable data-ui-rich-text-editable>
        <p>Start writing...</p>
      </div>
    </RichTextEditor>
  )
}`
  },
  {
    name: 'useSchedule',
    description: 'Provides props for schedule/agenda slot and event elements, and emits change details when a slot or event is interacted with.',
    options: [
      hookApiRow('onChange', '(detail: ScheduleChangeDetail) => void', '-', 'Callback fired when a schedule slot or event changes.')
    ],
    controller: [
      hookApiRow('rootProps', 'LumenProps<"section">', '-', 'Spread onto the schedule root.'),
      hookApiRow('rootRef', 'RefObject<HTMLElement>', '-', 'Ref to the schedule root.'),
      hookApiRow('getSlotProps', '(slot, props?) => LumenProps<"section">', '-', 'Returns props for a time slot element.'),
      hookApiRow('getEventProps', '(eventId?, props?) => LumenProps<"article">', '-', 'Returns props for an event element.'),
      hookApiRow('emitChange', '(detail, root?) => void', '-', 'Programmatically emit a schedule change detail.')
    ],
    code: `import { Schedule, Card } from '@santi020k/lumen-react'
import { useSchedule } from '@santi020k/lumen-react'

export function WeekView() {
  const schedule = useSchedule({
    onChange: ({ eventId, slot }) =>
      console.log('Changed:', eventId, slot)
  })

  return (
    <Schedule {...schedule.rootProps}>
      <section {...schedule.getSlotProps('2025-01-06T09:00')}>
        <Card {...schedule.getEventProps('meeting-1')}>
          <strong>Team standup</strong>
          <p>9:00 – 9:30</p>
        </Card>
      </section>
    </Schedule>
  )
}`
  },
  {
    name: 'useResizable',
    description: 'Provides pane sizing props and separator handle props for horizontal or vertical resizable groups.',
    options: [
      hookApiRow('panelCount', 'number', '2', 'Number of panes in the group.'),
      hookApiRow('defaultSizes', 'number[]', 'equal panes', 'Initial pane sizes normalized to 100%.'),
      hookApiRow('minSize', 'number | number[]', '12', 'Minimum pane size percentage.'),
      hookApiRow('maxSize', 'number | number[]', '88', 'Maximum pane size percentage.'),
      hookApiRow('direction', '"horizontal" | "vertical"', '"horizontal"', 'Resize axis and generated separator orientation.'),
      hookApiRow('resetOnDoubleClick', 'boolean', 'true', 'Reset panes to their default sizes on handle double-click.'),
      hookApiRow('onSizesChange', '(sizes: number[]) => void', '-', 'Callback fired when panes are resized.')
    ],
    controller: [
      hookApiRow('rootProps', 'LumenProps<"div">', '-', 'Spread onto the resizable root.'),
      hookApiRow('getPanelProps', '(index, props?) => LumenProps<"div">', '-', 'Returns data/style props for a pane.'),
      hookApiRow('getHandleProps', '(index, props?) => LumenProps<"button">', '-', 'Returns separator handle props with pointer and keyboard handlers.'),
      hookApiRow('sizes', 'number[]', '-', 'Current pane sizes as percentages.'),
      hookApiRow('resizePair', '(index, nextSize) => void', '-', 'Resize one pane and its following pane while honoring min/max.'),
      hookApiRow('reset', '() => void', '-', 'Reset to the normalized default sizes.')
    ],
    code: `import { Resizable } from '@santi020k/lumen-react'

export function SplitEditor() {
  return (
    <Resizable defaultSizes={[30, 70]}>
      <aside>Navigation</aside>
      <main>Editor</main>
    </Resizable>
  )
}`
  },
  {
    name: 'useThemeBuilder',
    description: 'Interactive theme builder with controllable hue, accent, mode (generated/manual), scheme (light/dark), color pickers, and export in CSS, Figma variables, or design token formats.',
    options: [
      hookApiRow('defaultHue', 'number', '210', 'Initial hue value.'),
      hookApiRow('hue', 'number', '-', 'Controlled hue.'),
      hookApiRow('onHueChange', '(hue: number) => void', '-', 'Callback when the hue changes.'),
      hookApiRow('defaultAccentHue', 'number', '-', 'Initial accent hue.'),
      hookApiRow('accentHue', 'number', '-', 'Controlled accent hue.'),
      hookApiRow('onAccentHueChange', '(hue: number) => void', '-', 'Callback when the accent hue changes.'),
      hookApiRow('defaultScheme', '"light" | "dark"', '"dark"', 'Initial color scheme.'),
      hookApiRow('scheme', '"light" | "dark"', '-', 'Controlled color scheme.'),
      hookApiRow('onSchemeChange', '(scheme) => void', '-', 'Callback when the scheme changes.'),
      hookApiRow('defaultMode', '"generated" | "manual"', '"generated"', 'Initial builder mode.'),
      hookApiRow('mode', '"generated" | "manual"', '-', 'Controlled builder mode.'),
      hookApiRow('defaultExportFormat', '"css" | "figma" | "tokens"', '"css"', 'Initial export format.'),
      hookApiRow('onThemeChange', '(detail: ThemeBuilderChangeDetail) => void', '-', 'Callback when any theme value changes.'),
      hookApiRow('onThemeExport', '(detail: ThemeBuilderExportDetail) => void', '-', 'Callback when the user exports the theme.')
    ],
    controller: [
      hookApiRow('rootProps', 'LumenProps<"section">', '-', 'Spread onto the theme builder root.'),
      hookApiRow('hueProps', 'LumenProps<"input">', '-', 'Spread onto the hue range input.'),
      hookApiRow('accentHueProps', 'LumenProps<"input">', '-', 'Spread onto the accent hue range input.'),
      hookApiRow('primaryColorProps', 'LumenProps<"input">', '-', 'Spread onto the primary color picker input.'),
      hookApiRow('secondaryColorProps', 'LumenProps<"input">', '-', 'Spread onto the secondary color picker input.'),
      hookApiRow('outputProps', 'LumenProps<"textarea">', '-', 'Spread onto the export output textarea.'),
      hookApiRow('exportButtonProps', 'LumenProps<"button">', '-', 'Spread onto the copy/export button.'),
      hookApiRow('getModeProps', '(mode, props?) => LumenProps<"button">', '-', 'Returns toggle props for a mode button.'),
      hookApiRow('getSchemeProps', '(scheme, props?) => LumenProps<"button">', '-', 'Returns toggle props for a scheme button.'),
      hookApiRow('getExportFormatProps', '(format, props?) => LumenProps<"button">', '-', 'Returns toggle props for an export format button.'),
      hookApiRow('previewStyle', 'CSSProperties', '-', 'Inline style object with generated CSS custom properties for live preview.'),
      hookApiRow('exportValue', 'string', '-', 'Current export string (CSS, Figma JSON, or design tokens JSON).'),
      hookApiRow('exportFormat', '"css" | "figma" | "tokens"', '-', 'Current export format.'),
      hookApiRow('tokens', 'LumenThemeTokens', '-', 'Current generated theme tokens.'),
      hookApiRow('copyExport', '() => Promise<string>', '-', 'Copy the export value to clipboard and return it.')
    ],
    code: `import { ThemeBuilder, Card, Button, Slider } from '@santi020k/lumen-react'
import { useThemeBuilder } from '@santi020k/lumen-react'

export function CustomThemeBuilder() {
  const builder = useThemeBuilder({
    defaultHue: 264,
    defaultScheme: 'dark',
    onThemeExport: ({ value, format }) =>
      console.log(\`Exported \${format}:\`, value)
  })

  return (
    <ThemeBuilder {...builder.rootProps}>
      <div style={builder.previewStyle}>
        <Card glass>
          <label>Brand hue</label>
          <input type="range" {...builder.hueProps} min={0} max={359} />
          <label>Accent hue</label>
          <input type="range" {...builder.accentHueProps} min={0} max={359} />
          <div>
            <Button {...builder.getSchemeProps('light')}>Light</Button>
            <Button {...builder.getSchemeProps('dark')}>Dark</Button>
          </div>
          <textarea {...builder.outputProps} readOnly rows={6} />
          <Button {...builder.exportButtonProps}>Copy CSS</Button>
        </Card>
      </div>
    </ThemeBuilder>
  )
}`
  }
]

// ---------------------------------------------------------------------------
// Elements API reference
// ---------------------------------------------------------------------------

export interface ElementsApiDoc {
  code: string
  description: string
  name: string
  rows: readonly ElementsApiRow[]
  type: 'enhancement' | 'event' | 'registration' | 'toast'
}

export interface ElementsApiRow {
  description: string
  name: string
  signature: string
}

const elementsRow = (
  name: string,
  signature: string,
  description: string
): ElementsApiRow => ({
  description,
  name,
  signature
})

export const elementsApiReference: ElementsApiDoc[] = [
  {
    name: 'defineLumenElements',
    type: 'registration',
    description: 'Registers all 79 Lumen web components in the custom element registry. Call once before using any <lumen-*> tags. Optionally pass a custom registry for scoped usage.',
    rows: [
      elementsRow('registry', 'CustomElementRegistry (optional)', 'Custom element registry to register against. Defaults to the global customElements.')
    ],
    code: `<script type="module">
  import { defineLumenElements } from '@santi020k/lumen-elements/define'

  defineLumenElements()
</script>

<lumen-card>
  <lumen-button>Click me</lumen-button>
</lumen-card>`
  },
  {
    name: 'enhanceLumenForms',
    type: 'enhancement',
    description: 'Enhances forms marked with [data-ui-form] with native constraint validation, custom error messages via data-error-* attributes, and field description syncing. Works without registering custom elements.',
    rows: [
      elementsRow('root', 'ParentNode (optional)', 'Root element to search for [data-ui-form] forms. Defaults to document.'),
      elementsRow('data-error-required', 'attribute', 'Custom message shown when a required field is empty.'),
      elementsRow('data-error-type', 'attribute', 'Custom message shown when the value does not match the input type (e.g. email).'),
      elementsRow('data-error-pattern', 'attribute', 'Custom message shown when the value does not match the pattern attribute.'),
      elementsRow('data-error-min / data-error-max', 'attribute', 'Custom message for range violations.')
    ],
    code: `<script type="module">
  import { enhanceLumenForms } from '@santi020k/lumen-elements/define'

  enhanceLumenForms()
</script>

<form data-ui-form>
  <label for="email">Email</label>
  <input
    id="email"
    type="email"
    required
    data-error-required="Please enter your email"
    data-error-type="Enter a valid email address"
    class="ui-input"
  />
  <button type="submit" class="ui-button ui-button--default">Sign up</button>
</form>`
  },
  {
    name: 'enhanceLumenCalendars',
    type: 'enhancement',
    description: 'Enhances elements marked with [data-ui-calendar] or <lumen-calendar> with generated date grids, hidden input values, month navigation, selection, min/max clamping, and keyboard focus.',
    rows: [
      elementsRow('root', 'ParentNode (optional)', 'Root element to search for calendars. Defaults to document.'),
      elementsRow('month', 'YYYY-MM', 'Visible month for generated calendars.'),
      elementsRow('value', 'YYYY-MM-DD', 'Initial selected date copied to the hidden input.'),
      elementsRow('min / max', 'YYYY-MM-DD', 'Inclusive selectable date bounds.'),
      elementsRow('name', 'attribute', 'Forwarded to the generated hidden input for form submission.')
    ],
    code: `<script type="module">
  import { enhanceLumenCalendars } from '@santi020k/lumen-elements/define'

  enhanceLumenCalendars()
</script>

<lumen-calendar
  max="2026-07-31"
  min="2026-07-01"
  month="2026-07"
  name="delivery"
></lumen-calendar>`
  },
  {
    name: 'enhanceLumenDateRangePickers',
    type: 'enhancement',
    description: 'Enhances elements marked with [data-ui-date-range-picker] so paired native date inputs keep min/max constraints in sync. Works without registering custom elements.',
    rows: [
      elementsRow('root', 'ParentNode (optional)', 'Root element to search for date range pickers. Defaults to document.'),
      elementsRow('input[type="date"]', 'native date inputs', 'The first date input is treated as the start date and the last date input is treated as the end date.')
    ],
    code: `<script type="module">
  import { enhanceLumenDateRangePickers } from '@santi020k/lumen-elements/define'

  enhanceLumenDateRangePickers()
</script>

<section data-ui-date-range-picker class="ui-date-range-picker">
  <input class="ui-input ui-date-picker" type="date" aria-label="Start date" />
  <input class="ui-input ui-date-picker" type="date" aria-label="End date" />
</section>`
  },
  {
    name: 'enhanceLumenInputOTPs',
    type: 'enhancement',
    description: 'Enhances elements marked with [data-ui-input-otp] or <lumen-input-otp> with a real native input, visual segments, sanitized input, paste handling, and caret navigation.',
    rows: [
      elementsRow('root', 'ParentNode (optional)', 'Root element to search for OTP fields. Defaults to document.'),
      elementsRow('length', 'attribute', 'Number of OTP segments to create. Defaults to 6.'),
      elementsRow('value', 'attribute', 'Initial value copied to the generated native input.'),
      elementsRow('name', 'attribute', 'Forwarded to the generated native input for form submission.')
    ],
    code: `<script type="module">
  import { enhanceLumenInputOTPs } from '@santi020k/lumen-elements/define'

  enhanceLumenInputOTPs()
</script>

<lumen-input-otp
  aria-label="Verification code"
  length="6"
  name="code"
></lumen-input-otp>`
  },
  {
    name: 'enhanceLumenResizable',
    type: 'enhancement',
    description: 'Enhances elements marked with [data-ui-resizable] with pane sizing, generated separator handles, pointer resizing, keyboard resizing, and double-click reset.',
    rows: [
      elementsRow('root', 'ParentNode (optional)', 'Root element to search for resizable groups. Defaults to document.'),
      elementsRow('data-ui-resizable-default-sizes', 'comma-separated percentages', 'Initial pane sizes normalized to 100%.'),
      elementsRow('data-ui-resizable-min-size', 'number or comma list', 'Minimum pane size percentage. Defaults to 12.'),
      elementsRow('data-ui-resizable-max-size', 'number or comma list', 'Maximum pane size percentage. Defaults to 88.'),
      elementsRow('data-orientation', '"horizontal" | "vertical"', 'Resize axis. Defaults to horizontal.')
    ],
    code: `<script type="module">
  import { enhanceLumenResizable } from '@santi020k/lumen-elements/define'

  enhanceLumenResizable()
</script>

<lumen-resizable data-ui-resizable-default-sizes="30,70">
  <aside>Navigation</aside>
  <main>Editor</main>
</lumen-resizable>`
  },
  {
    name: 'enhanceLumenRichTextEditors',
    type: 'enhancement',
    description: 'Enhances elements marked with [data-ui-rich-text-editor] with toolbar command execution via document.execCommand. Works without registering custom elements.',
    rows: [
      elementsRow('root', 'ParentNode (optional)', 'Root element to search for editors. Defaults to document.'),
      elementsRow('data-ui-command', 'attribute', 'Set on toolbar buttons to specify the command name (bold, italic, insertUnorderedList, etc.).')
    ],
    code: `<script type="module">
  import { enhanceLumenRichTextEditors } from '@santi020k/lumen-elements/define'

  enhanceLumenRichTextEditors()
</script>

<section data-ui-rich-text-editor class="ui-rich-text-editor">
  <div role="toolbar">
    <button data-ui-command="bold" class="ui-button ui-button--icon">B</button>
    <button data-ui-command="italic" class="ui-button ui-button--icon">I</button>
  </div>
  <div contenteditable data-ui-rich-text-editable>
    <p>Start writing...</p>
  </div>
</section>`
  },
  {
    name: 'LumenToast',
    type: 'toast',
    description: 'Global singleton toast API available after calling defineLumenElements(). Create, update, and dismiss toast notifications from anywhere.',
    rows: [
      elementsRow('create(detail)', '(ToastDetail) => string', 'Create a toast with title, description, variant, duration, placement, and optional action. Returns the toast id.'),
      elementsRow('dismiss(id?)', '(string?) => void', 'Dismiss a toast by id, or dismiss the most recent toast.'),
      elementsRow('update(id, detail)', '(string, ToastDetail) => void', 'Update an existing toast with new content.')
    ],
    code: `<script type="module">
  import { defineLumenElements, LumenToast } from '@santi020k/lumen-elements/define'

  defineLumenElements()

  document.querySelector('#notify').addEventListener('click', () => {
    LumenToast.create({
      title: 'Saved',
      description: 'Your changes are live.',
      variant: 'success',
      duration: 5000,
      placement: 'bottom-right'
    })
  })
</script>

<lumen-sonner aria-label="Notifications"></lumen-sonner>
<lumen-button id="notify">Show toast</lumen-button>`
  },
  {
    name: 'Custom events',
    type: 'event',
    description: 'Lumen elements dispatch CustomEvents that you can listen for on the document or on specific elements.',
    rows: [
      elementsRow('ui:toast', 'CustomEvent<ToastDetail>', 'Dispatched on document when a toast is created. Listen on document to handle toasts globally.'),
      elementsRow('ui:validate', 'CustomEvent<{ control, form, value }>', 'Dispatched during form validation for each control.'),
      elementsRow('ui:valid', 'CustomEvent<{ form, controls? }>', 'Dispatched when a form passes validation.'),
      elementsRow('ui:invalid', 'CustomEvent<{ form, control?, controls? }>', 'Dispatched when a form fails validation.'),
      elementsRow('ui:editor-command', 'CustomEvent<{ command }>', 'Dispatched when a rich text editor command is executed.'),
      elementsRow('ui:toast-action', 'CustomEvent<{ event?, value? }>', 'Dispatched when a toast action button is clicked.')
    ],
    code: `<script type="module">
  // Listen for toast events globally
  document.addEventListener('ui:toast', (event) => {
    console.log('Toast created:', event.detail.title)
  })

  // Listen for form validation events
  document.querySelector('form').addEventListener('ui:invalid', (event) => {
    console.log('Invalid controls:', event.detail.controls)
  })

  // Listen for rich text commands
  document.addEventListener('ui:editor-command', (event) => {
    console.log('Command executed:', event.detail.command)
  })
</script>`
  }
]
