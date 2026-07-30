import type { LumenComponentName } from '@santi020k/lumen-core'

export interface ComponentDoc {
  apiReference: ComponentApiRow[]
  name: string
  category: 'Actions' | 'Brand' | 'Data display' | 'Feedback' | 'Forms' | 'Layout' | 'Navigation' | 'Overlays'
  figmaNodeId?: string
  glass?: boolean
  guidance?: ComponentGuidance
  keyboardInteractions?: KeyboardInteractionRow[]
  runtimeEvents?: RuntimeEventRow[]
  summary: string
  example: string
}

interface ComponentGuidance {
  distinction?: string
  when: string
}

interface ComponentApiRow {
  attribute: string
  defaultValue: string
  description: string
  values: string
}

interface KeyboardInteractionRow {
  action: string
  key: string
}

export interface RuntimeEventRow {
  detail: string
  name: string
  target: string
  when: string
}

type ComponentDocTuple = readonly [name: string, category: ComponentDoc['category'], summary: string, example: string]

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
  ['yarn', 'yarn add'],
] as const

const buildInstallCommands = (...packages: string[]): InstallCommand[] =>
  packageManagerCommands.map(([label, command]) => ({
    command: `${command} ${packages.join(' ')}`,
    label,
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
    description: 'Use the stylesheet exported by your framework package in your main CSS entry.',
    label: 'Astro + Tailwind',
    lang: 'css',
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
    lang: 'astro',
  },
  {
    code: `import '@santi020k/lumen-react/styles.css'

import { createRoot } from 'react-dom/client'

import { App } from './App'`,
    description: 'Use this in a bundled app entry, such as main.tsx, main.ts, or client.ts.',
    label: 'App entry',
    lang: 'ts',
  },
]

export const themeSetups: ThemeSetup[] = [
  {
    code: `<html data-theme="light">
  <body>...</body>
</html>

<html data-theme="dark">
  <body>...</body>
</html>`,
    description:
      'Omit data-theme or set data-theme="light" for the default light theme; set data-theme="dark" for the built-in dark theme.',
    label: 'Default themes',
    lang: 'html',
  },
  {
    code: `const nextTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
  ? 'dark'
  : 'light'

document.documentElement.dataset.theme = nextTheme`,
    description:
      'Switch themes by updating document.documentElement.dataset.theme; components read the CSS variables from the root element.',
    label: 'Runtime switch',
    lang: 'ts',
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
    description:
      'These docs run santi020k-light and santi020k-dark, a custom theme family built on the same token contract. Copy the shape and adapt the values to your brand.',
    label: 'Custom theme',
    lang: 'css',
  },
]

export const glassSurfaceExamples: GlassSurfaceExample[] = [
  {
    code: `<Card glass>
  <h2>Launch window</h2>
  <p>Shared glass tokens.</p>
</Card>`,
    description: 'Use the glass prop for standalone content surfaces.',
    label: 'Astro card',
    lang: 'astro',
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
    lang: 'astro',
  },
  {
    code: `<lumen-card glass>
  <h2>Production</h2>
  <p>Same class contract.</p>
</lumen-card>`,
    description: 'Elements support glass with a boolean attribute.',
    label: 'Elements',
    lang: 'html',
  },
]

export const glassComponentNames = [
  'Alert',
  'AlertDialog',
  'Agenda',
  'Attachment',
  'BarChart',
  'Bubble',
  'Calendar',
  'Card',
  'Carousel',
  'Chart',
  'Command',
  'ContextMenu',
  'DataTable',
  'DatePicker',
  'Dialog',
  'Drawer',
  'DropdownMenu',
  'Empty',
  'Field',
  'HoverCard',
  'Item',
  'LineChart',
  'Menubar',
  'MessageScroller',
  'NavigationMenu',
  'PieChart',
  'Popover',
  'RichTextEditor',
  'ScrollArea',
  'Schedule',
  'Select',
  'Sheet',
  'Sidebar',
  'Table',
  'Tabs',
  'ThemeBuilder',
  'Toast',
  'Tree',
  'TreeGrid',
  'VirtualList',
] as const

const glassComponentNameSet = new Set<string>(glassComponentNames)
const glassApiComponentNameSet = new Set<string>(glassComponentNames)

export const figmaLibraryUrl = 'https://www.figma.com/design/luQW2pTQ3jGGxSFPAAsfa9'

const figmaNodeIdByComponent: Record<string, string> = {
  Accordion: '461:51',
  Affix: '288:27',
  Agenda: '53:76',
  Alert: '14:44',
  AlertDialog: '45:23',
  AnimatedLogo: '286:33',
  AspectRatio: '41:51',
  Attachment: '41:68',
  Autocomplete: '48:45',
  Avatar: '14:30',
  BackToTop: '274:15',
  Badge: '14:14',
  BarChart: '492:73',
  Breadcrumb: '67:67',
  Bubble: '41:29',
  Button: '6:69',
  ButtonGroup: '67:43',
  ButtonLink: '280:39',
  Calendar: '48:261',
  Callout: '281:4',
  Card: '14:27',
  Carousel: '53:56',
  Chart: '53:53',
  Checkbox: '15:6',
  Code: '53:28',
  Collapsible: '67:36',
  ColorPicker: '42:15',
  Combobox: '48:42',
  Command: '48:51',
  ContextMenu: '45:92',
  DataTable: '44:68',
  DatePicker: '48:264',
  DateRangePicker: '48:270',
  Dialog: '45:12',
  Direction: '51:127',
  Drawer: '45:34',
  DropdownMenu: '45:82',
  Empty: '41:40',
  Eyebrow: '253:6',
  Field: '14:22',
  FileUpload: '290:22',
  FloatingBadge: '272:39',
  FormattedDate: '259:6',
  GradientDivider: '250:7',
  HoverCard: '45:67',
  Icon: '216:6',
  Image: '261:7',
  Input: '14:21',
  InputGroup: '42:6',
  InputOTP: '40:76',
  Item: '44:12',
  Kbd: '69:23',
  Label: '69:18',
  LanguageToggle: '279:23',
  Link: '256:15',
  LineChart: '493:67',
  Marker: '41:20',
  Menubar: '45:100',
  Message: '51:53',
  MessageScroller: '51:56',
  Meter: '267:28',
  NativeSelect: '40:36',
  NavigationMenu: '45:109',
  Note: '282:23',
  NumberField: '42:11',
  Pagination: '67:75',
  Particles: '284:74',
  PhoneInput: '289:22',
  PieChart: '495:18',
  Pill: '271:36',
  Popover: '45:61',
  Progress: '264:18',
  RadioGroup: '48:284',
  Rating: '269:72',
  Resizable: '51:118',
  RichTextEditor: '53:114',
  Schedule: '53:91',
  ScrollArea: '44:17',
  ScrollProgress: '496:32',
  ScrollReveal: '285:44',
  SearchField: '40:18',
  Segmented: '291:28',
  Select: '48:24',
  Separator: '69:15',
  Sheet: '45:45',
  Sidebar: '51:99',
  Skeleton: '69:36',
  SkipLink: '276:13',
  Slider: '42:17',
  Sparkline: '490:46',
  Spinner: '69:64',
  Switch: '15:11',
  Table: '44:39',
  Tabs: '15:12',
  TagGroup: '48:298',
  Textarea: '40:16',
  ThemeBuilder: '53:126',
  ThemeToggle: '278:33',
  TimeField: '42:13',
  Toast: '51:30',
  Toggle: '40:11',
  ToggleGroup: '67:52',
  Tooltip: '45:73',
  Tree: '51:130',
  TreeGrid: '51:143',
  Typography: '53:10',
  VirtualList: '44:24',
  Watermark: '287:19',
}

export const getFigmaComponentUrl = (nodeId?: string) =>
  nodeId ? `${figmaLibraryUrl}?node-id=${nodeId.replace(':', '-')}` : figmaLibraryUrl

export interface ComponentCollection {
  description: string
  names: readonly string[]
  title: string
}

export const componentCollections: ComponentCollection[] = [
  {
    title: 'Buttons and actions',
    description: 'Choose navigation, action, grouped, or compact floating controls.',
    names: ['Button', 'ButtonLink', 'ButtonGroup', 'Toggle', 'ToggleGroup', 'Toolbar', 'SpeedDial'],
  },
  {
    title: 'Text entry',
    description: 'Start with Input, then choose a purpose-built field only when the data needs it.',
    names: ['Input', 'Textarea', 'SearchField', 'NumberField', 'PhoneInput', 'InputOTP', 'Mentions'],
  },
  {
    title: 'Selection controls',
    description: 'Compare native, custom, binary, grouped, and hierarchical selection patterns.',
    names: [
      'NativeSelect',
      'Select',
      'Combobox',
      'Autocomplete',
      'Cascader',
      'TreeSelect',
      'Checkbox',
      'RadioGroup',
      'Switch',
      'Segmented',
    ],
  },
  {
    title: 'Dates and time',
    description: 'Pick a calendar surface or a focused single-value, range, or time input.',
    names: ['Calendar', 'DatePicker', 'DateRangePicker', 'TimeField'],
  },
  {
    title: 'Dialogs and contextual layers',
    description: 'Match the layer to the task: blocking, edge-mounted, anchored, or explanatory.',
    names: ['Dialog', 'AlertDialog', 'Sheet', 'Drawer', 'Popover', 'HoverCard', 'Tooltip', 'Popconfirm', 'Tour'],
  },
  {
    title: 'Menus and commands',
    description: 'Use application menus, contextual actions, navigation, or searchable commands.',
    names: ['DropdownMenu', 'ContextMenu', 'Menubar', 'NavigationMenu', 'Command'],
  },
  {
    title: 'Status and messaging',
    description: 'Separate persistent guidance, inline status, empty states, and transient notifications.',
    names: ['Alert', 'Callout', 'Note', 'Empty', 'Message', 'ScrollProgress', 'Toast'],
  },
  {
    title: 'Structured data',
    description: 'Choose the lightest structure that supports the required hierarchy and interaction.',
    names: ['Descriptions', 'Table', 'DataTable', 'Tree', 'TreeGrid', 'VirtualList'],
  },
  {
    title: 'Data visualization',
    description:
      'Match compact metrics, custom plots, categorical comparisons, ordered trends, and part-to-whole breakdowns to the question.',
    names: ['Stat', 'Meter', 'Sparkline', 'Chart', 'BarChart', 'LineChart', 'PieChart'],
  },
  {
    title: 'Disclosure and navigation',
    description: 'Organize related content with progressive disclosure or local navigation.',
    names: ['Accordion', 'Collapsible', 'Tabs', 'Breadcrumb', 'Pagination', 'Stepper', 'Anchor'],
  },
]

export const frameworkSetups: FrameworkSetup[] = [
  {
    id: 'astro',
    installCommands,
    label: 'Astro',
    lang: 'astro',
    note: 'With the stylesheet loaded globally, import components where you use them. Mount UIPrimitives once in your root layout only if you use interactive primitives; do not add it beside every component.',
    packageName: '@santi020k/lumen-astro',
    usage: astroUsage,
  },
  {
    id: 'react',
    installCommands: buildInstallCommands('@santi020k/lumen-react'),
    label: 'React',
    lang: 'tsx',
    note: 'Install the React package, load its stylesheet once, then import primitives directly. React ships the same styled markup and data contract, including data-display, overlay, form, rich text, and schedule attributes; use hooks for behavior-heavy primitives.',
    packageName: '@santi020k/lumen-react',
    usage: reactUsage,
  },
  {
    id: 'elements',
    installCommands: buildInstallCommands('@santi020k/lumen-elements'),
    label: 'Elements',
    lang: 'html',
    note: 'Install the Elements package, load its stylesheet once, register Lumen elements, and use lumen-* tags anywhere HTML is valid. Behavior-backed elements include overlays, context menus, advanced selection, file upload, tours, mentions, forms, rich text, schedule, toast, DataTable, ThemeBuilder, and VirtualList.',
    packageName: '@santi020k/lumen-elements',
    usage: elementsUsage,
  },
]

export const frameworkPackages = [
  [
    'Astro',
    '@santi020k/lumen-astro',
    'Reference',
    'Reference implementation of the full primitive catalog, shared CSS, and progressive-enhancement runtime.',
  ],
  [
    'React',
    '@santi020k/lumen-react',
    'Full catalog',
    'React implementation of the full primitive catalog using the shared class, token, and data contract.',
  ],
  [
    'Elements',
    '@santi020k/lumen-elements',
    'Full catalog',
    'Standards-based implementation of the full primitive catalog using the shared class, token, and data contract.',
  ],
  [
    'Core',
    '@santi020k/lumen-core',
    'Shared foundation',
    'Design tokens, component metadata, and utilities shared by every framework implementation.',
  ],
] as const

export const frameworkGuides = [
  {
    body: [
      'Reference implementation for markup, props, standalone CSS, and progressive enhancement.',
      'Mount UIPrimitives once in the root layout for interactive primitives and CustomEvents.',
      'Use lumen add Component or lumen add recipe-name --target astro when you want local .astro starter files.',
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
    title: 'Astro',
  },
  {
    body: [
      'React components mirror the same ui-* classes, data attributes, and prop names where React naming allows it.',
      'DataTable renders the same structured row contract and VirtualList emits the shared sizing attributes for app-level adapters.',
      'Use React hooks such as useDialog, usePopover, useDropdownMenu, useContextMenu, useTabs, useSelect, useFormValidation, useCalendar, useInputOTP, useDateRangePicker, useRichTextEditor, useSchedule, useResizable, useThemeBuilder, useToast, and useTooltip for behavior-heavy primitives.',
      'Use lumen add Component --target react or lumen add recipe-name --target react when you want local .tsx starter files.',
    ],
    code: `import '@santi020k/lumen-react/styles.css'
import { Button, Card, useDialog } from '@santi020k/lumen-react'

export function Actions() {
  const dialog = useDialog()

  return <Card><Button {...dialog.triggerProps}>Open</Button></Card>
}`,
    id: 'react',
    lang: 'tsx',
    packageName: '@santi020k/lumen-react',
    title: 'React',
  },
  {
    body: [
      'Custom elements expose the shared class and data contract through lumen-* tags that work in plain HTML or any framework.',
      'Call defineLumenElements once before using the tags; behavior-backed elements include DataTable selection/sort, form validation, calendar grids, OTP segmentation, date range syncing, rich text commands, context menu triggers, schedule drag/drop and file drag/drop, tours, anchor scroll spy, transfer, mentions, cascader and tree selection, resizable pane sizing, ThemeBuilder export, VirtualList range events, overlays, tabs, tooltip, and toast.',
      'Use lumen add Component --target elements or lumen add recipe-name --target elements when you want local Elements starter files.',
    ],
    code: `<script type="module">
  import { defineLumenElements } from '@santi020k/lumen-elements/define'
  import '@santi020k/lumen-elements/styles.css'

  defineLumenElements()
</script>

<lumen-card><lumen-button>Save</lumen-button></lumen-card>`,
    id: 'elements',
    lang: 'html',
    packageName: '@santi020k/lumen-elements',
    title: 'Elements',
  },
] as const

export const runtimeFeatures = [
  ['Dialogs and sheets', 'Trigger, dismiss, escape-key, and focus behavior for modal surfaces.'],
  ['Menus and popovers', 'Lightweight disclosure patterns for contextual actions and floating content.'],
  ['Tabs and command lists', 'Progressively enhanced keyboard navigation and client-side filtering.'],
  ['Toasts and carousel controls', 'Document-level behavior for transient feedback and slide navigation.'],
] as const

const apiRow = (attribute: string, values: string, defaultValue: string, description: string): ComponentApiRow => ({
  attribute,
  defaultValue,
  description,
  values,
})

const commonApiRows = [
  apiRow('class, className', 'string', '""', 'Merges custom classes with the generated ui-* root classes.'),
  apiRow(
    '...native attributes',
    'HTML attributes',
    '-',
    'Forwards standard attributes to the root element unless the component consumes them.',
  ),
] as const

const surfaceApiRow = apiRow(
  'surface',
  '"default" | "glass"',
  '"default"',
  'Deprecated alias for glass; surface="glass" maps to glass={true}.',
)

const glassApiRow = apiRow(
  'glass',
  'boolean | "subtle" | "strong"',
  'false',
  'Applies the tokenized liquid-glass surface treatment with backdrop-filter fallbacks; "subtle" and "strong" adjust the fill intensity.',
)

const disclosureTriggerApiRow = apiRow(
  'data-ui-trigger',
  'boolean attribute',
  '-',
  'Marks the child trigger that opens and closes the adjacent disclosure panel.',
)

const dialogTriggerApiRows = (name: string) =>
  [
    apiRow('id', 'string', '-', 'Connects the dialog surface to a matching trigger attribute value.'),
    apiRow(`data-ui-${name}-trigger`, 'target id', '-', 'Marks an external trigger and points it at the dialog id.'),
    apiRow(`data-ui-${name}-close`, 'boolean attribute', '-', 'Marks a child control that closes the nearest dialog.'),
  ] as const

const keyboardRows = (...rows: [key: string, action: string][]): KeyboardInteractionRow[] =>
  rows.map(([key, action]) => ({ action, key }))

const disclosureKeyboardInteractions = keyboardRows(
  ['ArrowDown, Enter, Space on trigger', 'Open the panel and move focus to the first focusable item.'],
  ['Escape in panel', 'Close the panel and return focus to the trigger.'],
  ['ArrowDown, ArrowUp in panel', 'Move focus through focusable panel items, wrapping at the ends.'],
  ['Home, End in panel', 'Move focus to the first or last focusable panel item.'],
)

const rovingGroupKeyboardInteractions = keyboardRows(
  ['ArrowRight, ArrowDown', 'Move roving focus to the next item, wrapping at the end.'],
  ['ArrowLeft, ArrowUp', 'Move roving focus to the previous item, wrapping at the start.'],
  ['Home, End', 'Move roving focus to the first or last item.'],
)

const keyboardInteractionsByComponent: Partial<Record<string, readonly KeyboardInteractionRow[]>> = {
  Calendar: keyboardRows(
    [
      'Enter, Space on a day',
      'Select the focused day, update the hidden input, and dispatch native input and change events from that input.',
    ],
    ['ArrowRight, ArrowLeft', 'Move day focus by one day.'],
    ['ArrowDown, ArrowUp', 'Move day focus by one week.'],
    ['Home, End', 'Move focus to the first or last day in the current week row.'],
    ['PageDown, PageUp', 'Move focus to the same date in the next or previous month.'],
  ),
  CodeTabs: keyboardRows(
    ['ArrowRight', 'Activate and focus the next code example, wrapping at the end.'],
    ['ArrowLeft', 'Activate and focus the previous code example, wrapping at the start.'],
    ['Home, End', 'Activate and focus the first or last code example.'],
  ),
  Combobox: keyboardRows(
    ['Escape in input or option', 'Close the listbox. Escape on an option also returns focus to the input.'],
    ['ArrowDown, ArrowUp in input', 'Open the listbox and move focus to the first or last visible option.'],
    ['Enter in input', 'Select the first visible option.'],
    ['Enter, Space on an option', 'Select the focused option.'],
    ['ArrowDown, ArrowUp on an option', 'Move focus through visible options, wrapping at the ends.'],
    ['Home, End on an option', 'Move focus to the first or last visible option.'],
  ),
  ContextMenu: keyboardRows(
    [
      'ContextMenu, Shift+F10 on trigger',
      'Open the linked menu near the trigger and focus the first focusable menu item.',
    ],
    ['Escape in menu', 'Close the menu and return focus to the trigger.'],
    ['ArrowDown, ArrowUp in menu', 'Move focus through focusable menu items, wrapping at the ends.'],
    ['Home, End in menu', 'Move focus to the first or last focusable menu item.'],
  ),
  DatePicker: keyboardRows(
    ['Enter, Space on trigger', 'Open the calendar popover.'],
    ['ArrowDown on trigger', 'Open the calendar and move focus to the selected day, today, or first available day.'],
    ['Arrow keys in calendar', 'Move focus by day or week without opening a browser-native date picker.'],
    ['PageDown, PageUp in calendar', 'Move to the same date in the next or previous month.'],
    ['Enter, Space on a day', 'Select the focused date, close the popover, and return focus to the trigger.'],
    ['Escape', 'Close the calendar without changing the value and return focus to the trigger.'],
  ),
  DropdownMenu: disclosureKeyboardInteractions,
  InputOTP: keyboardRows(
    [
      'ArrowLeft, ArrowRight',
      'Move the native input selection one position left or right and sync the visible segments.',
    ],
    [
      'Home, End',
      'Move the native input selection to the start or end of the current value and sync the visible segments.',
    ],
  ),
  Menubar: rovingGroupKeyboardInteractions,
  NavigationMenu: rovingGroupKeyboardInteractions,
  RadioGroup: rovingGroupKeyboardInteractions,
  Resizable: keyboardRows(
    [
      'ArrowLeft, ArrowRight on a horizontal handle',
      'Resize the leading panel by 2 percentage points, or 10 with Shift held.',
    ],
    [
      'ArrowUp, ArrowDown on a vertical handle',
      'Resize the leading panel by 2 percentage points, or 10 with Shift held.',
    ],
    ['Home, End on a handle', 'Resize the leading panel to its configured minimum or maximum size.'],
  ),
  Select: keyboardRows(
    [
      'Printable key on trigger or option',
      'Open the listbox and focus the next enabled option whose text starts with the typed buffer.',
    ],
    ['Escape on trigger or option', 'Close the listbox. Escape on an option also returns focus to the trigger.'],
    ['ArrowDown, ArrowUp on trigger', 'Open the listbox and focus the next or previous enabled option.'],
    ['Home, End on trigger', 'Open the listbox and focus the first or last enabled option.'],
    ['Enter, Space on trigger', 'Open the listbox and focus the selected option, or the first enabled option.'],
    [
      'Enter, Space on an option',
      'Select the focused option, sync the native select, and dispatch native input and change events from the select.',
    ],
    ['ArrowDown, ArrowUp on an option', 'Move focus through enabled options, wrapping at the ends.'],
    ['Home, End on an option', 'Move focus to the first or last enabled option.'],
  ),
  SpeedDial: keyboardRows(
    ['Enter, Space on trigger', 'Open or close the action menu.'],
    ['Arrow keys on trigger', 'Open the menu and move focus to its first or last action.'],
    ['Arrow keys in menu', 'Move focus through actions, wrapping at either end.'],
    ['Home, End in menu', 'Move focus to the first or last action.'],
    ['Escape', 'Close the action menu and return focus to the trigger.'],
  ),
  Tabs: keyboardRows(
    ['ArrowRight', 'Activate and focus the next tab, wrapping at the end.'],
    ['ArrowLeft', 'Activate and focus the previous tab, wrapping at the start.'],
    ['Home, End', 'Activate and focus the first or last tab.'],
  ),
  Toast: keyboardRows(['Escape in a toast', 'Dismiss the focused toast.']),
  ToggleGroup: rovingGroupKeyboardInteractions,
}

export const runtimeEvents: RuntimeEventRow[] = [
  {
    detail: '{ from: string, to: string, values: string[] }',
    name: 'ui:transfer-change',
    target: 'Transfer root ([data-ui-transfer])',
    when: 'Fires after checked items move between the source and target collections.',
  },
  {
    detail: '{ value: string }',
    name: 'ui:cascader-change',
    target: 'Cascader root ([data-ui-cascader])',
    when: 'Fires after a leaf option is selected and committed to the hidden input.',
  },
  {
    detail: '{ value: string }',
    name: 'ui:tree-select-change',
    target: 'TreeSelect root ([data-ui-tree-select])',
    when: 'Fires after a tree item is selected and committed to the hidden input.',
  },
  {
    detail: '{ values: string[] }',
    name: 'ui:data-table-selection-change',
    target: 'DataTable root ([data-ui-datatable])',
    when: 'Fires after a selectable DataTable row checkbox, select-all checkbox, or form reset changes the selected row values.',
  },
  {
    detail: '{ values: string[] }',
    name: 'ui:datatable-selection-change',
    target: 'DataTable root ([data-ui-datatable])',
    when: 'Deprecated compatibility alias for ui:data-table-selection-change; planned for removal in Lumen 1.0.',
  },
  {
    detail: '{ eventId: string | undefined, slot: string | undefined }',
    name: 'ui:schedule-change',
    target: 'Schedule root ([data-ui-schedule])',
    when: 'Fires after a draggable schedule event is dropped on a [data-ui-schedule-slot] drop zone.',
  },
  {
    detail: '{ startIndex: number, endIndex: number }',
    name: 'ui:virtual-list-range',
    target: 'VirtualList root ([data-ui-virtual-list])',
    when: 'Fires when the virtual list calculates its visible range on initialization or scroll.',
  },
  {
    detail: '{ value: string | undefined }',
    name: 'ui:tag-remove',
    target: 'TagGroup root (.ui-tag-group or [data-ui-tag-group])',
    when: 'Fires after a [data-ui-tag-remove] control removes its closest tag or list item.',
  },
  {
    detail: '{ command: string, executed: boolean, value?: string }',
    name: 'ui:editor-command',
    target: 'RichTextEditor root ([data-ui-rich-text-editor])',
    when: 'Fires after a toolbar control or keyboard shortcut runs an editor command.',
  },
  {
    detail: '{ html: string, text: string }',
    name: 'ui:editor-change',
    target: 'RichTextEditor root ([data-ui-rich-text-editor])',
    when: 'Fires after editable content changes or an editor command runs.',
  },
  {
    detail: '{ storageKey?: string, value: string }',
    name: 'ui:tabs-change',
    target: 'Tabs root ([data-ui-tabs])',
    when: 'Fires after pointer or keyboard activation changes the selected tab.',
  },
  {
    detail: '{ previousTheme?: string, storageKey: string, theme: string }',
    name: 'ui:theme-change',
    target: 'ThemeToggle control ([data-ui-theme-toggle])',
    when: 'Fires after ThemeToggle applies and persists a new document theme.',
  },
  {
    detail:
      "{ hue: number, accentHue: number, mode: 'generated' | 'manual', scheme: 'dark' | 'light', tokens: Record<string, string> }",
    name: 'ui:theme-change',
    target: 'ThemeBuilder root ([data-ui-theme-builder])',
    when: 'Fires after ThemeBuilder hue, manual color, mode, or scheme controls update theme tokens on the target element.',
  },
  {
    detail:
      "{ css?: string, format: 'css' | 'figma' | 'tokens', tokens: Record<string, string> | null, value: string }",
    name: 'ui:theme-export',
    target: 'ThemeBuilder root ([data-ui-theme-builder])',
    when: 'Fires after a [data-ui-theme-export] control writes the selected CSS, Figma, or design-token export to the output and clipboard when available.',
  },
  {
    detail:
      '{ control: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement, form: HTMLFormElement, value: string }',
    name: 'ui:validate',
    target: 'Form ([data-ui-form])',
    when: 'Fires before the runtime reads native validity so custom validators can call control.setCustomValidity(message).',
  },
  {
    detail: '{ control?: HTMLElement, controls?: HTMLElement[], form: HTMLFormElement }',
    name: 'ui:invalid',
    target: 'Form ([data-ui-form])',
    when: 'Fires after blur or submit validation finds one or more invalid controls.',
  },
  {
    detail: '{ control?: HTMLElement, controls?: HTMLElement[], form: HTMLFormElement }',
    name: 'ui:valid',
    target: 'Form ([data-ui-form])',
    when: 'Fires after blur or submit validation finds the checked control or form valid.',
  },
  {
    detail:
      '{ id?: string, title?: string, description?: string, variant?: string, duration?: number, placement?: string, action?: { label: string } }',
    name: 'ui:toast',
    target: 'Document',
    when: 'Creates a programmatic toast in the matching notification viewport.',
  },
  {
    detail: '{ id: string, title?: string, description?: string, variant?: string, duration?: number }',
    name: 'ui:toast-update',
    target: 'Document',
    when: 'Updates a programmatic toast created by ui:toast or window.LumenToast.create(detail).',
  },
  {
    detail: '{ id?: string }',
    name: 'ui:toast-dismiss',
    target: 'Document',
    when: 'Dismisses one programmatic toast by id, or all runtime toasts when id is omitted.',
  },
  {
    detail: '{ id: string, value?: unknown }',
    name: 'ui:toast-action',
    target: 'Toast ([data-ui-toast])',
    when: 'Fires after a programmatic toast action button is pressed unless the action specifies a custom event name.',
  },
]

const runtimeEventsByComponent: Partial<Record<string, readonly RuntimeEventRow[]>> = {
  DataTable: runtimeEvents.filter(
    (event) => event.name === 'ui:data-table-selection-change' || event.name === 'ui:datatable-selection-change',
  ),
  Field: runtimeEvents.filter(
    (event) => event.name === 'ui:validate' || event.name === 'ui:invalid' || event.name === 'ui:valid',
  ),
  RichTextEditor: runtimeEvents.filter((event) => event.name.startsWith('ui:editor-')),
  Schedule: runtimeEvents.filter((event) => event.name === 'ui:schedule-change'),
  TagGroup: runtimeEvents.filter((event) => event.name === 'ui:tag-remove'),
  ThemeBuilder: runtimeEvents.filter((event) => event.name === 'ui:theme-change' || event.name === 'ui:theme-export'),
  Toast: runtimeEvents.filter(
    (event) =>
      event.name === 'ui:toast' ||
      event.name === 'ui:toast-update' ||
      event.name === 'ui:toast-dismiss' ||
      event.name === 'ui:toast-action',
  ),
  VirtualList: runtimeEvents.filter((event) => event.name === 'ui:virtual-list-range'),
}

const apiReferenceByComponent = {
  Accordion: [
    apiRow(
      'variant',
      '"default" | "flush"',
      '"default"',
      'Uses bordered cards by default or a compact, divider-led list with flush.',
    ),
  ],
  Agenda: [
    apiRow(
      'children',
      'Astro slot | ReactNode | child nodes',
      'required',
      'Provides the chronological headings and semantic event list rendered inside the agenda surface.',
    ),
  ],
  Alert: [
    apiRow('variant', '"default" | "destructive" | "success" | "warning"', '"default"', 'Controls the alert tone.'),
  ],
  AlertDialog: [surfaceApiRow, ...dialogTriggerApiRows('alert-dialog')],
  AspectRatio: [
    apiRow(
      'ratio',
      'number | string',
      '"16 / 9"',
      'Sets the preferred CSS aspect-ratio value; invalid values fall back to 16 / 9.',
    ),
  ],
  Attachment: [
    apiRow('href', 'string', '-', 'Renders the root as a link when provided; otherwise renders an article.'),
  ],
  Autocomplete: [
    apiRow('list', 'string', 'required', 'Connects the search input to a datalist id.'),
    apiRow('type', 'HTML input type', '"search"', 'Sets the native input type.'),
  ],
  Avatar: [
    apiRow('src', 'string', '-', 'Shows an image when present.'),
    apiRow('alt', 'string', '""', 'Accessible text for the image.'),
    apiRow('fallback', 'string', '-', 'Fallback text shown when no image source is provided.'),
  ],
  AnimatedLogo: [
    apiRow(
      'children',
      'inline SVG',
      'required',
      'Wraps any inline SVG logo and applies the reveal animation without changing its artwork.',
    ),
    apiRow(
      'animation',
      '"reveal" | "sequence"',
      '"reveal"',
      'Uses a whole-logo reveal, or enables opt-in pop, draw, and reveal hooks inside the SVG.',
    ),
    apiRow(
      'data-ui-logo-pop, data-ui-logo-draw, data-ui-logo-reveal',
      'SVG attributes',
      '-',
      'Marks SVG layers for the matching effect when animation="sequence".',
    ),
    apiRow('--ui-animated-logo-duration', 'CSS time', '"700ms"', 'Customizes the reveal duration.'),
    apiRow('--ui-animated-logo-delay', 'CSS time', '"0ms"', 'Delays the reveal for coordinated compositions.'),
  ],
  AnimatedPortrait: [
    apiRow('src', 'ImageMetadata | string', 'required', 'Sets the portrait image source.'),
    apiRow('alt', 'string', 'required', 'Provides the portrait image accessible text.'),
    apiRow(
      'showFloatingBadges',
      'boolean',
      'false',
      'Shows the optional experience and location facts around the portrait.',
    ),
    apiRow(
      'badgeProps',
      '{ experience?, location? }',
      '-',
      'Customizes the labels and values used by the floating facts.',
    ),
    apiRow(
      'widths, sizes',
      'number[]; string',
      'responsive defaults',
      'Controls responsive image candidate generation and selection.',
    ),
  ],
  BackToTop: [
    apiRow('type', '"button" | "submit" | "reset"', '"button"', 'Sets the native button type.'),
    apiRow(
      'data-ui-back-to-top',
      'boolean attribute',
      'generated',
      'Marks the button for scroll-to-top behavior from the UIPrimitives runtime.',
    ),
  ],
  Badge: [
    apiRow(
      'variant',
      '"default" | "secondary" | "outline" | "destructive" | "success" | "warning"',
      '"default"',
      'Controls the badge tone.',
    ),
  ],
  BarChart: [
    apiRow(
      'series',
      'LumenChartSeries[]',
      'required',
      'Provides already-aggregated categorical values and stable series metadata.',
    ),
    apiRow(
      'orientation',
      '"horizontal" | "vertical"',
      '"vertical"',
      'Controls whether values extend across the x or y axis.',
    ),
    apiRow(
      'layout',
      '"grouped" | "stacked"',
      '"grouped"',
      'Places series beside one another or combines their positive and negative totals.',
    ),
    apiRow('showLegend', 'boolean', 'true for multiple series', 'Shows the color-independent series key.'),
    apiRow('showTable', 'boolean', 'true', 'Provides a revealable semantic table containing every plotted value.'),
    apiRow(
      'heading, description, caption',
      'string',
      '-',
      'Adds visible chart context without replacing the accessible name.',
    ),
  ],
  Bubble: [
    apiRow('from', '"assistant" | "user"', '"assistant"', 'Aligns and styles the bubble for the message author.'),
  ],
  Breadcrumb: [
    apiRow(
      'children',
      '<ol><li>...</li></ol>',
      'required',
      'Use an ordered list inside the nav and set aria-current="page" on the final item.',
    ),
  ],
  Button: [
    apiRow(
      'variant',
      '"default" | "secondary" | "outline" | "ghost" | "link" | "destructive"',
      '"default"',
      'Controls the button emphasis.',
    ),
    apiRow(
      'size',
      '"default" | "sm" | "lg" | "icon"',
      '"default"',
      'Controls button height, padding, and icon-only sizing.',
    ),
    apiRow(
      'loading',
      'boolean',
      'false',
      'Shows a spinner, sets aria-busy, and blocks pointer interaction while pending.',
    ),
    apiRow('type', '"button" | "submit" | "reset"', '"button"', 'Sets the native button type.'),
  ],
  ButtonGroup: [
    apiRow(
      'children',
      'button controls',
      'required',
      'Groups related actions while preserving each child button’s native semantics.',
    ),
  ],
  ButtonLink: [
    apiRow('href', 'string', '-', 'Sets the link destination.'),
    apiRow(
      'variant',
      '"primary" | "secondary" | "ghost" | "inline" | "unstyled"',
      '"primary"',
      'Controls the link emphasis or removes presentation for migration use.',
    ),
    apiRow('shape', '"default" | "icon"', '"default"', 'Renders a round icon-only link when set to "icon".'),
    apiRow('showArrow', 'boolean', 'false', 'Appends a directional arrow icon.'),
    apiRow('newTab', 'boolean', 'false', 'Opens the link in a new tab with safe rel attributes.'),
  ],
  Card: [
    apiRow('as', '"div" | "article" | "section"', '"div"', 'Changes the rendered HTML element.'),
    apiRow(
      'variant',
      '"default" | "muted" | "interactive" | "glass" | "unstyled"',
      '"default"',
      'Controls the card surface and affordance; unstyled keeps only semantics and hooks.',
    ),
  ],
  CardContent: [
    apiRow(
      'as',
      '"div" | "section"',
      '"div"',
      'Changes the content wrapper without imposing section semantics by default.',
    ),
    apiRow('data-slot', '"card-content"', 'generated', 'Provides the stable public styling hook for the card body.'),
  ],
  CardDescription: [
    apiRow('as', '"div" | "p"', '"div"', 'Uses a paragraph only when the supplied content is phrasing content.'),
    apiRow(
      'data-slot',
      '"card-description"',
      'generated',
      'Provides the stable public styling hook for supporting copy.',
    ),
  ],
  CardFooter: [
    apiRow(
      'as',
      '"div" | "footer"',
      '"div"',
      'Uses a footer landmark only when the card content has matching sectioning semantics.',
    ),
    apiRow('data-slot', '"card-footer"', 'generated', 'Provides the stable public styling hook for card actions.'),
  ],
  CardHeader: [
    apiRow(
      'as',
      '"div" | "header"',
      '"div"',
      'Uses a header only when the card content has matching sectioning semantics.',
    ),
    apiRow(
      'data-slot',
      '"card-header"',
      'generated',
      'Provides the stable public styling hook for introductory content.',
    ),
  ],
  CardTitle: [
    apiRow(
      'as',
      '"div" | "h2" | "h3" | "h4"',
      '"div"',
      'Lets the consumer choose the heading level that matches the page hierarchy.',
    ),
    apiRow('data-slot', '"card-title"', 'generated', 'Provides the stable public styling hook for the card title.'),
  ],
  Calendar: [
    apiRow('disabled', 'boolean', 'false', 'Disables month navigation, date selection, and the hidden form input.'),
    apiRow('max', 'YYYY-MM-DD string', '-', 'Disables dates after the inclusive maximum date.'),
    apiRow('min', 'YYYY-MM-DD string', '-', 'Disables dates before the inclusive minimum date.'),
    apiRow('month', 'YYYY-MM string', 'current or selected month', 'Sets the initially visible month.'),
    apiRow('name', 'string', '-', 'Sets the name of the hidden input that stores the selected ISO date.'),
    apiRow('value', 'YYYY-MM-DD string', '""', 'Sets the selected date and hidden input value.'),
  ],
  Callout: [
    apiRow(
      'children',
      'phrasing or flow content',
      'required',
      'Provides the emphasized explanation, caveat, or instruction.',
    ),
  ],
  Carousel: [
    apiRow('data-ui-carousel-viewport', 'boolean attribute', '-', 'Marks the scrollable slide viewport.'),
    apiRow(
      'data-ui-carousel-prev, data-ui-carousel-next',
      'boolean attribute',
      '-',
      'Marks child controls that move the viewport backward or forward.',
    ),
  ],
  Chart: [
    apiRow(
      'children',
      'custom SVG, canvas, HTML plot, and optional table',
      'required',
      'Composes a specialized visualization while the consumer owns its data and accessible description.',
    ),
    apiRow(
      'heading, description, value',
      'string',
      '-',
      'Builds the standard visible chart header without consuming the native title attribute.',
    ),
    apiRow('caption', 'string', '-', 'Adds a semantic figcaption after the custom plot.'),
  ],
  Checkbox: [
    apiRow('checked, defaultChecked', 'boolean', '-', 'Uses the native checkbox checked state.'),
    apiRow('type', '"checkbox"', '"checkbox"', 'Fixed by the component.'),
  ],
  CheckboxGroup: [
    apiRow('legend', 'string', '-', 'Adds the fieldset legend that names the checkbox collection.'),
    apiRow('orientation', '"horizontal" | "vertical"', '"vertical"', 'Controls the visual arrangement of the options.'),
    apiRow('invalid', 'boolean', 'false', 'Exposes the invalid group state to assistive technology and styling hooks.'),
  ],
  Code: [
    apiRow('variant', '"inline" | "block"', '"inline"', 'Switches between inline code and a framed code block.'),
    apiRow('code', 'string', '-', 'Renders normalized multiline code with semantic, theme-token-based syntax colors.'),
    apiRow(
      'language',
      'string',
      '-',
      'Labels and highlights JavaScript, TypeScript, JSON, YAML, Bash, Astro/HTML, Markdown, Lua, and SQL families. Unsupported languages remain readable plaintext.',
    ),
    apiRow('label', 'string', '-', 'Adds a compact filename or title to the block header.'),
    apiRow('copy', 'boolean', 'false', 'Shows a copy button when UIPrimitives is mounted.'),
    apiRow(
      'highlighted',
      'boolean',
      'false',
      'Allows a pre-highlighted pre/code tree, such as Shiki output, to render directly.',
    ),
    apiRow('theme', '"auto" | "lumen" | "santi020k"', '"auto"', 'Selects the code palette family.'),
    apiRow(
      'wrap',
      'boolean',
      'false',
      'Wraps long block-code lines instead of requiring horizontal scrolling; code blocks also stay within their flex or grid container.',
    ),
  ],
  CodeTabs: [
    apiRow(
      'items',
      'Array<{ code, label, language?, value }>',
      'required',
      'Defines the labelled code examples and their stable selection values.',
    ),
    apiRow('ariaLabel', 'string', '"Code examples"', 'Names the tab list for assistive technology.'),
    apiRow('initialValue', 'string', 'first item value', 'Selects the matching code example before interaction.'),
    apiRow('storageKey', 'string', '-', 'Persists selection and synchronizes CodeTabs instances that share this key.'),
    apiRow('copy', 'boolean', 'true', 'Shows a copy button for each code example.'),
    apiRow('theme', '"auto" | "lumen" | "santi020k"', '"auto"', 'Selects the code palette family.'),
    apiRow('wrap', 'boolean', 'true', 'Wraps long code lines instead of requiring horizontal scrolling.'),
  ],
  Collapsible: [
    apiRow('open', 'boolean', 'false', 'Uses the native details open state to show the collapsible content.'),
    apiRow(
      'children',
      'summary and flow content',
      'required',
      'Requires a summary trigger followed by the content controlled by native details behavior.',
    ),
  ],
  CoverImage: [
    apiRow('image', 'ImageMetadata', 'required', 'Sets the source image processed by astro:assets.'),
    apiRow('alt', 'string', 'required', 'Sets the alt text, or pass ariaHidden for decorative covers.'),
    apiRow('mode', '"card" | "detail"', '"card"', 'Switches between the card crop and the contained detail frame.'),
    apiRow('hover', 'boolean', 'false', 'Lifts the cover on hover (respects reduced motion).'),
    apiRow('showBottomGradient', 'boolean', 'false', 'Overlays a bottom-to-top fade for legible captions.'),
  ],
  Combobox: [
    apiRow(
      'list',
      'string',
      'required',
      'Sets the id for the generated listbox and connects it to the combobox input.',
    ),
    apiRow('label', 'string', '-', 'Adds a visible label above the input.'),
    apiRow(
      'options',
      'Array<string | { label, value, disabled? }>',
      '[]',
      'Creates selectable listbox options from strings or value/label objects.',
    ),
    apiRow('type', 'HTML input type', '"text"', 'Sets the native input type.'),
  ],
  Command: [
    apiRow('data-ui-command-item', 'boolean attribute', '-', 'Marks filterable command items for the runtime.'),
  ],
  ContextMenu: [surfaceApiRow],
  ColorPicker: [apiRow('type', 'HTML input type', '"color"', 'Sets the native input type.')],
  DataTable: [
    apiRow(
      'columns',
      'DataTableColumn[]',
      '[]',
      'Generates table headers and maps row cells by column key when rows are provided.',
    ),
    apiRow('rows', 'DataTableRow[]', '[]', 'Generates table body rows from structured data.'),
    apiRow(
      'name',
      'string',
      '-',
      'Scopes selectable row checkbox names for form submission and runtime selection state.',
    ),
    apiRow('selectable', 'boolean', 'false', 'Enables selectable row behavior for the UIPrimitives runtime.'),
  ],
  DateRangePicker: [
    apiRow(
      'children',
      'two DatePicker controls',
      'required',
      'Composes the start and end fields from the custom Calendar-backed DatePicker component.',
    ),
    apiRow(
      'onRangeChange',
      '(range) => void',
      '-',
      'React only: receives the synchronized start and end ISO date values.',
    ),
    apiRow(
      'data-range-state',
      '"empty" | "selecting-end" | "complete"',
      'runtime-managed',
      'Exposes the current range progress for styling and product feedback.',
    ),
    apiRow(
      'data-ui-date-range-picker',
      'boolean attribute',
      '-',
      'Marks the container so min/max constraints stay synchronized between its DatePicker children.',
    ),
  ],
  DatePicker: [
    apiRow(
      'value, defaultValue',
      'ISO date string (YYYY-MM-DD)',
      '-',
      'Sets the selected date while the trigger shows a localized, human-readable value.',
    ),
    apiRow(
      'min, max',
      'ISO date string (YYYY-MM-DD)',
      '-',
      'Disables dates and month navigation outside the allowed range.',
    ),
    apiRow('placeholder', 'string', '"Choose a date"', 'Labels the trigger before a date is selected.'),
    apiRow(
      'UIPrimitives',
      'Astro runtime',
      'required',
      'Enhances the form-backed input into the custom Calendar popover. React and registered Elements provide equivalent behavior.',
    ),
  ],
  Dialog: [
    surfaceApiRow,
    apiRow(
      'layout',
      '"centered" | "fullscreen"',
      '"centered"',
      'Uses the standard centered panel or a viewport-filling native dialog shell.',
    ),
    ...dialogTriggerApiRows('dialog'),
  ],
  Direction: [apiRow('dir', '"ltr" | "rtl" | "auto"', '"ltr"', 'Sets text and layout direction for the subtree.')],
  Drawer: [surfaceApiRow, ...dialogTriggerApiRows('drawer')],
  DropdownMenu: [
    surfaceApiRow,
    disclosureTriggerApiRow,
    apiRow('[role="menu"]', 'child panel', '-', 'Marks the dropdown panel that contains role="menuitem" actions.'),
  ],
  Empty: [
    apiRow(
      'children',
      'heading, description, and optional action',
      'required',
      'Composes the empty-state explanation and recovery action.',
    ),
  ],
  Eyebrow: [
    apiRow(
      'children',
      'phrasing content',
      'required',
      'Provides the short category or context label that precedes a heading.',
    ),
  ],
  FloatingBadge: [
    apiRow('children', 'number | short text', 'required', 'Provides the compact overlaid notification value.'),
  ],
  FormattedDate: [
    apiRow(
      'datetime',
      'valid HTML datetime string',
      'required',
      'Sets the machine-readable date or time value on the rendered time element.',
    ),
    apiRow('children', 'human-readable date text', 'required', 'Provides the localized text shown to people.'),
  ],
  HoverCard: [surfaceApiRow, disclosureTriggerApiRow],
  Icon: [
    apiRow('name', 'string', '-', 'Renders any Lucide icon by name, including kebab-case names and Lucide aliases.'),
    apiRow('label', 'string', '-', 'Adds an accessible name and exposes the icon as an image.'),
    apiRow('decorative', 'boolean', 'true when unlabelled', 'Keeps decorative icons hidden from assistive technology.'),
    apiRow('size', '"default" | "sm" | "lg" | "xl"', '"default"', 'Controls the icon box size.'),
  ],
  Image: [
    apiRow(
      'src',
      'ImageMetadata | string',
      'required',
      'Uses astro:assets in Astro; React passes the source to the native img or the optimizer supplied through as.',
    ),
    apiRow(
      'alt',
      'string',
      'required',
      'Provides an accessible description; use an empty string for decorative images.',
    ),
    apiRow(
      'loading',
      '"lazy" | "eager"',
      'Astro/native img: "lazy"',
      'Defers off-screen loading. When as is set in React, Lumen leaves the optimizer default untouched unless this prop is explicit.',
    ),
    apiRow(
      'layout',
      '"fixed" | "constrained" | "full-width" | "none"',
      '-',
      'Astro only: generates responsive dimensions, srcset, sizes, and layout styles through astro:assets.',
    ),
    apiRow(
      'width, height',
      'number | string',
      'source metadata or required',
      'Set intrinsic dimensions for public and remote sources. Astro and Next.js can derive them from supported static imports.',
    ),
    apiRow(
      'widths, sizes',
      'number[]; string',
      'layout-dependent',
      'Astro responsive controls. Next.js also uses sizes to generate and select an efficient width-based srcset.',
    ),
    apiRow(
      'quality, format',
      'framework-supported values',
      'framework default',
      'Passes image encoding choices to astro:assets or to the React optimizer supplied through as.',
    ),
    apiRow(
      'priority',
      'boolean',
      'false',
      'Astro only: marks the likely LCP image for immediate loading, synchronous decoding, and high fetch priority.',
    ),
    apiRow(
      'preload, fill, placeholder',
      'NextImage props',
      'Next.js defaults',
      'Next.js only through as={NextImage}: keeps preloading, fill layout, and placeholder generation under next/image control.',
    ),
    apiRow(
      'invertOnDark',
      'boolean',
      'false',
      'Inverts monochrome artwork in dark themes while preserving colorful images by default.',
    ),
    apiRow(
      'as',
      'React ElementType',
      '"img"',
      'React only: renders a compatible optimizer such as next/image while retaining Lumen classes and forwarding optimizer props.',
    ),
  ],
  Field: [
    apiRow('controlId', 'string', '-', 'Connects the field to a control elsewhere in the field root.'),
    apiRow('describedBy', 'space-separated ids', '-', 'Adds ids to the control aria-describedby value.'),
    apiRow('data-ui-form', 'boolean attribute', '-', 'Opts a form into native Constraint Validation API enhancement.'),
    apiRow(
      'data-error-required, data-error-pattern, data-error-min, data-error-max, data-error-custom',
      'string',
      '-',
      'Overrides browser validationMessage text for matching constraints.',
    ),
  ],
  Input: [
    apiRow('type', 'HTML input type', '"text"', 'Sets the native input type.'),
    apiRow('size', '"default" | "sm" | "lg"', '"default"', 'Controls the field height and font size.'),
  ],
  InputGroup: [
    apiRow(
      'children',
      'input plus prefixes, suffixes, or controls',
      'required',
      'Composes attached controls while preserving the input’s native label and form behavior.',
    ),
  ],
  InputOTP: [
    apiRow(
      'autocomplete',
      'HTML autocomplete value',
      '"one-time-code"',
      'Hints that password managers and mobile keyboards can offer one-time code autofill.',
    ),
    apiRow('disabled', 'boolean', 'false', 'Disables the native input and generated visual segments.'),
    apiRow('length', 'number', '6', 'Sets the number of visual code segments and the default maxlength.'),
    apiRow('maxlength', 'number', 'length', 'Overrides the native maximum character count.'),
    apiRow('inputmode', 'HTML inputmode value', '"numeric"', 'Hints the preferred on-screen keyboard.'),
    apiRow('pattern', 'string', '"[0-9]*"', 'Sets the native input pattern for accepted characters.'),
  ],
  Marker: [apiRow('variant', '"default" | "success" | "warning" | "danger"', '"default"', 'Controls the marker tone.')],
  Item: [
    apiRow(
      'children',
      'primary content, metadata, and optional actions',
      'required',
      'Composes one compact aligned row.',
    ),
  ],
  Kbd: [
    apiRow(
      'children',
      'shortcut text',
      'required',
      'Provides the key name or shortcut sequence rendered by the semantic kbd element.',
    ),
  ],
  Label: [
    apiRow(
      'for',
      'element id',
      '-',
      'Associates the label with a form control in Astro and HTML; use htmlFor in React.',
    ),
  ],
  LanguageToggle: [
    apiRow('children', 'locale label', 'required', 'Shows the current locale or language abbreviation.'),
    apiRow('type', '"button" | "submit" | "reset"', '"button"', 'Sets the native button type.'),
  ],
  Link: [
    apiRow('href', 'string', 'required', 'Sets the native anchor destination.'),
    apiRow(
      'newTab',
      'boolean',
      'false',
      'Opens the destination in a new tab and safely adds noopener and noreferrer to rel.',
    ),
    apiRow(
      'variant',
      '"default" | "inherit"',
      '"default"',
      'Lets migration surfaces inherit surrounding link color and font weight.',
    ),
    apiRow('target, rel', 'anchor attributes', '-', 'Forwards native navigation and relationship attributes.'),
  ],
  LineChart: [
    apiRow(
      'series',
      'LumenChartSeries[]',
      'required',
      'Provides ordered, already-aggregated points; null y values create visible gaps.',
    ),
    apiRow(
      'area',
      'boolean',
      'false',
      'Adds a tokenized fill between each line segment and the zero or domain baseline.',
    ),
    apiRow(
      'markers',
      'boolean',
      'true',
      'Shows point markers as a second visual cue and exposes per-point SVG titles.',
    ),
    apiRow('referenceValue', 'number', '-', 'Draws a dashed threshold or comparison line across the plot.'),
    apiRow('showLegend', 'boolean', 'true for multiple series', 'Shows the color-independent series key.'),
    apiRow('showTable', 'boolean', 'true', 'Provides a revealable semantic table containing every plotted value.'),
  ],
  Menubar: [surfaceApiRow],
  Message: [apiRow('from', '"assistant" | "user"', '"assistant"', 'Aligns and styles the message for the author.')],
  MessageScroller: [
    apiRow(
      'children',
      'Message elements or activity rows',
      'required',
      'Provides the ordered feed inside the scrollable region.',
    ),
  ],
  Note: [
    apiRow('label', 'string', '-', 'Adds an emphasized label above the note content.'),
    apiRow(
      'borderPosition',
      '"left" | "right" | "none"',
      '"left"',
      'Positions the accent border, or removes it entirely.',
    ),
  ],
  NativeSelect: [
    apiRow('options', 'Array<string | { label, value, disabled? }>', '[]', 'Creates native option elements.'),
    apiRow('placeholder', 'string', '-', 'Adds a disabled placeholder option.'),
    apiRow('size', '"default" | "sm" | "lg"', '"default"', 'Controls select height and font size.'),
  ],
  NavigationMenu: [
    surfaceApiRow,
    apiRow(
      'variant',
      '"default" | "unstyled"',
      '"default"',
      'Keeps navigation semantics and roving focus while removing Lumen container and child presentation.',
    ),
  ],
  NumberField: [apiRow('type', 'HTML input type', '"number"', 'Sets the native input type.')],
  Pagination: [
    apiRow('aria-label', 'string', '"Pagination"', 'Sets the accessible name of the pagination navigation landmark.'),
    apiRow(
      'children',
      'links and current-page indicators',
      'required',
      'Provides native links; use aria-current="page" for the active page and rel for previous and next links.',
    ),
  ],
  PhoneInput: [
    apiRow(
      'countries',
      'Array<string | { label, value, disabled? }>',
      '[]',
      'Populates the country dial-code select options.',
    ),
    apiRow('countryName', 'string', '"country"', 'Sets the name of the country dial-code select.'),
    apiRow('countryLabel', 'string', '"Country code"', 'Sets the accessible label for the dial-code select.'),
    apiRow('countryValue', 'string', '-', 'Selects the initial dial code by value.'),
    apiRow('name', 'string', '"phone"', 'Sets the name of the telephone number input.'),
    apiRow('placeholder', 'string', '"Phone number"', 'Sets the placeholder for the number input.'),
    apiRow('size', '"default" | "sm" | "lg"', '"default"', 'Controls the height and font size of both controls.'),
  ],
  PieChart: [
    apiRow(
      'series',
      'LumenChartSeries',
      'required',
      'Provides one already-aggregated series whose positive finite data points become slices.',
    ),
    apiRow('variant', '"donut" | "pie"', '"donut"', 'Uses a center opening by default or renders a traditional pie.'),
    apiRow(
      'centerLabel, centerValue',
      'string | ReactNode',
      '-',
      'Adds optional visual summary content in the donut center.',
    ),
    apiRow('showLegend', 'boolean', 'true', 'Shows the color-independent category key.'),
    apiRow(
      'showTable',
      'boolean',
      'true',
      'Provides a revealable semantic table with category, value, and share columns.',
    ),
    apiRow(
      'valueFormatter',
      '(value: number) => string',
      'String',
      'Formats values in SVG titles and the semantic table for Astro and React; Web Components expose the equivalent JavaScript property.',
    ),
  ],
  Pill: [
    apiRow('count', 'number | string', '-', 'Appends a muted count affix after the pill label.'),
    apiRow('href', 'string', '-', 'Renders the pill as a focusable anchor when it represents a destination.'),
    apiRow(
      'variant',
      '"neutral" | "brand" | "outline"',
      '"neutral"',
      'Controls the pill emphasis without changing its metadata semantics.',
    ),
  ],
  Popover: [surfaceApiRow, disclosureTriggerApiRow],
  Progress: [
    apiRow('value', 'number', '0', 'Sets the current progress value, clamped between 0 and max.'),
    apiRow('max', 'number', '100', 'Sets the upper bound for progress.'),
  ],
  Prose: [
    apiRow(
      'children',
      'rendered Markdown, CMS, or long-form HTML',
      'required',
      'Applies readable measure and typographic rhythm without changing the supplied semantics.',
    ),
  ],
  RadioGroup: [
    apiRow(
      'children',
      'labelled radio inputs',
      'required',
      'Provides the mutually exclusive native controls inside the fieldset.',
    ),
    apiRow('aria-label, aria-labelledby', 'string', '-', 'Names the radio group when no visible legend is supplied.'),
  ],
  Resizable: [
    apiRow('defaultSizes', 'number[]', '-', 'Sets initial pane sizes as percentages, serialized for the runtime.'),
    apiRow(
      'direction',
      '"horizontal" | "vertical"',
      '"horizontal"',
      'Sets the resize axis and generated handle orientation.',
    ),
    apiRow('maxSize', 'number | number[]', '-', 'Limits pane growth by percentage; pass an array for per-pane limits.'),
    apiRow(
      'minSize',
      'number | number[]',
      '-',
      'Limits pane shrinkage by percentage; pass an array for per-pane limits.',
    ),
    apiRow(
      'resetOnDoubleClick',
      'boolean',
      'true',
      'Restores default pane sizes when a resize handle is double-clicked.',
    ),
  ],
  Schedule: [
    apiRow(
      'data-ui-schedule-event',
      'boolean attribute',
      '-',
      'Marks a draggable event and exposes its id to the schedule change event.',
    ),
    apiRow(
      'data-ui-schedule-slot',
      'boolean attribute',
      '-',
      'Marks a drop target and exposes its slot value to the schedule change event.',
    ),
  ],
  ScrollArea: [
    apiRow(
      'children',
      'scrollable flow content',
      'required',
      'Provides the content inside the styled overflow container.',
    ),
  ],
  ScrollProgress: [
    apiRow('position', '"top" | "bottom"', '"top"', 'Pins the progress indicator to a viewport edge.'),
    apiRow(
      'aria-label',
      'string',
      '"Reading progress"',
      'Names the live document-progress indicator for assistive technology.',
    ),
  ],
  Select: [
    apiRow('options', 'Array<string | { label, value, disabled? }>', '[]', 'Creates native option elements.'),
    apiRow('placeholder', 'string', '-', 'Adds a disabled placeholder option and trigger placeholder text.'),
    apiRow(
      'size',
      '"default" | "sm" | "md" | "lg"',
      '"default"',
      'Controls select height and font size. The md value maps to the default size.',
    ),
    apiRow('disabled', 'boolean', 'false', 'Disables the native select and enhanced trigger.'),
    apiRow('required', 'boolean', 'false', 'Forwards required validation to the native select.'),
    apiRow('value', 'string | number', '-', 'Selects the matching option value.'),
  ],
  Separator: [apiRow('orientation', '"horizontal" | "vertical"', '"horizontal"', 'Sets the separator direction.')],
  SearchField: [apiRow('type', 'HTML input type', '"search"', 'Sets the native input type.')],
  RichTextEditor: [
    apiRow(
      'data-ui-editor-command',
      'string',
      '-',
      'Runs formatting, block, alignment, history, link, list, or custom commands and emits ui:editor-command.',
    ),
    apiRow(
      'data-ui-editor-value',
      'string',
      '-',
      'Supplies a value for commands such as formatBlock and createLink. Native select values are read automatically.',
    ),
    apiRow(
      'data-ui-rich-text-editable',
      'data attribute',
      '-',
      'Marks the editable content surface for shortcuts, state syncing, and ui:editor-change events.',
    ),
  ],
  Sheet: [surfaceApiRow, ...dialogTriggerApiRows('sheet')],
  Sidebar: [
    surfaceApiRow,
    apiRow(
      'variant',
      '"default" | "unstyled"',
      '"default"',
      'Keeps aside semantics while removing Lumen layout and presentation.',
    ),
  ],
  Slider: [apiRow('type', 'HTML input type', '"range"', 'Sets the native input type.')],
  Skeleton: [
    apiRow(
      'aria-label, aria-labelledby',
      'string',
      '-',
      'Makes the placeholder accessible and changes the default role to status.',
    ),
    apiRow(
      'aria-hidden',
      'ARIA boolean string',
      'true unless labelled',
      'Overrides whether the loading placeholder is exposed to assistive technology.',
    ),
    apiRow('role', 'ARIA role', '"status" when labelled', 'Overrides the generated status role.'),
  ],
  SkipLink: [
    apiRow(
      'href',
      'fragment URL',
      'required',
      'Targets the main-content id that receives navigation after repeated controls are bypassed.',
    ),
  ],
  Spinner: [
    apiRow(
      'aria-label, aria-labelledby',
      'string',
      '-',
      'Makes the spinner accessible and changes the default role to status.',
    ),
    apiRow(
      'aria-hidden',
      'ARIA boolean string',
      'true unless labelled',
      'Overrides whether the loading indicator is exposed to assistive technology.',
    ),
    apiRow('role', 'ARIA role', '"status" when labelled', 'Overrides the generated status role.'),
  ],
  Sonner: [
    apiRow(
      'placement',
      '"bottom-center" | "bottom-left" | "bottom-right" | "top-center" | "top-left" | "top-right"',
      '"bottom-right"',
      'Positions the notification viewport.',
    ),
    apiRow('maxCount', 'number', '3', 'Limits the number of simultaneously visible runtime toasts.'),
  ],
  Sparkline: [
    apiRow('values', 'number[]', 'required', 'Provides ordered values for the compact trend.'),
    apiRow(
      'label',
      'string',
      'required',
      'Communicates the trend in text because the SVG is intentionally decorative.',
    ),
    apiRow('area', 'boolean', 'false', 'Adds a subtle tokenized fill below the line.'),
    apiRow('showEndpoint', 'boolean', 'true', 'Marks the latest value with a color-independent endpoint.'),
    apiRow('tone', 'LumenChartTone', '"series-1"', 'Selects a categorical or explicitly semantic chart tone.'),
  ],
  SpeedDial: [
    apiRow(
      'actions',
      'Array<{ icon?, label, value? }>',
      '[]',
      'Creates labelled menu actions and renders optional Lumen icons.',
    ),
    apiRow('defaultOpen', 'boolean', 'false', 'Sets the initial expanded state.'),
    apiRow('direction', '"up" | "down" | "left" | "right"', '"up"', 'Controls the direction in which actions expand.'),
    apiRow('label', 'string', '"Actions"', 'Names both the trigger and its action menu for assistive technology.'),
    apiRow(
      'UIPrimitives',
      'Astro runtime',
      'required',
      'Adds click-away dismissal and complete trigger and menu keyboard behavior. React provides equivalent behavior.',
    ),
  ],
  Switch: [
    apiRow('checked, defaultChecked', 'boolean', '-', 'Uses the native checkbox checked state.'),
    apiRow('role', 'ARIA role', '"switch"', 'Sets the switch role on the checkbox input.'),
    apiRow('type', '"checkbox"', '"checkbox"', 'Fixed by the component.'),
  ],
  Table: [
    apiRow(
      'children',
      'caption, thead, tbody, and tfoot',
      'required',
      'Provides semantic native table structure inside the styled wrapper.',
    ),
  ],
  Tabs: [
    apiRow('[role="tablist"]', 'child container', 'required', 'Groups the tab controls.'),
    apiRow(
      '[role="tab"]',
      'child control',
      'required',
      'Pairs with a panel by data-value or source order; the Astro runtime generates stable ARIA relationships.',
    ),
    apiRow(
      '[role="tabpanel"]',
      'child panel',
      'required',
      'Pairs with a tab by data-value or source order and hides when inactive.',
    ),
    apiRow('initialValue', 'string', '-', 'Astro: selects the matching data-value before interaction.'),
    apiRow('storageKey', 'string', '-', 'Astro: persists selection and synchronizes tab groups that share this key.'),
  ],
  TagGroup: [
    apiRow('data-ui-tag', 'boolean attribute', '-', 'Marks each tag item for group behavior.'),
    apiRow(
      'data-ui-tag-remove',
      'boolean attribute',
      '-',
      'Marks a labelled child control that removes its closest tag and emits ui:tag-remove.',
    ),
  ],
  Textarea: [apiRow('rows', 'number', '4', 'Sets the visible text rows.')],
  ThemeBuilder: [
    apiRow(
      'data-ui-theme-target',
      'CSS selector',
      'documentElement',
      'Selects the element that receives generated theme variables.',
    ),
    apiRow('data-ui-theme-brand-hue', 'range or number input', '-', 'Controls the generated brand hue.'),
    apiRow(
      'data-ui-theme-export',
      'button attribute',
      '-',
      'Exports the current theme in the selected CSS, Figma, or design-token format.',
    ),
  ],
  ThemeToggle: [
    apiRow('storageKey', 'string', '"lumen-theme"', 'Sets the local-storage key used to persist the selected theme.'),
    apiRow(
      'lightTheme, darkTheme',
      'string',
      '"light", "dark"',
      'Sets the data-theme values toggled on the document element.',
    ),
    apiRow(
      'controlled',
      'boolean',
      'false',
      'Disables automatic theme changes when the host application owns theme state.',
    ),
  ],
  Toast: [
    apiRow('variant', '"default" | "destructive" | "success" | "warning"', '"default"', 'Controls the toast tone.'),
    apiRow(
      'placement',
      '"top-left" | "top-center" | "top-right" | "bottom-left" | "bottom-center" | "bottom-right"',
      '"bottom-right"',
      'Positions the notification viewport used for programmatic toasts.',
    ),
    apiRow('max', 'number', '5', 'Limits the number of runtime toasts kept in the notification viewport.'),
    apiRow(
      'window.LumenToast.create(detail)',
      'function',
      '-',
      'Creates a runtime toast and returns its id. Also available through document ui:toast.',
    ),
    apiRow(
      'window.LumenToast.update(id, detail)',
      'function',
      '-',
      'Updates the title, description, variant, action, or duration for a runtime toast.',
    ),
    apiRow(
      'window.LumenToast.dismiss(id?)',
      'function',
      '-',
      'Dismisses one runtime toast, or all runtime toasts when id is omitted.',
    ),
    surfaceApiRow,
  ],
  Tooltip: [
    disclosureTriggerApiRow,
    apiRow(
      '[role="tooltip"]',
      'child panel',
      'required',
      'Provides the non-interactive explanation linked to the trigger with aria-describedby.',
    ),
  ],
  TimeField: [apiRow('type', 'HTML input type', '"time"', 'Sets the native input type.')],
  Toggle: [
    apiRow(
      'controlled',
      'boolean',
      'false',
      'Disables automatic Astro state changes while retaining the cancelable ui:toggle-intent event.',
    ),
    apiRow('pressed', 'boolean', 'false', 'Sets the initial pressed state.'),
    apiRow('type', '"button" | "submit" | "reset"', '"button"', 'Sets the native button type.'),
  ],
  ToggleGroup: [
    apiRow(
      'data-ui-toggle-group',
      'boolean attribute',
      '-',
      'Marks the container for roving focus management by the UIPrimitives runtime.',
    ),
  ],
  Tree: [
    apiRow('role', 'ARIA role', '"tree"', 'Generated tree role for the root element.'),
    apiRow(
      'aria-expanded, aria-level',
      'ARIA attributes',
      '-',
      'Use on child items to indicate nested tree structure.',
    ),
  ],
  TreeGrid: [
    apiRow('role', 'ARIA role', '"treegrid"', 'Generated treegrid role for the root element.'),
    apiRow(
      'role="row", role="gridcell"',
      'ARIA roles',
      '-',
      'Use on children to build out the hierarchical grid rows and cells.',
    ),
  ],
  Typography: [
    apiRow(
      'children',
      'semantic HTML',
      'required',
      'Styles descendant headings, paragraphs, lists, blockquotes, and links without changing their HTML semantics.',
    ),
  ],
  VirtualList: [
    apiRow(
      'itemSize',
      'number | string',
      '-',
      'Fixed size for items if all are uniform height/width. Used for virtual scroll calculation.',
    ),
    apiRow('overscan', 'number | string', '-', 'Number of items to render outside the viewport.'),
  ],
  Particles: [apiRow('density', '"low" | "medium" | "high"', '"medium"', 'Controls the density of the particles.')],
  AnimatedNumber: [
    apiRow(
      'value',
      'number',
      'required',
      'Sets the final value announced to assistive technology and displayed after the animation.',
    ),
    apiRow('from', 'number', '0', 'Sets the visual starting value.'),
    apiRow('decimals', 'number', '0', 'Sets the number of displayed decimal places.'),
    apiRow('locale', 'string', 'browser locale', 'Formats the value with Intl.NumberFormat.'),
    apiRow('prefix, suffix', 'string', '""', 'Adds stable text around the formatted number.'),
    apiRow('duration', '"fast" | "standard" | "slow"', '"slow"', 'Uses the shared Lumen motion duration.'),
  ],
  RevealGroup: [
    apiRow(
      'animation',
      '"fade" | "slide-up" | "scale"',
      '"slide-up"',
      'Sets the shared entrance treatment for direct children.',
    ),
    apiRow('stagger', 'number', '80', 'Sets the delay in milliseconds between direct children.'),
    apiRow('delay', 'number', '0', 'Delays the first child in milliseconds.'),
    apiRow('duration', '"fast" | "standard" | "slow"', '"slow"', 'Uses the shared Lumen motion duration.'),
    apiRow('once', 'boolean', 'true', 'When false, children transition again when the group re-enters the viewport.'),
    apiRow('threshold', 'number', '0.15', 'Sets the visible intersection ratio that starts the reveal.'),
  ],
  ScrollReveal: [
    apiRow(
      'animation',
      '"fade" | "slide-up" | "scale"',
      '"fade"',
      'Sets the reveal transition. UIPrimitives observes the element and reveals it as it enters the viewport.',
    ),
    apiRow('delay', 'number', '0', 'Delays the entrance in milliseconds.'),
    apiRow('duration', '"fast" | "standard" | "slow"', '"slow"', 'Uses the shared Lumen motion duration.'),
    apiRow('once', 'boolean', 'true', 'When false, the content transitions again when it re-enters the viewport.'),
    apiRow('threshold', 'number', '0.15', 'Sets the visible intersection ratio that starts the reveal.'),
  ],
  Stat: [
    apiRow(
      'as',
      '"article" | "div" | "section"',
      '"div"',
      'Changes the root element when the statistic is a standalone semantic region.',
    ),
    apiRow(
      'variant',
      '"accent" | "bare" | "default" | "glass"',
      '"default"',
      'Changes the surface treatment; bare removes framing when composed inside Card.',
    ),
    apiRow('label', 'string', '-', 'The label describing the statistic.'),
    apiRow('value', 'string', '-', 'The numeric or text value of the statistic.'),
  ],
  StatDescription: [
    apiRow('as', '"div" | "p"', '"div"', 'Uses a paragraph only when the supporting content is phrasing content.'),
    apiRow(
      'data-slot',
      '"stat-description"',
      'generated',
      'Provides the stable public styling hook for metric context.',
    ),
  ],
  StatIcon: [
    apiRow(
      'children',
      'Icon or custom artwork',
      'required',
      'Adds a decorative or labelled visual associated with the metric.',
    ),
    apiRow('data-slot', '"stat-icon"', 'generated', 'Provides the stable public styling hook for the icon container.'),
  ],
  StatLabel: [
    apiRow('as', '"div" | "span"', '"div"', 'Changes the label wrapper without adding heading semantics.'),
    apiRow('data-slot', '"stat-label"', 'generated', 'Provides the stable public styling hook for the metric label.'),
  ],
  StatTrend: [
    apiRow(
      'tone',
      '"neutral" | "success" | "warning" | "danger"',
      '"neutral"',
      'Applies a semantic trend tone; visible text or an accessible name must communicate its meaning.',
    ),
    apiRow(
      'data-slot',
      '"stat-trend"',
      'generated',
      'Provides the stable public styling hook for a delta or comparison.',
    ),
  ],
  StatValue: [
    apiRow(
      'as',
      '"div" | "output" | "span"',
      '"div"',
      'Uses output only when the value is the result of a user action or calculation.',
    ),
    apiRow(
      'data-slot',
      '"stat-value"',
      'generated',
      'Provides the stable public styling hook for the prominent value.',
    ),
  ],
  Meter: [
    apiRow('value', 'number', 'required', 'Sets the current scalar value.'),
    apiRow('min, max', 'number', '0, 100', 'Sets the inclusive measurement range.'),
    apiRow('low, high, optimum', 'number', '-', 'Defines qualitative ranges for the native meter element.'),
  ],
  Rating: [
    apiRow('value', 'number', '0', 'Sets the selected or displayed score.'),
    apiRow('max', 'number', '5', 'Sets the highest available score.'),
    apiRow('readonly', 'boolean', 'false', 'Presents the rating without interactive score controls.'),
  ],
  Timeline: [
    apiRow(
      'children',
      'TimelineItem elements',
      'required',
      'Provides chronologically ordered milestones or activity events.',
    ),
  ],
  GradientDivider: [
    apiRow(
      'aria-hidden',
      'ARIA boolean string',
      '"true"',
      'Keeps the decorative gradient out of the accessibility tree unless explicitly overridden.',
    ),
  ],
  Stepper: [
    apiRow('steps', 'Array<string | { label, description? }>', '[]', 'Defines the ordered steps.'),
    apiRow('currentStep', 'number', '0', 'Sets the zero-based active step.'),
    apiRow('orientation', '"horizontal" | "vertical"', '"horizontal"', 'Controls the step layout direction.'),
  ],
  FileUpload: [
    apiRow('label', 'string', '"Choose a file"', 'Sets the visible upload action label.'),
    apiRow('hint', 'string', '-', 'Adds supporting file type or size guidance.'),
    apiRow(
      'accept, multiple, name',
      'native file input attributes',
      '-',
      'Controls accepted files and form submission.',
    ),
  ],
  Tour: [
    apiRow('steps', 'Array<{ target, content, title? }>', '[]', 'Defines the ordered anchored guidance steps.'),
    apiRow('nextLabel, closeLabel', 'string', '"Next", "Close"', 'Sets the tour navigation action labels.'),
  ],
  Anchor: [
    apiRow(
      'items',
      'Array<{ href, label, depth? }>',
      '[]',
      'Defines the in-page navigation targets, labels, and optional heading depth from 1 through 6.',
    ),
  ],
  Segmented: [
    apiRow(
      'options',
      'Array<string | { label, value, disabled? }>',
      '[]',
      'Defines the mutually exclusive visible options.',
    ),
    apiRow('value, defaultValue', 'string', '-', 'Controls or initializes the selected value.'),
    apiRow('name', 'string', '-', 'Sets the submitted form field name.'),
    apiRow('size', '"default" | "sm" | "lg"', '"default"', 'Controls the segment height and spacing.'),
  ],
  Toolbar: [
    apiRow(
      'orientation',
      '"horizontal" | "vertical"',
      '"horizontal"',
      'Sets the toolbar direction and keyboard navigation axis.',
    ),
    apiRow('aria-label, aria-labelledby', 'string', '-', 'Provides the toolbar accessible name.'),
  ],
  Descriptions: [
    apiRow('items', 'Array<{ label, value }>', '[]', 'Defines the labelled facts.'),
    apiRow('columns', 'number', '1', 'Sets the preferred number of aligned columns.'),
  ],
  Popconfirm: [
    apiRow('title', 'string', '"Are you sure?"', 'Sets the concise confirmation question.'),
    apiRow('confirmLabel, cancelLabel', 'string', '"Confirm", "Cancel"', 'Sets the action labels.'),
  ],
  Transfer: [
    apiRow('items, targetItems', 'TransferItem[]', '[]', 'Defines the available and initially chosen collections.'),
    apiRow('sourceTitle, targetTitle', 'string', '"Available", "Selected"', 'Labels the two collections.'),
    apiRow('name', 'string', '-', 'Sets the submitted values field name.'),
  ],
  Cascader: [
    apiRow('options', 'CascaderOption[]', '[]', 'Defines the hierarchical option branches.'),
    apiRow('name', 'string', '-', 'Sets the submitted field name.'),
    apiRow('placeholder', 'string', '"Select"', 'Sets the trigger text before a path is selected.'),
  ],
  TreeSelect: [
    apiRow('treeData', 'TreeNode[]', '[]', 'Defines the selectable hierarchy.'),
    apiRow('name', 'string', '-', 'Sets the submitted field name.'),
    apiRow('placeholder', 'string', '"Select"', 'Sets the trigger text before a node is selected.'),
  ],
  Mentions: [
    apiRow('options', 'Array<string | { label, value }>', '[]', 'Defines the mention suggestions.'),
    apiRow('trigger', 'string', '"@"', 'Sets the character that opens suggestions.'),
    apiRow('name, placeholder', 'string', '-', 'Sets the native textarea field name and hint.'),
  ],
  QRCode: [
    apiRow('value', 'string', 'required unless src is provided', 'Generates a QR code from the supplied value.'),
    apiRow('src', 'string', '-', 'Uses an existing QR image instead of generating one.'),
    apiRow('size', 'number', '160', 'Sets the rendered square dimensions.'),
  ],
  Watermark: [
    apiRow('content, text', 'string', '"Lumen"', 'Sets the repeated watermark text.'),
    apiRow('gap', 'number', '96', 'Sets spacing between watermark marks.'),
    apiRow('rotate', 'number', '-22', 'Sets the watermark rotation in degrees.'),
  ],
  Affix: [
    apiRow('position', '"top" | "bottom"', '"top"', 'Selects the viewport edge used for sticky positioning.'),
    apiRow(
      'offset, offsetTop, offsetBottom',
      'number',
      '0',
      'Sets the sticky inset in pixels; edge-specific values override offset.',
    ),
  ],
  CheckboxGroup: [
    apiRow('legend', 'string', '-', 'Adds the visible fieldset legend for the related checkbox choices.'),
    apiRow(
      'orientation',
      '"horizontal" | "vertical"',
      '"vertical"',
      'Controls the visual arrangement without changing fieldset semantics.',
    ),
    apiRow('invalid', 'boolean', 'false', 'Marks the group invalid for validation feedback.'),
  ],
  Container: [
    apiRow('as', '"article" | "div" | "main" | "section"', '"div"', 'Changes the semantic root.'),
    apiRow('size', '"sm" | "md" | "lg" | "full"', '"lg"', 'Controls the maximum inline size.'),
  ],
  ErrorSummary: [
    apiRow('errors', 'LumenFormErrorInput', '-', 'Normalizes form and field errors into a linked summary.'),
    apiRow('heading', 'string', '"There is a problem"', 'Sets the summary heading.'),
    apiRow('id', 'string', '"ui-error-summary"', 'Sets the focus target and heading relationship.'),
  ],
  FieldError: [
    apiRow('message', 'string', '-', 'Shows the error text and reveals the live field error region.'),
    apiRow('children', 'phrasing content', '-', 'Overrides the message prop with authored content.'),
  ],
  Form: [
    apiRow('enhance', 'boolean', 'true', 'Enables Lumen constraint-validation enhancement.'),
    apiRow(
      'status',
      '"idle" | "submitting" | "success" | "error"',
      '"idle"',
      'Exposes submission state and aria-busy.',
    ),
  ],
  Grid: [
    apiRow('as', '"div" | "ol" | "section" | "ul"', '"div"', 'Changes the semantic root.'),
    apiRow('columns', '1 | 2 | 3 | 4 | 6 | 12 | "auto"', '"auto"', 'Controls the preferred column count.'),
    apiRow('gap', '"none" | "sm" | "md" | "lg" | "xl"', '"md"', 'Controls spacing between items.'),
    apiRow('minItemWidth', 'CSS length', '-', 'Sets the responsive minimum item width in auto mode.'),
  ],
  ListBox: [
    apiRow('options', 'Array<string | { label, value, disabled? }>', '[]', 'Defines the selectable options.'),
    apiRow('value', 'string | string[]', '-', 'Controls the selected value or values.'),
    apiRow(
      'multiple',
      'boolean',
      'false',
      'Allows more than one selected value while preserving native form submission.',
    ),
  ],
  PasswordField: [
    apiRow('label', 'string', '"Password"', 'Labels the password input.'),
    apiRow('hint, error', 'string', '-', 'Adds described hint or error content.'),
    apiRow('showLabel, hideLabel', 'string', '"Show password", "Hide password"', 'Names the visibility toggle states.'),
  ],
  Stack: [
    apiRow('as', '"article" | "div" | "fieldset" | "nav" | "section"', '"div"', 'Changes the semantic root.'),
    apiRow('direction', '"horizontal" | "vertical"', '"vertical"', 'Controls the primary layout axis.'),
    apiRow('gap', '"none" | "sm" | "md" | "lg" | "xl"', '"md"', 'Controls spacing between children.'),
    apiRow(
      'align, justify, wrap',
      'layout props',
      'stretch, start, false',
      'Controls cross-axis alignment, distribution, and wrapping.',
    ),
  ],
  VisuallyHidden: [
    apiRow(
      'focusable',
      'boolean',
      'false',
      'Reveals the content on focus for keyboard-accessible skip or helper controls.',
    ),
    apiRow('children', 'phrasing content', 'required', 'Provides content for assistive technology.'),
  ],
} satisfies Record<LumenComponentName, readonly ComponentApiRow[]>

const componentGuidanceByName: Partial<Record<string, ComponentGuidance>> = {
  Accordion: {
    when: 'Use for a list of related sections when people may open and compare more than one section. Use the flush variant for FAQs and content-led lists.',
    distinction:
      'Use Collapsible for one standalone disclosure rather than a coordinated group. Give child details the same native name when only one section should remain open.',
  },
  Alert: {
    when: 'Use for a status or outcome that should remain visible near the content it affects.',
    distinction: 'Use Toast for temporary feedback, Callout for editorial emphasis, or Note for supporting context.',
  },
  AlertDialog: {
    when: 'Use before an irreversible or high-impact action that requires an explicit decision.',
    distinction: 'Use Dialog for ordinary focused tasks and Popconfirm for a compact confirmation beside its trigger.',
  },
  Autocomplete: {
    when: 'Use when people may type any value but benefit from browser-native suggestions.',
    distinction: 'Use Combobox when the value must come from a managed option list with richer keyboard behavior.',
  },
  Badge: {
    when: 'Use as an inline label for status, category, plan, or other compact metadata.',
    distinction:
      'Use FloatingBadge for an overlaid notification count, Pill for a label with an attached count, or Marker for dot-led operational status.',
  },
  BarChart: {
    when: 'Use to compare categories, rankings, or discrete periods from already-aggregated values.',
    distinction:
      'Use LineChart for continuous ordered trends and Sparkline for a compact trend attached to one metric.',
  },
  Bubble: {
    when: 'Use for the visible text container of one chat message or short comment.',
    distinction: 'Use Message to compose the full row, including avatar, author, timestamp, and a Bubble.',
  },
  ButtonLink: {
    when: 'Use for navigation that needs button-level visual emphasis while preserving link behavior.',
    distinction: 'Use Button for an action that changes state and Link for ordinary inline navigation.',
  },
  Callout: {
    when: 'Use to pull an important explanation, caveat, or instruction out of surrounding prose.',
    distinction: 'Use Alert for a system status or outcome and Note for quieter supplementary information.',
  },
  Collapsible: {
    when: 'Use for one optional region such as advanced settings, details, or filters.',
    distinction: 'Use Accordion when several related disclosures need shared structure.',
  },
  Combobox: {
    when: 'Use when people need to search and choose from a controlled list of options.',
    distinction: 'Use Select for selection without text search or Autocomplete when free-form values are allowed.',
  },
  DataTable: {
    when: 'Use for dense records that need interactive behaviors such as sorting, filtering, or selection.',
    distinction: 'Use Table for static semantic rows and columns, and TreeGrid for expandable hierarchical rows.',
  },
  Dialog: {
    when: 'Use for a focused task or decision that temporarily interrupts the page.',
    distinction:
      'Use AlertDialog for dangerous confirmations, Sheet or Drawer for edge-aligned supporting work, and Popover for lightweight contextual content.',
  },
  Drawer: {
    when: 'Use for temporary controls or navigation that slide in from an edge, especially on compact screens.',
    distinction: 'Use Sheet for a secondary detail workflow and Dialog for a centered, blocking task.',
  },
  Eyebrow: {
    when: 'Use as a short contextual label immediately above a heading.',
    distinction: 'It styles a paragraph and does not replace a semantic heading or act as a status Badge.',
  },
  Field: {
    when: 'Use to group a form control with its label, description, and validation errors.',
    distinction:
      'Use Field as the structural container for form elements, and Input for the interactive control itself.',
  },
  FloatingBadge: {
    when: 'Use for a high-emphasis count or notification positioned over an icon, avatar, or control.',
    distinction:
      'Unlike Badge, it has notification styling and is intended for overlay placement; the parent layout controls its position.',
  },
  HoverCard: {
    when: 'Use to preview richer information about a person, link, or object on hover and keyboard focus.',
    distinction:
      'Use Tooltip for a short label and Popover when the floating content contains actions or form controls.',
  },
  Input: {
    when: 'Use to capture short text, email, passwords, search terms, or numeric values.',
    distinction:
      'Use Input for the actual interactive form control, and Field to structurally group it with a label and helper text.',
  },
  Item: {
    when: 'Use to align a compact row of primary text, supporting metadata, badges, icons, or actions in a list or results view.',
    distinction:
      'Item provides visual layout only: it renders a div and adds no list semantics or interaction. Wrap it in a semantic list item when needed, and use a Link or Button for clickable behavior.',
  },
  LineChart: {
    when: 'Use to show how one or more ordered series change, including missing values and thresholds.',
    distinction:
      'Use BarChart for categorical magnitude comparisons and Sparkline when axes and exact values are unnecessary.',
  },
  Marker: {
    when: 'Use for compact operational status where a colored dot should carry the visual signal.',
    distinction: 'Use Badge for a filled metadata label and Pill for a label paired with a count.',
  },
  Meter: {
    when: 'Use to show a measurement within a known range, such as storage, signal, or score.',
    distinction:
      'Use Progress for task completion; Meter represents a current quantity, not work advancing toward completion.',
  },
  NativeSelect: {
    when: 'Use when native platform behavior, mobile pickers, and minimal runtime are the priority.',
    distinction: 'Use Select for Lumen’s enhanced custom control or Combobox when people need to search the options.',
  },
  Note: {
    when: 'Use for supplementary information that should stay attached to nearby content.',
    distinction: 'Use Callout for stronger editorial emphasis and Alert for status that requires attention.',
  },
  PieChart: {
    when: 'Use for a part-to-whole breakdown with one series, non-negative values, and a small number of meaningful categories.',
    distinction:
      'Prefer the default donut for a center total. Use BarChart when precise comparison or more than roughly seven categories matters, and do not use PieChart for negative values or change over time.',
  },
  Pill: {
    when: 'Use for a rounded label that may include a separate trailing count.',
    distinction:
      'Use Badge for status variants, FloatingBadge for an overlaid notification, or TagGroup for interactive/removable tags.',
  },
  Popconfirm: {
    when: 'Use for a brief yes-or-no confirmation anchored directly to the action that triggered it.',
    distinction: 'Use AlertDialog when the consequence is serious enough to require a modal interruption.',
  },
  Popover: {
    when: 'Use for contextual floating content that may contain controls, actions, or a small form.',
    distinction: 'Use Tooltip for one short explanation and HoverCard for a read-only preview.',
  },
  Progress: {
    when: 'Use to communicate how much of a task, upload, or process has completed.',
    distinction:
      'Use ScrollProgress for document position, Meter for a stable measurement, Spinner for indeterminate short waits, or Skeleton while page structure is loading.',
  },
  Prose: {
    when: 'Use around rendered Markdown, CMS content, or other long-form content you do not style element by element.',
    distinction:
      'Use Typography for a deliberately composed article surface with Lumen’s heading and paragraph rhythm.',
  },
  Schedule: {
    when: 'Use to arrange events across time slots, days, or resources when people need to review or change when work happens.',
    distinction:
      'Use Calendar for choosing dates and Agenda for a chronological list. Schedule is the time-grid surface for positioned events, conflicts, drag and drop, and rescheduling workflows.',
  },
  ScrollProgress: {
    when: 'Use on long reading surfaces when readers benefit from knowing how far they have moved through the current document.',
    distinction:
      'Use Progress for task completion supplied by application state. ScrollProgress derives its value from the document scroll position.',
  },
  Segmented: {
    when: 'Use for a small set of mutually exclusive views or values that should remain visible at once.',
    distinction:
      'Use RadioGroup for form choices, Select when space is limited, or ToggleGroup when multiple options may be active.',
  },
  Select: {
    when: 'Use for choosing one value from a controlled list with Lumen’s enhanced presentation.',
    distinction: 'Use NativeSelect for platform-native behavior and Combobox when the option list needs text search.',
  },
  Sheet: {
    when: 'Use for secondary details or workflows that stay visually connected to the current page.',
    distinction:
      'Use Drawer for navigation or filters that slide in, and Dialog for a centered task that demands focus.',
  },
  SkipLink: {
    when: 'Place it as the first focusable element in your root layout, before repeated header, menu, or sidebar navigation. It stays visually hidden until a keyboard user focuses it.',
    distinction:
      'This is an accessibility shortcut, not visible navigation. Point its href to the main content target; the first Tab reveals the link, and activating it moves focus past the repeated navigation.',
  },
  Spinner: {
    when: 'Use for a short wait when progress cannot be measured.',
    distinction:
      'Use Progress when completion can be quantified and Skeleton when reserving the shape of loading content.',
  },
  Sparkline: {
    when: 'Use beside a metric when a compact trend adds meaning and at least two valid samples exist.',
    distinction: 'Use LineChart when axes, multiple series, thresholds, exact values, or a data table are important.',
  },
  Stat: {
    when: 'Use to pair one prominent metric with its concise label.',
    distinction:
      'Use as="article" when the metric and its supporting content stand alone. Use variant="accent" for a featured metric and variant="glass" on a selective translucent surface. Use Chart when the trend or relationship matters, or Descriptions for several equally weighted key–value facts.',
  },
  Switch: {
    when: 'Use for a setting that takes effect immediately when turned on or off.',
    distinction:
      'Use Checkbox for form submission or agreement, and Toggle for a persistent tool state such as bold or pin.',
  },
  Toast: {
    when: 'Use for brief, non-blocking feedback after an action or background event.',
    distinction:
      'Use Alert when the message must remain in the page. The toast runtime creates its notification viewport automatically when needed.',
  },
  Toggle: {
    when: 'Use for a control that keeps an active state, such as pin, mute, or formatting.',
    distinction: 'Use Switch for an immediate setting and Checkbox for a form value or agreement.',
  },
  ToggleGroup: {
    when: 'Use to organize related pressed-state controls with shared keyboard navigation.',
    distinction:
      'Use Segmented for one mutually exclusive view/value and ButtonGroup for actions that do not retain selection.',
  },
  Tooltip: {
    when: 'Use for a short, non-interactive explanation of an icon or compact control.',
    distinction: 'Use HoverCard for a richer preview and Popover for interactive floating content.',
  },
  Typography: {
    when: 'Wrap hand-authored headings, paragraphs, lists, blockquotes, and links when they should share Lumen’s text color, spacing, and reading rhythm.',
    distinction:
      'Typography is a styling-only div: it does not choose heading levels, add article semantics, constrain line length, or render Markdown. Keep semantic HTML inside it. Use Prose for rendered Markdown or CMS content and its readable 65ch width.',
  },
  TreeGrid: {
    when: 'Use when hierarchical rows also need aligned columns, such as a file tree with size and status.',
    distinction: 'Use Tree for hierarchy without columns and DataTable for flat interactive records.',
  },
}

export const componentDocs: ComponentDoc[] = (
  [
    [
      'Accordion',
      'Layout',
      'Stacks collapsible content sections.',
      '<Accordion><details open><summary>Billing</summary><p>Invoices and payment methods.</p></details></Accordion>',
    ],
    [
      'Alert',
      'Feedback',
      'Surfaces contextual status messages.',
      '<Alert><strong>Project synced.</strong><p>Your tokens are available.</p></Alert>',
    ],
    [
      'AlertDialog',
      'Overlays',
      'Confirms destructive or high-commitment actions.',
      '<Button data-ui-alert-dialog-trigger="delete-project">Delete</Button><AlertDialog id="delete-project"><h2>Delete this project?</h2><Button data-ui-alert-dialog-close>Cancel</Button></AlertDialog>',
    ],
    [
      'Agenda',
      'Data display',
      'Lists upcoming appointments, tasks, or dated events.',
      '<Agenda><header><h2>Today</h2></header><ol><li><strong>Design review</strong><span>10:00</span></li></ol></Agenda>',
    ],
    [
      'AspectRatio',
      'Layout',
      'Keeps media and embeds in a predictable ratio.',
      '<AspectRatio ratio="16/9"><img src="/logo.svg" alt="Lumen logo" /></AspectRatio>',
    ],
    [
      'Attachment',
      'Data display',
      'Displays a file attachment with metadata.',
      '<Attachment href="/logo.svg"><strong>lumen-logo.svg</strong><span>1 KB</span></Attachment>',
    ],
    [
      'Autocomplete',
      'Forms',
      'Captures searchable text connected to suggestions.',
      '<Autocomplete list="cities" placeholder="Search city" /><datalist id="cities"><option value="Bogota" /></datalist>',
    ],
    [
      'Avatar',
      'Data display',
      'Represents a person, team, or entity.',
      '<Avatar src="/icon.svg" alt="Lumen">LU</Avatar>',
    ],
    [
      'BackToTop',
      'Navigation',
      'Returns user to the top of the page.',
      '<BackToTop aria-label="Back to top">↑ Top</BackToTop>',
    ],
    [
      'Badge',
      'Data display',
      'Labels status, type, plan, or count information.',
      '<Badge variant="secondary">Astro</Badge>',
    ],
    [
      'BarChart',
      'Data display',
      'Compares categorical or discrete-period values with grouped and stacked bars.',
      '<BarChart aria-label="Downloads by project" heading="Package downloads" orientation="horizontal" series={[{ id: "downloads", label: "Downloads", data: [{ x: "Lumen", y: 18420 }, { x: "Observatory", y: 6320 }] }]} />',
    ],
    [
      'Breadcrumb',
      'Navigation',
      'Shows page hierarchy and parent navigation.',
      '<Breadcrumb><ol><li><a href="/docs">Docs</a></li><li><span aria-current="page">Components</span></li></ol></Breadcrumb>',
    ],
    [
      'Bubble',
      'Data display',
      'Frames chat messages and short comments.',
      '<Bubble from="user">Can you summarize the release?</Bubble>',
    ],
    [
      'Button',
      'Actions',
      'Triggers primary, secondary, destructive, and quiet actions.',
      '<Button variant="default">Save changes</Button><Button variant="secondary">Cancel</Button>',
    ],
    [
      'ButtonGroup',
      'Actions',
      'Groups related button actions.',
      '<ButtonGroup><Button variant="secondary">Back</Button><Button>Publish</Button></ButtonGroup>',
    ],
    [
      'Calendar',
      'Forms',
      'Presents a calendar surface for date selection.',
      '<Calendar aria-label="Choose a delivery date" />',
    ],
    [
      'Callout',
      'Feedback',
      'Emphasizes an important explanation, caveat, or instruction within page content.',
      '<Callout><strong>Runtime required</strong><p>Mount UIPrimitives once in your root layout.</p></Callout>',
    ],
    [
      'Card',
      'Layout',
      'Frames a focused item, metric, plan, or form.',
      '<Card><h2>Starter</h2><p>For personal projects.</p></Card>',
    ],
    [
      'Carousel',
      'Layout',
      'Displays a horizontal sequence of slides.',
      '<Carousel aria-label="Featured templates"><article>Dashboard</article><article>Portfolio</article></Carousel>',
    ],
    [
      'Chart',
      'Data display',
      'Frames metric headers, SVG plots, and captions for lightweight data visualization.',
      '<Chart aria-label="Revenue"><header><h3>Revenue</h3><strong data-ui-chart-value>$128K</strong></header><svg viewBox="0 0 120 40" role="img" aria-label="Revenue trend"><path d="M0 35 L30 26 L60 18 L90 22 L120 8" fill="none" stroke="currentColor" stroke-width="3" /></svg><figcaption>Revenue is up 42% since Q1.</figcaption></Chart>',
    ],
    [
      'Checkbox',
      'Forms',
      'Captures a binary form value.',
      '<label><Checkbox name="updates" /> Email me product updates</label>',
    ],
    [
      'Collapsible',
      'Layout',
      'Shows and hides one optional content region.',
      '<Collapsible><summary>Advanced filters</summary><p>Filter controls</p></Collapsible>',
    ],
    [
      'Code',
      'Data display',
      'Renders inline code and framed code blocks with theme-aware palettes.',
      '<Code code={`const theme = "lumen";\nconst accent = "hsl(var(--accent))";`} variant="block" language="ts" label="theme.ts" copy />',
    ],
    [
      'CodeTabs',
      'Data display',
      'Groups related code examples into accessible, persistent tabs.',
      '<CodeTabs ariaLabel="Package manager" items={[{ value: "pnpm", label: "pnpm", code: "pnpm add @santi020k/lumen-astro", language: "bash" }, { value: "npm", label: "npm", code: "npm install @santi020k/lumen-astro", language: "bash" }]} storageKey="preferred-package-manager" />',
    ],
    [
      'Combobox',
      'Forms',
      'Combines text entry and option selection.',
      '<Combobox label="Framework" list="framework-options" options={["Astro", { label: "React", value: "react" }, { label: "Vue", value: "vue", disabled: true }]} placeholder="Search package" />',
    ],
    [
      'Command',
      'Navigation',
      'Builds command palettes and filterable action lists.',
      '<Command><Input placeholder="Type a command..." /><button data-ui-command-item>Open docs</button></Command>',
    ],
    [
      'ContextMenu',
      'Overlays',
      'Provides contextual actions for a selected object.',
      '<ContextMenu><button role="menuitem">Duplicate</button></ContextMenu>',
    ],
    [
      'ColorPicker',
      'Forms',
      'Captures a color token or brand swatch value.',
      '<ColorPicker name="brand" aria-label="Brand color" value="#2563eb" />',
    ],
    [
      'DataTable',
      'Data display',
      'Styles dense tabular data and records.',
      '<DataTable><table><thead><tr><th>Name</th><th>Status</th></tr></thead><tbody><tr><td>Docs</td><td>Ready</td></tr></tbody></table></DataTable>',
    ],
    [
      'DatePicker',
      'Forms',
      'Selects a date from a polished, accessible Calendar popover.',
      '<DatePicker name="launchDate" aria-label="Launch date" />',
    ],
    [
      'DateRangePicker',
      'Forms',
      'Selects a start and end date through a cohesive pair of custom Calendar popovers.',
      '<DateRangePicker><DatePicker aria-label="Start date" /><DatePicker aria-label="End date" /></DateRangePicker>',
    ],
    [
      'Dialog',
      'Overlays',
      'Presents modal content for focused tasks.',
      '<Button data-ui-dialog-trigger="profile-dialog">Edit profile</Button><Dialog id="profile-dialog"><p>Profile form</p><Button data-ui-dialog-close>Close</Button></Dialog>',
    ],
    [
      'Direction',
      'Layout',
      'Controls directional layout and text flow.',
      '<Direction dir="rtl"><p>Localized content</p></Direction>',
    ],
    [
      'Drawer',
      'Overlays',
      'Slides in supporting navigation, filters, or task panels.',
      '<Button data-ui-drawer-trigger="filters-drawer">Open filters</Button><Drawer id="filters-drawer"><p>Filter controls</p><Button data-ui-drawer-close>Close</Button></Drawer>',
    ],
    [
      'DropdownMenu',
      'Overlays',
      'Shows compact actions from a trigger.',
      '<DropdownMenu><Button data-ui-trigger>More</Button><div role="menu"><button role="menuitem">Rename</button></div></DropdownMenu>',
    ],
    [
      'Empty',
      'Feedback',
      'Explains an empty state and next action.',
      '<Empty><h2>No projects yet</h2><p>Create your first workspace.</p></Empty>',
    ],
    [
      'Eyebrow',
      'Data display',
      'Introduces or categorizes the heading that immediately follows it.',
      '<header><Eyebrow>Framework guide</Eyebrow><h2>Build with Astro</h2></header>',
    ],
    [
      'Field',
      'Forms',
      'Groups labels, controls, descriptions, and errors.',
      '<Field><Label for="email">Email</Label><Input id="email" type="email" /></Field>',
    ],
    [
      'FloatingBadge',
      'Data display',
      'Shows a high-emphasis notification count over an icon, avatar, or control.',
      '<span style="position: relative"><Button aria-label="Inbox">Inbox</Button><FloatingBadge style="position: absolute; right: -0.5rem; top: -0.5rem">12</FloatingBadge></span>',
    ],
    [
      'FormattedDate',
      'Data display',
      'Pairs human-readable date text with a machine-readable datetime value.',
      '<FormattedDate datetime="2026-07-23">July 23, 2026</FormattedDate>',
    ],
    [
      'HoverCard',
      'Overlays',
      'Shows extra context on hover and focus.',
      '<HoverCard><a href="/team/santiago">Santiago</a><div role="tooltip">Maintainer of Lumen UI.</div></HoverCard>',
    ],
    [
      'Icon',
      'Data display',
      'Renders Lucide icons with Lumen sizing and accessibility defaults.',
      '<Icon name="search" label="Search" /><Icon name="wand-sparkles" decorative />',
    ],
    [
      'Image',
      'Data display',
      'Styles accessible images while preserving Astro, Next.js, and browser-native optimization.',
      '<Image alt="Lumen UI logo" invertOnDark layout="fixed" src="/logo.svg" />',
    ],
    [
      'Input',
      'Forms',
      'Captures short text, email, password, search, or numeric values.',
      '<Input id="email" name="email" type="email" placeholder="you@example.com" />',
    ],
    [
      'InputGroup',
      'Forms',
      'Combines inputs with prefixes, suffixes, or controls.',
      '<InputGroup><span>https://</span><Input aria-label="Domain" placeholder="example.com" /></InputGroup>',
    ],
    [
      'InputOTP',
      'Forms',
      'Collects one-time passcodes and verification codes.',
      '<InputOTP name="code" length={6} inputmode="numeric" />',
    ],
    [
      'Item',
      'Data display',
      'Aligns primary content, supporting metadata, and optional actions in a compact row.',
      '<Item><strong>Production docs</strong><span>Ready for review</span></Item>',
    ],
    ['Kbd', 'Data display', 'Displays keyboard shortcuts.', '<p>Open the command menu with <Kbd>Cmd K</Kbd>.</p>'],
    [
      'Label',
      'Forms',
      'Labels form controls with consistent spacing.',
      '<Label for="workspace">Workspace name</Label><Input id="workspace" />',
    ],
    [
      'Link',
      'Navigation',
      'Styles ordinary text navigation while preserving native anchor behavior.',
      '<Link href="/docs">Read the documentation</Link>',
    ],
    [
      'LineChart',
      'Data display',
      'Shows ordered trends, multiple series, missing-value gaps, areas, markers, and reference values.',
      '<LineChart aria-label="Website traffic" heading="Page views and visits" series={[{ id: "views", label: "Page views", data: [{ x: "Mon", y: 120 }, { x: "Tue", y: 168 }] }, { id: "visits", label: "Visits", data: [{ x: "Mon", y: 82 }, { x: "Tue", y: 104 }] }]} />',
    ],
    [
      'Marker',
      'Data display',
      'Highlights status, position, or annotations.',
      '<Marker variant="success">Live</Marker>',
    ],
    [
      'Menubar',
      'Navigation',
      'Creates horizontal application menus.',
      '<Menubar><button role="menuitem">File</button><button role="menuitem">View</button></Menubar>',
    ],
    [
      'Message',
      'Data display',
      'Structures a chat, activity, or system message.',
      '<Message><Avatar>LM</Avatar><Bubble>Lumen components are installed.</Bubble></Message>',
    ],
    [
      'MessageScroller',
      'Layout',
      'Provides a scrollable message feed.',
      '<MessageScroller><Message>First event</Message><Message>Second event</Message></MessageScroller>',
    ],
    [
      'NativeSelect',
      'Forms',
      'Styles the browser-native select element.',
      '<NativeSelect name="plan" options={["Free", "Pro", "Team"]} />',
    ],
    [
      'NavigationMenu',
      'Navigation',
      'Builds grouped top-level navigation.',
      '<NavigationMenu><a href="/docs">Docs</a><a href="/docs/components">Components</a></NavigationMenu>',
    ],
    [
      'NumberField',
      'Forms',
      'Captures constrained numeric values.',
      '<NumberField min="1" max="10" step="1" aria-label="Seats" />',
    ],
    [
      'Pagination',
      'Navigation',
      'Moves through paginated records or result sets.',
      '<Pagination><a href="?page=1">Previous</a><a aria-current="page" href="?page=2">2</a><a href="?page=3">Next</a></Pagination>',
    ],
    [
      'PhoneInput',
      'Forms',
      'Pairs a country dial-code select with a telephone number input.',
      '<PhoneInput name="phone" countryValue="+1" countries={[{ label: "+1", value: "+1" }, { label: "+44", value: "+44" }]} placeholder="(555) 000-0000" />',
    ],
    [
      'PieChart',
      'Data display',
      'Shows part-to-whole relationships as an accessible donut or pie chart.',
      '<PieChart aria-label="Framework share" centerLabel="Projects" centerValue="2,480" heading="Framework usage" series={{ id: "frameworks", label: "Framework share", data: [{ label: "Astro", x: "astro", y: 46 }, { label: "React", x: "react", y: 31 }, { label: "Web Components", x: "elements", y: 23 }] }} />',
    ],
    [
      'Pill',
      'Data display',
      'Pairs a rounded text label with an optional trailing count.',
      '<Pill count={12} variant="brand">Notifications</Pill>',
    ],
    [
      'Popover',
      'Overlays',
      'Displays lightweight floating content from a trigger.',
      '<Popover><Button data-ui-trigger>Invite</Button><div>Email form</div></Popover>',
    ],
    [
      'Progress',
      'Feedback',
      'Shows completion, loading progress, or quota usage.',
      '<Progress value={64} max={100} aria-label="Upload progress" />',
    ],
    [
      'Prose',
      'Layout',
      'Adds readable spacing and typography to rendered Markdown or CMS content.',
      '<Prose><h2>Release notes</h2><p>Long-form content receives consistent reading rhythm.</p></Prose>',
    ],
    [
      'RadioGroup',
      'Forms',
      'Groups mutually exclusive options.',
      '<RadioGroup><label><input type="radio" name="theme" value="light" /> Light</label><label><input type="radio" name="theme" value="dark" /> Dark</label></RadioGroup>',
    ],
    [
      'Resizable',
      'Layout',
      'Frames panes that can be resized.',
      '<Resizable><aside>Navigation</aside><main>Editor</main></Resizable>',
    ],
    [
      'RichTextEditor',
      'Forms',
      'Frames rich text toolbar and editing compositions.',
      '<RichTextEditor><div role="toolbar"><ButtonGroup><Button data-ui-editor-command="bold">B</Button><Button data-ui-editor-command="italic">I</Button></ButtonGroup></div><div contenteditable="true">Draft release notes...</div></RichTextEditor>',
    ],
    [
      'ScrollArea',
      'Layout',
      'Provides a styled scroll container.',
      '<ScrollArea style="max-height: 18rem"><p>Long release notes...</p></ScrollArea>',
    ],
    [
      'ScrollProgress',
      'Feedback',
      'Shows the reader’s current position in a long document.',
      '<ScrollProgress aria-label="Article reading progress" />',
    ],
    [
      'Schedule',
      'Data display',
      'Displays calendar events across day, week, or resource grids.',
      '<Schedule><header><h2>Launch week</h2></header><div data-ui-schedule-grid><article data-ui-schedule-event>Planning</article><article data-ui-schedule-event>Ship</article></div></Schedule>',
    ],
    [
      'SearchField',
      'Forms',
      'Captures search queries with native search semantics.',
      '<SearchField name="q" placeholder="Search docs" />',
    ],
    [
      'Select',
      'Forms',
      'Provides an enhanced single-choice list when text search is not needed.',
      '<Select name="framework" options={["Astro", "React", "Web Components"]} placeholder="Choose a framework" />',
    ],
    [
      'Separator',
      'Layout',
      'Creates a semantic visual boundary between adjacent content groups.',
      '<section>Account settings</section><Separator /><section>Danger zone</section>',
    ],
    [
      'Sheet',
      'Overlays',
      'Shows a side sheet for secondary flows.',
      '<Button data-ui-sheet-trigger="details-sheet">Open details</Button><Sheet id="details-sheet"><p>Details panel</p><Button data-ui-sheet-close>Close</Button></Sheet>',
    ],
    [
      'Sidebar',
      'Navigation',
      'Builds persistent app navigation.',
      '<Sidebar><a href="/dashboard">Dashboard</a><a href="/settings">Settings</a></Sidebar>',
    ],
    [
      'Skeleton',
      'Feedback',
      'Reserves space during loading states.',
      '<Skeleton style="height: 2.5rem" aria-label="Loading profile" />',
    ],
    [
      'SkipLink',
      'Navigation',
      'Lets keyboard users bypass repeated navigation and move directly to main content.',
      '<SkipLink href="#main">Skip to main content</SkipLink>',
    ],
    [
      'Slider',
      'Forms',
      'Captures numeric values across a bounded range.',
      '<Slider name="opacity" min="0" max="100" value="80" />',
    ],
    [
      'Sparkline',
      'Data display',
      'Shows a compact, text-labelled trend beside an existing metric.',
      '<Sparkline label="Downloads increased from 42 to 91" values={[42, 48, 63, 58, 74, 91]} area />',
    ],
    ['Spinner', 'Feedback', 'Indicates short loading states.', '<Spinner aria-label="Saving" />'],
    [
      'Switch',
      'Forms',
      'Toggles a single setting on or off.',
      '<Switch name="notifications" aria-label="Enable notifications" />',
    ],
    [
      'Table',
      'Data display',
      'Styles semantic tables for records and comparisons.',
      '<Table><thead><tr><th>Package</th><th>Status</th></tr></thead><tbody><tr><td>Astro</td><td>Complete</td></tr></tbody></Table>',
    ],
    [
      'Tabs',
      'Navigation',
      'Switches between related panels.',
      '<Tabs><div role="tablist"><button role="tab" aria-selected="true">Preview</button></div><section role="tabpanel">Preview content</section></Tabs>',
    ],
    [
      'TagGroup',
      'Forms',
      'Groups removable or selectable tags.',
      '<TagGroup><span data-ui-tag role="listitem">Astro</span><span data-ui-tag role="listitem">Accessible</span></TagGroup>',
    ],
    [
      'Textarea',
      'Forms',
      'Captures longer free-form text.',
      '<Textarea name="notes" rows={5} placeholder="Add release notes..." />',
    ],
    [
      'ThemeBuilder',
      'Data display',
      'Builds scoped token previews with hue, scheme, manual color, and export controls.',
      '<ThemeBuilder data-ui-theme-target="#preview"><input data-ui-theme-brand-hue type="range" min="0" max="359" value="264" /><button data-ui-theme-export type="button">Copy CSS</button><textarea data-ui-theme-output></textarea></ThemeBuilder>',
    ],
    [
      'ThemeToggle',
      'Actions',
      'Switches between the configured light and dark color themes.',
      '<ThemeToggle>Switch theme</ThemeToggle>',
    ],
    ['TimeField', 'Forms', 'Captures a native time value.', '<TimeField name="startTime" aria-label="Start time" />'],
    [
      'Toast',
      'Feedback',
      'Displays temporary feedback for background actions.',
      '<Toast><strong>Saved</strong><p>Your changes are live.</p></Toast>',
    ],
    [
      'Toggle',
      'Actions',
      'Keeps the pressed state of a tool action such as pin, mute, or bold.',
      '<Toggle aria-label="Pin project" pressed={false}>Pin</Toggle>',
    ],
    [
      'ToggleGroup',
      'Actions',
      'Coordinates related pressed-state controls with shared keyboard navigation.',
      '<ToggleGroup><Toggle>Grid</Toggle><Toggle pressed>List</Toggle><Toggle>Compact</Toggle></ToggleGroup>',
    ],
    [
      'Tooltip',
      'Overlays',
      'Adds concise helper text to compact controls.',
      '<Tooltip><button aria-label="Save changes">Save</button><span role="tooltip">Save changes</span></Tooltip>',
    ],
    [
      'Tree',
      'Data display',
      'Displays hierarchical navigation or object collections.',
      '<Tree><div role="treeitem" aria-expanded="true">src</div><div role="treeitem">index.ts</div></Tree>',
    ],
    [
      'TreeGrid',
      'Data display',
      'Displays hierarchical rows with grid-like columns.',
      '<TreeGrid><div role="row"><span role="gridcell">Docs</span><span role="gridcell">Ready</span></div></TreeGrid>',
    ],
    [
      'Typography',
      'Layout',
      'Gives hand-authored semantic text consistent Lumen spacing, color, and reading rhythm.',
      '<article aria-labelledby="release-notes-title"><Typography><h2 id="release-notes-title">Release notes</h2><p>Lumen now includes production documentation.</p><ul><li>Live component examples</li><li>Framework-specific usage</li></ul></Typography></article>',
    ],
    [
      'VirtualList',
      'Data display',
      'Frames long scrollable collections for virtualization adapters.',
      '<VirtualList style="--ui-list-height: 16rem"><div>Row 1</div><div>Row 2</div></VirtualList>',
    ],
    [
      'LanguageToggle',
      'Actions',
      'Presents the current locale as a compact control for changing language.',
      '<LanguageToggle aria-label="Change language">EN</LanguageToggle>',
    ],
    [
      'Particles',
      'Layout',
      'Adds a density-controlled decorative particle field behind foreground content.',
      '<div style="position: relative"><Particles density="medium" /><h2>Launch faster</h2></div>',
    ],
    [
      'AnimatedNumber',
      'Data display',
      'Animates a formatted metric while keeping one stable accessible value.',
      '<AnimatedNumber value={1234} prefix="$" />',
    ],
    [
      'RevealGroup',
      'Layout',
      'Reveals a group of direct children with tokenized, reduced-motion-aware staggering.',
      '<RevealGroup stagger={80}><Card>Plan</Card><Card>Build</Card><Card>Ship</Card></RevealGroup>',
    ],
    [
      'ScrollReveal',
      'Layout',
      'Animates wrapped content as it first enters the viewport.',
      '<ScrollReveal animation="slide-up"><article>New release highlights</article></ScrollReveal>',
    ],
    [
      'Stat',
      'Data display',
      'Pairs one prominent metric with a concise descriptive label.',
      '<Stat label="Active workspaces" value="1,234" variant="accent" />',
    ],
    [
      'Meter',
      'Data display',
      'Displays a scalar value within a known range.',
      '<Meter aria-label="Storage used" value={64} min={0} max={100}>64%</Meter>',
    ],
    [
      'Note',
      'Data display',
      'Keeps supplementary information visually attached to nearby content.',
      '<Note label="Compatibility">Requires Safari 16.4 or newer.</Note>',
    ],
    [
      'Rating',
      'Data display',
      'Collects or presents a bounded star-based score.',
      '<Rating aria-label="Rate this component" value={4} max={5} />',
    ],
    [
      'Timeline',
      'Data display',
      'Orders milestones or activity events along a chronological track.',
      '<Timeline><TimelineItem><strong>10:00</strong> Design approved</TimelineItem><TimelineItem><strong>14:30</strong> Release deployed</TimelineItem></Timeline>',
    ],
    [
      'AnimatedLogo',
      'Brand',
      'Reveals any inline SVG logo with accessible, reduced-motion-aware animation.',
      '<AnimatedLogo><svg role="img" aria-label="Acme" viewBox="0 0 120 32">...</svg></AnimatedLogo>',
    ],
    [
      'AnimatedPortrait',
      'Brand',
      'Presents a portrait with optional motion and floating profile facts.',
      '<AnimatedPortrait src="/portrait.jpg" alt="Portrait of Ana" showFloatingBadges />',
    ],
    [
      'ButtonLink',
      'Navigation',
      'Gives navigation the visual emphasis of a button while retaining anchor semantics.',
      '<ButtonLink href="/docs" showArrow>Read the docs</ButtonLink>',
    ],
    [
      'CoverImage',
      'Data display',
      'Presents responsive editorial artwork with optional hover lift and gradient treatment.',
      '<CoverImage image={cover} alt="Abstract purple forms" showBottomGradient />',
    ],
    [
      'GradientDivider',
      'Layout',
      'Separates sections with a decorative brand-colored gradient line.',
      '<section>Overview</section><GradientDivider /><section>Details</section>',
    ],
    [
      'Stepper',
      'Navigation',
      'Shows a person’s current position and progress through an ordered multi-step flow.',
      '<Stepper steps={["Account", "Workspace", "Review"]} currentStep={1} />',
    ],
    [
      'FileUpload',
      'Forms',
      'Collects files through a picker or drag-and-drop target.',
      '<FileUpload accept="image/*" aria-label="Upload profile image" />',
    ],
    [
      'Tour',
      'Overlays',
      'Guides people through product features using a sequence of anchored steps.',
      '<Tour steps={[{ target: "#publish", content: "Publish your changes when they are ready." }]} />',
    ],
    [
      'Anchor',
      'Navigation',
      'Links to sections within a long page and exposes the page’s local structure.',
      '<Anchor items={[{ href: "#installation", label: "Installation", depth: 2 }, { href: "#usage", label: "Usage", depth: 3 }]} />',
    ],
    [
      'Segmented',
      'Forms',
      'Presents a small, always-visible set of mutually exclusive values.',
      '<Segmented options={["Day", "Week", "Month"]} aria-label="Calendar view" />',
    ],
    [
      'Toolbar',
      'Layout',
      'Groups frequently used controls into one compact action row.',
      '<Toolbar aria-label="Text formatting"><Button>Bold</Button><Button>Italic</Button></Toolbar>',
    ],
    [
      'Descriptions',
      'Data display',
      'Presents a set of labeled facts as an aligned key–value list.',
      '<Descriptions items={[{ label: "Owner", value: "Alice" }, { label: "Status", value: "Active" }]} />',
    ],
    [
      'Popconfirm',
      'Overlays',
      'Requests a brief confirmation beside the action that triggered it.',
      '<Popconfirm title="Delete this item?" confirmLabel="Delete"><Button variant="destructive">Delete</Button></Popconfirm>',
    ],
    [
      'Transfer',
      'Forms',
      'Moves selected items between available and chosen collections.',
      '<Transfer sourceTitle="Available members" targetTitle="Project members" items={[{ key: "1", label: "Ana" }]} />',
    ],
    [
      'Cascader',
      'Forms',
      'Selects one value by drilling through dependent levels of a hierarchy.',
      '<Cascader placeholder="Choose location" options={[{ label: "Colombia", value: "co", children: [{ label: "Bogotá", value: "bog" }] }]} />',
    ],
    [
      'TreeSelect',
      'Forms',
      'Selects nodes from a branching hierarchy inside a dropdown.',
      '<TreeSelect placeholder="Choose team" treeData={[{ label: "Design", value: "design", children: [{ label: "Research", value: "research" }] }]} />',
    ],
    [
      'Mentions',
      'Forms',
      'Captures multi-line text with suggestions triggered by @ mentions.',
      '<Mentions placeholder="Comment and @mention a teammate" options={["alice", "bob", "carol"]} />',
    ],
    [
      'QRCode',
      'Data display',
      'Renders a scannable QR code for a URL or other short value.',
      '<QRCode value="https://example.com" size={160} aria-label="Open example.com" />',
    ],
    [
      'Watermark',
      'Layout',
      'Overlays a text or image watermark on content.',
      '<Watermark content="Draft"><div>Content</div></Watermark>',
    ],
    [
      'Affix',
      'Layout',
      'Keeps important controls visible after their original position scrolls out of view.',
      '<Affix offset={64}><Button>Save draft</Button></Affix>',
    ],
    [
      'SpeedDial',
      'Navigation',
      'Expands a floating primary action into a compact set of related actions.',
      '<SpeedDial actions={[{ icon: "file-plus-2", label: "New document" }, { icon: "folder-plus", label: "New folder" }]} label="Create new" />',
    ],
  ] as const satisfies readonly ComponentDocTuple[]
).map(([name, category, summary, example]) => ({
  apiReference: [
    ...(glassApiComponentNameSet.has(name) ? [glassApiRow] : []),
    ...apiReferenceByComponent[name],
    ...commonApiRows,
  ],
  ...(figmaNodeIdByComponent[name] ? { figmaNodeId: figmaNodeIdByComponent[name] } : {}),
  glass: glassComponentNameSet.has(name),
  ...(componentGuidanceByName[name] ? { guidance: componentGuidanceByName[name] } : {}),
  ...(keyboardInteractionsByComponent[name]
    ? { keyboardInteractions: [...keyboardInteractionsByComponent[name]] }
    : {}),
  name,
  category,
  ...(runtimeEventsByComponent[name] ? { runtimeEvents: [...runtimeEventsByComponent[name]] } : {}),
  summary,
  example,
}))

export const componentCategories = [...new Set(componentDocs.map((component) => component.category))].sort()

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

interface ReactHookApiRow {
  defaultValue: string
  description: string
  name: string
  type: string
}

const hookApiRow = (name: string, type: string, defaultValue: string, description: string): ReactHookApiRow => ({
  defaultValue,
  description,
  name,
  type,
})

export const reactHooksReference: ReactHookDoc[] = [
  {
    name: 'useDialog',
    description:
      'Manages modal and alert dialog lifecycle — open, close, focus trapping, backdrop click dismiss, and Escape key handling. Spreads props onto a <dialog> element.',
    options: [
      hookApiRow('alert', 'boolean', 'false', 'Render as an alert dialog that blocks backdrop-click dismiss.'),
      hookApiRow('defaultOpen', 'boolean', 'false', 'Initial open state for uncontrolled usage.'),
      hookApiRow(
        'open',
        'boolean',
        '-',
        'Controlled open state. When provided the hook does not manage open internally.',
      ),
      hookApiRow('onOpenChange', '(open: boolean) => void', '-', 'Callback fired when the open state changes.'),
      hookApiRow('id', 'string', 'auto', 'Explicit id for the dialog element.'),
    ],
    controller: [
      hookApiRow(
        'dialogProps',
        'LumenProps<"dialog">',
        '-',
        'Spread onto the <dialog> element. Includes aria-modal, data attributes, click and keydown handlers.',
      ),
      hookApiRow(
        'triggerProps',
        'LumenProps<"button">',
        '-',
        'Spread onto the trigger button. Binds the click handler that opens the dialog.',
      ),
      hookApiRow('closeProps', 'LumenProps<"button">', '-', 'Spread onto any close button inside the dialog.'),
      hookApiRow('dialogRef', 'RefObject<HTMLDialogElement>', '-', 'Ref to the dialog DOM element.'),
      hookApiRow('triggerRef', 'RefObject<HTMLElement>', '-', 'Ref to the trigger DOM element.'),
      hookApiRow('open', 'boolean', '-', 'Current open state.'),
      hookApiRow('close', '() => void', '-', 'Imperatively close the dialog.'),
      hookApiRow('setOpen', 'Dispatch<SetStateAction<boolean>>', '-', 'State setter for controlled usage.'),
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
}`,
  },
  {
    name: 'usePopover',
    description:
      'Manages popover disclosure — toggle, outside click close, Escape key dismiss, and arrow key navigation through focusable panel items.',
    options: [
      hookApiRow('defaultOpen', 'boolean', 'false', 'Initial open state for uncontrolled usage.'),
      hookApiRow('open', 'boolean', '-', 'Controlled open state.'),
      hookApiRow('onOpenChange', '(open: boolean) => void', '-', 'Callback fired when the open state changes.'),
      hookApiRow('id', 'string', 'auto', 'Explicit id for the panel element.'),
    ],
    controller: [
      hookApiRow('rootProps', 'LumenProps<"div">', '-', 'Spread onto the root wrapper element.'),
      hookApiRow(
        'triggerProps',
        'LumenProps<"button">',
        '-',
        'Spread onto the trigger button. Binds click, ArrowDown, Enter, and Space key handlers.',
      ),
      hookApiRow(
        'panelProps',
        'LumenProps<"div">',
        '-',
        'Spread onto the popover panel. Includes Escape, arrow, Home, and End key handlers.',
      ),
      hookApiRow('rootRef', 'RefObject<HTMLElement>', '-', 'Ref to the root wrapper.'),
      hookApiRow('triggerRef', 'RefObject<HTMLElement>', '-', 'Ref to the trigger element.'),
      hookApiRow('panelRef', 'RefObject<HTMLElement>', '-', 'Ref to the panel element.'),
      hookApiRow('open', 'boolean', '-', 'Current open state.'),
      hookApiRow('close', '() => void', '-', 'Close the popover.'),
      hookApiRow('toggle', '() => void', '-', 'Toggle the popover.'),
      hookApiRow('setOpen', 'Dispatch<SetStateAction<boolean>>', '-', 'State setter for controlled usage.'),
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
}`,
  },
  {
    name: 'useDropdownMenu',
    description:
      'Manages dropdown menu disclosure — identical API to usePopover but sets aria-haspopup to "menu" for correct ARIA semantics on menu triggers.',
    options: [
      hookApiRow('defaultOpen', 'boolean', 'false', 'Initial open state.'),
      hookApiRow('open', 'boolean', '-', 'Controlled open state.'),
      hookApiRow('onOpenChange', '(open: boolean) => void', '-', 'Callback fired when the open state changes.'),
      hookApiRow('id', 'string', 'auto', 'Explicit id for the menu panel.'),
    ],
    controller: [
      hookApiRow('rootProps', 'LumenProps<"div">', '-', 'Spread onto the root wrapper.'),
      hookApiRow(
        'triggerProps',
        'LumenProps<"button">',
        '-',
        'Spread onto the menu trigger. Sets aria-haspopup="menu".',
      ),
      hookApiRow('panelProps', 'LumenProps<"div">', '-', 'Spread onto the menu panel with keyboard navigation.'),
      hookApiRow('open', 'boolean', '-', 'Current open state.'),
      hookApiRow('close', '() => void', '-', 'Close the menu.'),
      hookApiRow('toggle', '() => void', '-', 'Toggle the menu.'),
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
}`,
  },
  {
    name: 'useContextMenu',
    description:
      'Binds a trigger to a context menu that opens on right-click or Shift+F10 and supports Escape and roving item focus.',
    options: [
      hookApiRow('defaultOpen', 'boolean', 'false', 'Initial open state.'),
      hookApiRow('open', 'boolean', '-', 'Controlled open state.'),
      hookApiRow(
        'onOpenChange',
        '(open: boolean) => void',
        '-',
        'Callback fired when the context menu opens or closes.',
      ),
      hookApiRow('id', 'string', 'auto', 'Explicit id for the menu.'),
    ],
    controller: [
      hookApiRow(
        'triggerProps',
        'LumenProps<"button">',
        '-',
        'Spread onto the trigger. Handles contextmenu and Shift+F10.',
      ),
      hookApiRow(
        'menuProps',
        'LumenProps<"menu">',
        '-',
        'Spread onto ContextMenu. Includes data-ui-context-menu, role, hidden state, and keyboard handlers.',
      ),
      hookApiRow('triggerRef', 'RefObject<HTMLElement>', '-', 'Ref to the trigger.'),
      hookApiRow('menuRef', 'RefObject<HTMLElement>', '-', 'Ref to the menu.'),
      hookApiRow('open', 'boolean', '-', 'Current open state.'),
      hookApiRow('openAt', '(x: number, y: number) => void', '-', 'Open the menu at viewport coordinates.'),
      hookApiRow('close', '() => void', '-', 'Close the menu.'),
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
}`,
  },
  {
    name: 'useTabs',
    description:
      'Manages a tabbed interface with controlled/uncontrolled value, arrow key navigation, roving tabindex, and automatic ARIA attributes for tab triggers and panels.',
    options: [
      hookApiRow('defaultValue', 'string', '""', 'Initial active tab value for uncontrolled usage.'),
      hookApiRow('value', 'string', '-', 'Controlled active tab value.'),
      hookApiRow('onValueChange', '(value: string) => void', '-', 'Callback fired when the active tab changes.'),
      hookApiRow(
        'orientation',
        '"horizontal" | "vertical"',
        '"horizontal"',
        'Tab navigation direction — affects which arrow keys are used.',
      ),
      hookApiRow('id', 'string', 'auto', 'Base id for generated tab and panel ids.'),
    ],
    controller: [
      hookApiRow('rootProps', 'LumenProps<"div">', '-', 'Spread onto the tabs root wrapper.'),
      hookApiRow('listProps', 'LumenProps<"div">', '-', 'Spread onto the tablist element.'),
      hookApiRow(
        'getTriggerProps(value)',
        '(value, props?) => LumenProps<"button">',
        '-',
        'Returns props for a tab trigger with the given value. Includes aria-selected, role, keyboard handlers.',
      ),
      hookApiRow(
        'getPanelProps(value)',
        '(value, props?) => LumenProps<"div">',
        '-',
        'Returns props for a tab panel. Automatically hides non-active panels.',
      ),
      hookApiRow('value', 'string', '-', 'Currently active tab value.'),
      hookApiRow('setValue', 'Dispatch<SetStateAction<string>>', '-', 'State setter for controlled usage.'),
      hookApiRow('rootRef', 'RefObject<HTMLElement>', '-', 'Ref to the tabs root element.'),
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
}`,
  },
  {
    name: 'useSelect',
    description:
      'Manages a fully custom select with native <select> fallback, ARIA listbox, typeahead character search, keyboard navigation, and external form integration.',
    options: [
      hookApiRow(
        'options',
        'Array<string | SelectOption>',
        '[]',
        'Available options. Strings are converted to { label, value } objects.',
      ),
      hookApiRow('defaultValue', 'string', '""', 'Initial selected value.'),
      hookApiRow('value', 'string', '-', 'Controlled selected value.'),
      hookApiRow('onValueChange', '(value: string) => void', '-', 'Callback fired when the selected value changes.'),
      hookApiRow('placeholder', 'string', '-', 'Placeholder text shown when no option is selected.'),
      hookApiRow('disabled', 'boolean', 'false', 'Disable the select trigger.'),
      hookApiRow('required', 'boolean', 'false', 'Mark the hidden native select as required for form validation.'),
      hookApiRow('name', 'string', '-', 'Name attribute for the hidden native select.'),
      hookApiRow('id', 'string', 'auto', 'Explicit id for the listbox.'),
    ],
    controller: [
      hookApiRow('rootProps', 'LumenProps<"div">', '-', 'Spread onto the select root wrapper.'),
      hookApiRow(
        'triggerProps',
        'LumenProps<"button">',
        '-',
        'Spread onto the trigger button. Includes keyboard navigation.',
      ),
      hookApiRow('listProps', 'LumenProps<"div">', '-', 'Spread onto the listbox container.'),
      hookApiRow('controlProps', 'LumenProps<"div">', '-', 'Spread onto the visual control wrapper.'),
      hookApiRow(
        'nativeSelectProps',
        'LumenProps<"select">',
        '-',
        'Spread onto a hidden native <select> for form compatibility.',
      ),
      hookApiRow(
        'getOptionProps(option)',
        '(option, props?) => LumenProps<"button">',
        '-',
        'Returns props for an option button.',
      ),
      hookApiRow('selectedOption', 'SelectOption | undefined', '-', 'Currently selected option object.'),
      hookApiRow('triggerText', 'string', '-', 'Display text for the trigger (selected label or placeholder).'),
      hookApiRow('value', 'string', '-', 'Currently selected value.'),
      hookApiRow('options', 'SelectOption[]', '-', 'Normalized options array.'),
      hookApiRow('open', 'boolean', '-', 'Whether the listbox is open.'),
      hookApiRow('close', '() => void', '-', 'Close the listbox.'),
      hookApiRow('selectOption', '(value: string) => void', '-', 'Programmatically select an option by value.'),
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
}`,
  },
  {
    name: 'useTooltip',
    description:
      'Manages tooltip show/hide with configurable delay, hover and focus triggers, and Escape key dismissal.',
    options: [
      hookApiRow('delay', 'number', '400', 'Milliseconds to wait before showing the tooltip on hover.'),
      hookApiRow('defaultOpen', 'boolean', 'false', 'Initial open state.'),
      hookApiRow('open', 'boolean', '-', 'Controlled open state.'),
      hookApiRow('onOpenChange', '(open: boolean) => void', '-', 'Callback fired when the tooltip opens or closes.'),
    ],
    controller: [
      hookApiRow(
        'rootProps',
        'LumenProps<"span">',
        '-',
        'Spread onto the wrapper span. Includes hover and focus listeners.',
      ),
      hookApiRow(
        'tooltipProps',
        'LumenProps<"span">',
        '-',
        'Spread onto the tooltip content span. Includes role="tooltip" and visibility.',
      ),
      hookApiRow('open', 'boolean', '-', 'Current open state.'),
      hookApiRow('close', '() => void', '-', 'Close the tooltip.'),
      hookApiRow('setOpen', 'Dispatch<SetStateAction<boolean>>', '-', 'State setter for controlled usage.'),
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
}`,
  },
  {
    name: 'useToast',
    description:
      'Consumes the ToastProvider context to create, update, and dismiss toast notifications. Requires a ToastProvider ancestor in the component tree.',
    options: [],
    controller: [
      hookApiRow(
        'create',
        '(detail: ToastDetail) => string',
        '-',
        'Create a toast and return its id. Accepts title, description, variant, duration, placement, and an optional action.',
      ),
      hookApiRow(
        'dismiss',
        '(id?: string) => void',
        '-',
        'Dismiss a specific toast by id, or dismiss the most recent toast if no id is provided.',
      ),
      hookApiRow(
        'update',
        '(id: string, detail: ToastDetail) => void',
        '-',
        'Update an existing toast with new content.',
      ),
      hookApiRow('toasts', 'ToastRecord[]', '-', 'Array of all active toast records.'),
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
}`,
  },
  {
    name: 'useFormValidation',
    description:
      'Enhances native HTML form validation with custom error messages via data-error-* attributes, live field description syncing, and programmatic validity control.',
    options: [
      hookApiRow(
        'onValidate',
        '(detail: FormValidationValidateDetail) => void',
        '-',
        'Callback fired when a single control is validated.',
      ),
      hookApiRow(
        'onValid',
        '(detail: FormValidationStateDetail) => void',
        '-',
        'Callback fired when the form becomes valid.',
      ),
      hookApiRow(
        'onInvalid',
        '(detail: FormValidationStateDetail) => void',
        '-',
        'Callback fired when the form has invalid controls.',
      ),
    ],
    controller: [
      hookApiRow(
        'formProps',
        'LumenProps<"form">',
        '-',
        'Spread onto the <form> element. Adds native validation bypass and submit handler.',
      ),
      hookApiRow('formRef', 'RefObject<HTMLFormElement>', '-', 'Ref to the form element.'),
      hookApiRow(
        'getControls',
        '(form?) => NativeFormControl[]',
        '-',
        'Returns all form controls, including inputs, selects, and text areas.',
      ),
      hookApiRow(
        'setFieldValidity',
        '(control, invalid, message?) => void',
        '-',
        'Programmatically set a field as valid or invalid with a custom message.',
      ),
      hookApiRow(
        'validateControl',
        '(control, form?) => boolean',
        '-',
        'Validate a single control and return whether it is valid.',
      ),
      hookApiRow(
        'validateForm',
        '(form?) => NativeFormControl[]',
        '-',
        'Validate all controls and return the array of invalid controls.',
      ),
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
}`,
  },
  {
    name: 'useCalendar',
    description:
      'Builds an Astro-compatible calendar grid with hidden input value, min/max clamping, month navigation, selection, and roving keyboard focus.',
    options: [
      hookApiRow('value', 'string', '-', 'Controlled selected date in YYYY-MM-DD format.'),
      hookApiRow('defaultValue', 'string', '""', 'Initial selected date for uncontrolled usage.'),
      hookApiRow('month', 'string', 'selected month or today', 'Visible month in YYYY-MM format.'),
      hookApiRow('min / max', 'string', '-', 'Inclusive date bounds in YYYY-MM-DD format.'),
      hookApiRow('onValueChange', '(value: string) => void', '-', 'Callback fired when a date is selected.'),
    ],
    controller: [
      hookApiRow('rootProps', 'LumenProps<"div">', '-', 'Spread onto the calendar root.'),
      hookApiRow('inputProps', 'LumenProps<"input">', '-', 'Spread onto the hidden input.'),
      hookApiRow('previousProps / nextProps', 'LumenProps<"button">', '-', 'Spread onto month navigation buttons.'),
      hookApiRow('weeks', 'CalendarDay[][]', '-', 'Six calendar rows of generated day models.'),
      hookApiRow(
        'getDayProps',
        '(day, props?) => LumenProps<"td">',
        '-',
        'Returns gridcell props for a generated day.',
      ),
      hookApiRow('selectDate', '(date) => void', '-', 'Select a date programmatically.'),
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
}`,
  },
  {
    name: 'useDateRangePicker',
    description: 'Keeps paired native date inputs constrained so the end date cannot be before the start date.',
    options: [
      hookApiRow(
        'onRangeChange',
        '(detail: DateRangePickerChangeDetail) => void',
        '-',
        'Callback fired after the date range is synchronized.',
      ),
    ],
    controller: [
      hookApiRow('rootProps', 'LumenProps<"div">', '-', 'Spread onto the date range root.'),
      hookApiRow('rootRef', 'RefObject<HTMLElement>', '-', 'Ref to the date range root.'),
      hookApiRow('getStartProps', '(props?) => LumenProps<"input">', '-', 'Returns props for the start date input.'),
      hookApiRow('getEndProps', '(props?) => LumenProps<"input">', '-', 'Returns props for the end date input.'),
      hookApiRow(
        'syncRange',
        '(root?) => DateRangePickerChangeDetail',
        '-',
        'Synchronize min/max constraints and return the current range.',
      ),
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
}`,
  },
  {
    name: 'useInputOTP',
    description:
      'Builds an Astro-compatible OTP field with a native input, visual segments, sanitized values, and caret navigation.',
    options: [
      hookApiRow('length', 'number', '6', 'Number of visible OTP segments.'),
      hookApiRow('value', 'string', '-', 'Controlled OTP value.'),
      hookApiRow('defaultValue', 'string', '""', 'Initial value for uncontrolled usage.'),
      hookApiRow(
        'onValueChange',
        '(value: string) => void',
        '-',
        'Callback fired when input or paste changes the sanitized value.',
      ),
      hookApiRow(
        'inputMode',
        'string',
        '"numeric"',
        'Native inputMode forwarded to the hidden input. Numeric mode removes non-digits.',
      ),
      hookApiRow('pattern', 'string', '"[0-9]*"', 'Native pattern forwarded to the hidden input.'),
    ],
    controller: [
      hookApiRow('rootProps', 'LumenProps<"div">', '-', 'Spread onto the OTP field root.'),
      hookApiRow('getInputProps', '(props?) => LumenProps<"input">', '-', 'Returns props for the native input.'),
      hookApiRow('segmentsProps', 'LumenProps<"div">', '-', 'Spread onto the visual segment container.'),
      hookApiRow(
        'getSegmentProps',
        '(index, props?) => LumenProps<"button">',
        '-',
        'Returns props for a visual segment button.',
      ),
      hookApiRow(
        'getSegmentChar',
        '(index) => string',
        '-',
        'Returns the character or blank placeholder for a segment.',
      ),
      hookApiRow('setValue', '(value) => string', '-', 'Sanitize and set the current OTP value.'),
    ],
    code: `import { useInputOTP } from '@santi020k/lumen-react'

export function VerificationCode() {
  const otp = useInputOTP({ length: 6, defaultValue: '123456' })

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
}`,
  },
  {
    name: 'useRichTextEditor',
    description:
      'Provides rich text editing commands, values, shortcuts, active toolbar state, and HTML/text change details.',
    options: [
      hookApiRow(
        'onChange',
        '(detail: { html: string, text: string }) => void',
        '-',
        'Callback fired when editable content changes.',
      ),
      hookApiRow(
        'onCommand',
        '(detail: { command, value?, executed }) => void',
        '-',
        'Callback fired when a command is executed.',
      ),
    ],
    controller: [
      hookApiRow('rootProps', 'LumenProps<"section">', '-', 'Spread onto the editor root section.'),
      hookApiRow('rootRef', 'RefObject<HTMLElement>', '-', 'Ref to the editor root.'),
      hookApiRow(
        'executeCommand',
        '(command: string, root?, value?) => boolean',
        '-',
        'Executes a rich text command with an optional value.',
      ),
      hookApiRow(
        'getCommandProps',
        '(command, props?) => LumenProps<"button">',
        '-',
        'Returns props for a toolbar button bound to a command.',
      ),
      hookApiRow(
        'getEditableProps',
        '(props?) => LumenProps<"div">',
        '-',
        'Returns accessible editable props with shortcuts and change handling.',
      ),
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
      <div {...editor.getEditableProps()}>
        <p>Start writing...</p>
      </div>
    </RichTextEditor>
  )
}`,
  },
  {
    name: 'useSchedule',
    description:
      'Provides props for schedule/agenda slot and event elements, and emits change details when a slot or event is interacted with.',
    options: [
      hookApiRow(
        'onChange',
        '(detail: ScheduleChangeDetail) => void',
        '-',
        'Callback fired when a schedule slot or event changes.',
      ),
    ],
    controller: [
      hookApiRow('rootProps', 'LumenProps<"section">', '-', 'Spread onto the schedule root.'),
      hookApiRow('rootRef', 'RefObject<HTMLElement>', '-', 'Ref to the schedule root.'),
      hookApiRow(
        'getSlotProps',
        '(slot, props?) => LumenProps<"section">',
        '-',
        'Returns props for a time slot element.',
      ),
      hookApiRow(
        'getEventProps',
        '(eventId?, props?) => LumenProps<"article">',
        '-',
        'Returns props for an event element.',
      ),
      hookApiRow('emitChange', '(detail, root?) => void', '-', 'Programmatically emit a schedule change detail.'),
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
}`,
  },
  {
    name: 'useResizable',
    description: 'Provides pane sizing props and separator handle props for horizontal or vertical resizable groups.',
    options: [
      hookApiRow('panelCount', 'number', '2', 'Number of panes in the group.'),
      hookApiRow('defaultSizes', 'number[]', 'equal panes', 'Initial pane sizes normalized to 100%.'),
      hookApiRow('minSize', 'number | number[]', '12', 'Minimum pane size percentage.'),
      hookApiRow('maxSize', 'number | number[]', '88', 'Maximum pane size percentage.'),
      hookApiRow(
        'direction',
        '"horizontal" | "vertical"',
        '"horizontal"',
        'Resize axis and generated separator orientation.',
      ),
      hookApiRow('resetOnDoubleClick', 'boolean', 'true', 'Reset panes to their default sizes on handle double-click.'),
      hookApiRow('onSizesChange', '(sizes: number[]) => void', '-', 'Callback fired when panes are resized.'),
    ],
    controller: [
      hookApiRow('rootProps', 'LumenProps<"div">', '-', 'Spread onto the resizable root.'),
      hookApiRow('getPanelProps', '(index, props?) => LumenProps<"div">', '-', 'Returns data/style props for a pane.'),
      hookApiRow(
        'getHandleProps',
        '(index, props?) => LumenProps<"button">',
        '-',
        'Returns separator handle props with pointer and keyboard handlers.',
      ),
      hookApiRow('sizes', 'number[]', '-', 'Current pane sizes as percentages.'),
      hookApiRow(
        'resizePair',
        '(index, nextSize) => void',
        '-',
        'Resize one pane and its following pane while honoring min/max.',
      ),
      hookApiRow('reset', '() => void', '-', 'Reset to the normalized default sizes.'),
    ],
    code: `import { Resizable } from '@santi020k/lumen-react'

export function SplitEditor() {
  return (
    <Resizable defaultSizes={[30, 70]}>
      <aside>Navigation</aside>
      <main>Editor</main>
    </Resizable>
  )
}`,
  },
  {
    name: 'useThemeBuilder',
    description:
      'Interactive theme builder with controllable hue, accent, mode (generated/manual), scheme (light/dark), color pickers, and export in CSS, Figma variables, or design token formats.',
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
      hookApiRow(
        'onThemeChange',
        '(detail: ThemeBuilderChangeDetail) => void',
        '-',
        'Callback when any theme value changes.',
      ),
      hookApiRow(
        'onThemeExport',
        '(detail: ThemeBuilderExportDetail) => void',
        '-',
        'Callback when the user exports the theme.',
      ),
    ],
    controller: [
      hookApiRow('rootProps', 'LumenProps<"section">', '-', 'Spread onto the theme builder root.'),
      hookApiRow('hueProps', 'LumenProps<"input">', '-', 'Spread onto the hue range input.'),
      hookApiRow('accentHueProps', 'LumenProps<"input">', '-', 'Spread onto the accent hue range input.'),
      hookApiRow('primaryColorProps', 'LumenProps<"input">', '-', 'Spread onto the primary color picker input.'),
      hookApiRow('secondaryColorProps', 'LumenProps<"input">', '-', 'Spread onto the secondary color picker input.'),
      hookApiRow('outputProps', 'LumenProps<"textarea">', '-', 'Spread onto the export output textarea.'),
      hookApiRow('exportButtonProps', 'LumenProps<"button">', '-', 'Spread onto the copy/export button.'),
      hookApiRow(
        'getModeProps',
        '(mode, props?) => LumenProps<"button">',
        '-',
        'Returns toggle props for a mode button.',
      ),
      hookApiRow(
        'getSchemeProps',
        '(scheme, props?) => LumenProps<"button">',
        '-',
        'Returns toggle props for a scheme button.',
      ),
      hookApiRow(
        'getExportFormatProps',
        '(format, props?) => LumenProps<"button">',
        '-',
        'Returns toggle props for an export format button.',
      ),
      hookApiRow(
        'previewStyle',
        'CSSProperties',
        '-',
        'Inline style object with generated CSS custom properties for live preview.',
      ),
      hookApiRow('exportValue', 'string', '-', 'Current export string (CSS, Figma JSON, or design tokens JSON).'),
      hookApiRow('exportFormat', '"css" | "figma" | "tokens"', '-', 'Current export format.'),
      hookApiRow('tokens', 'LumenThemeTokens', '-', 'Current generated theme tokens.'),
      hookApiRow('copyExport', '() => Promise<string>', '-', 'Copy the export value to clipboard and return it.'),
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
}`,
  },
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

interface ElementsApiRow {
  description: string
  name: string
  signature: string
}

const elementsRow = (name: string, signature: string, description: string): ElementsApiRow => ({
  description,
  name,
  signature,
})

export const elementsApiReference: ElementsApiDoc[] = [
  {
    name: 'defineLumenElements',
    type: 'registration',
    description:
      'Registers all 79 Lumen web components in the custom element registry. Call once before using any <lumen-*> tags. Optionally pass a custom registry for scoped usage.',
    rows: [
      elementsRow(
        'registry',
        'CustomElementRegistry (optional)',
        'Custom element registry to register against. Defaults to the global customElements.',
      ),
    ],
    code: `<script type="module">
  import { defineLumenElements } from '@santi020k/lumen-elements/define'

  defineLumenElements()
</script>

<lumen-card>
  <lumen-button>Click me</lumen-button>
</lumen-card>`,
  },
  {
    name: 'enhanceLumenForms',
    type: 'enhancement',
    description:
      'Enhances forms marked with [data-ui-form] with native constraint validation, custom error messages via data-error-* attributes, and field description syncing. Works without registering custom elements.',
    rows: [
      elementsRow(
        'root',
        'ParentNode (optional)',
        'Root element to search for [data-ui-form] forms. Defaults to document.',
      ),
      elementsRow('data-error-required', 'attribute', 'Custom message shown when a required field is empty.'),
      elementsRow(
        'data-error-type',
        'attribute',
        'Custom message shown when the value does not match the input type (e.g. email).',
      ),
      elementsRow(
        'data-error-pattern',
        'attribute',
        'Custom message shown when the value does not match the pattern attribute.',
      ),
      elementsRow('data-error-min / data-error-max', 'attribute', 'Custom message for range violations.'),
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
</form>`,
  },
  {
    name: 'enhanceLumenCalendars',
    type: 'enhancement',
    description:
      'Enhances elements marked with [data-ui-calendar] or <lumen-calendar> with generated date grids, hidden input values, month navigation, selection, min/max clamping, and keyboard focus.',
    rows: [
      elementsRow('root', 'ParentNode (optional)', 'Root element to search for calendars. Defaults to document.'),
      elementsRow('month', 'YYYY-MM', 'Visible month for generated calendars.'),
      elementsRow('value', 'YYYY-MM-DD', 'Initial selected date copied to the hidden input.'),
      elementsRow('min / max', 'YYYY-MM-DD', 'Inclusive selectable date bounds.'),
      elementsRow('name', 'attribute', 'Forwarded to the generated hidden input for form submission.'),
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
></lumen-calendar>`,
  },
  {
    name: 'enhanceLumenDateRangePickers',
    type: 'enhancement',
    description:
      'Enhances elements marked with [data-ui-date-range-picker] so paired native date inputs keep min/max constraints in sync. Works without registering custom elements.',
    rows: [
      elementsRow(
        'root',
        'ParentNode (optional)',
        'Root element to search for date range pickers. Defaults to document.',
      ),
      elementsRow(
        'input[type="date"]',
        'native date inputs',
        'The first date input is treated as the start date and the last date input is treated as the end date.',
      ),
    ],
    code: `<script type="module">
  import { enhanceLumenDateRangePickers } from '@santi020k/lumen-elements/define'

  enhanceLumenDateRangePickers()
</script>

<section data-ui-date-range-picker class="ui-date-range-picker">
  <input class="ui-input ui-date-picker" type="date" aria-label="Start date" />
  <input class="ui-input ui-date-picker" type="date" aria-label="End date" />
</section>`,
  },
  {
    name: 'enhanceLumenInputOTPs',
    type: 'enhancement',
    description:
      'Enhances elements marked with [data-ui-input-otp] or <lumen-input-otp> with a real native input, visual segments, sanitized input, paste handling, and caret navigation.',
    rows: [
      elementsRow('root', 'ParentNode (optional)', 'Root element to search for OTP fields. Defaults to document.'),
      elementsRow('length', 'attribute', 'Number of OTP segments to create. Defaults to 6.'),
      elementsRow('value', 'attribute', 'Initial value copied to the generated native input.'),
      elementsRow('name', 'attribute', 'Forwarded to the generated native input for form submission.'),
    ],
    code: `<script type="module">
  import { enhanceLumenInputOTPs } from '@santi020k/lumen-elements/define'

  enhanceLumenInputOTPs()
</script>

<lumen-input-otp
  aria-label="Verification code"
  length="6"
  name="code"
></lumen-input-otp>`,
  },
  {
    name: 'enhanceLumenResizable',
    type: 'enhancement',
    description:
      'Enhances elements marked with [data-ui-resizable] with pane sizing, generated separator handles, pointer resizing, keyboard resizing, and double-click reset.',
    rows: [
      elementsRow(
        'root',
        'ParentNode (optional)',
        'Root element to search for resizable groups. Defaults to document.',
      ),
      elementsRow(
        'data-ui-resizable-default-sizes',
        'comma-separated percentages',
        'Initial pane sizes normalized to 100%.',
      ),
      elementsRow(
        'data-ui-resizable-min-size',
        'number or comma list',
        'Minimum pane size percentage. Defaults to 12.',
      ),
      elementsRow(
        'data-ui-resizable-max-size',
        'number or comma list',
        'Maximum pane size percentage. Defaults to 88.',
      ),
      elementsRow('data-orientation', '"horizontal" | "vertical"', 'Resize axis. Defaults to horizontal.'),
    ],
    code: `<script type="module">
  import { enhanceLumenResizable } from '@santi020k/lumen-elements/define'

  enhanceLumenResizable()
</script>

<lumen-resizable data-ui-resizable-default-sizes="30,70">
  <aside>Navigation</aside>
  <main>Editor</main>
</lumen-resizable>`,
  },
  {
    name: 'enhanceLumenRichTextEditors',
    type: 'enhancement',
    description:
      'Enhances elements marked with [data-ui-rich-text-editor] with toolbar command execution via document.execCommand. Works without registering custom elements.',
    rows: [
      elementsRow('root', 'ParentNode (optional)', 'Root element to search for editors. Defaults to document.'),
      elementsRow(
        'data-ui-command',
        'attribute',
        'Set on toolbar buttons to specify the command name (bold, italic, insertUnorderedList, etc.).',
      ),
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
</section>`,
  },
  {
    name: 'LumenToast',
    type: 'toast',
    description:
      'Global singleton toast API available after calling defineLumenElements(). Create, update, and dismiss toast notifications from anywhere.',
    rows: [
      elementsRow(
        'create(detail)',
        '(ToastDetail) => string',
        'Create a toast with title, description, variant, duration, placement, and optional action. Returns the toast id.',
      ),
      elementsRow('dismiss(id?)', '(string?) => void', 'Dismiss a toast by id, or dismiss the most recent toast.'),
      elementsRow('update(id, detail)', '(string, ToastDetail) => void', 'Update an existing toast with new content.'),
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

<lumen-button id="notify">Show toast</lumen-button>`,
  },
  {
    name: 'Custom events',
    type: 'event',
    description:
      'Lumen elements dispatch CustomEvents that you can listen for on the document or on specific elements.',
    rows: [
      elementsRow(
        'ui:toast',
        'CustomEvent<ToastDetail>',
        'Dispatched on document when a toast is created. Listen on document to handle toasts globally.',
      ),
      elementsRow(
        'ui:validate',
        'CustomEvent<{ control, form, value }>',
        'Dispatched during form validation for each control.',
      ),
      elementsRow('ui:valid', 'CustomEvent<{ form, controls? }>', 'Dispatched when a form passes validation.'),
      elementsRow(
        'ui:invalid',
        'CustomEvent<{ form, control?, controls? }>',
        'Dispatched when a form fails validation.',
      ),
      elementsRow(
        'ui:editor-command',
        'CustomEvent<{ command }>',
        'Dispatched when a rich text editor command is executed.',
      ),
      elementsRow(
        'ui:toast-action',
        'CustomEvent<{ event?, value? }>',
        'Dispatched when a toast action button is clicked.',
      ),
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
</script>`,
  },
]
