export interface ComponentDoc {
  apiReference: ComponentApiRow[]
  name: string
  category: 'Actions' | 'Data display' | 'Feedback' | 'Forms' | 'Layout' | 'Navigation' | 'Overlays'
  glass?: boolean
  summary: string
  example: string
}

interface ComponentApiRow {
  attribute: string
  defaultValue: string
  description: string
  values: string
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

export const frameworkSetups: FrameworkSetup[] = [
  {
    id: 'astro',
    installCommands,
    label: 'Astro',
    lang: 'astro',
    note: 'With the stylesheet loaded globally, import components where you use them. Mount UIPrimitives once near your root layout only if you use interactive primitives.',
    packageName: '@santi020k/lumen-astro',
    usage: astroUsage
  },
  {
    id: 'react',
    installCommands: buildInstallCommands('@santi020k/lumen-react', '@santi020k/lumen-astro'),
    label: 'React',
    lang: 'tsx',
    note: 'Install the adapter alongside the shared stylesheet package, then import primitives directly. React ships the same styled markup and data contract; wire app state for behavior-heavy primitives.',
    packageName: '@santi020k/lumen-react',
    usage: reactUsage
  },
  {
    id: 'elements',
    installCommands: buildInstallCommands('@santi020k/lumen-elements', '@santi020k/lumen-astro'),
    label: 'Elements',
    lang: 'html',
    note: 'Install the adapter alongside the shared stylesheet package, register Lumen elements once, and use lumen-* tags anywhere HTML is valid. Wire app state for behavior-heavy primitives.',
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
  'Compatibility alias for glass surface treatment.'
)

const glassApiRow = apiRow(
  'glass',
  'boolean',
  'false',
  'Applies the tokenized glass surface treatment with backdrop-filter fallbacks.'
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

const apiReferenceByComponent: Partial<Record<string, readonly ComponentApiRow[]>> = {
  Alert: [
    apiRow('variant', '"default" | "destructive" | "success" | "warning"', '"default"', 'Controls the alert tone.')
  ],
  AlertDialog: [
    surfaceApiRow,
    ...dialogTriggerApiRows('alert-dialog')
  ],
  AspectRatio: [
    apiRow('ratio', 'CSS aspect-ratio value', '"16 / 9"', 'Sets the preferred width-to-height ratio for the frame.')
  ],
  Attachment: [
    apiRow('href', 'string', '-', 'Renders the root as a link when provided; otherwise renders an article.')
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
  Button: [
    apiRow('variant', '"default" | "secondary" | "outline" | "ghost" | "link" | "destructive"', '"default"', 'Controls the button emphasis.'),
    apiRow('size', '"default" | "sm" | "lg" | "icon"', '"default"', 'Controls button height, padding, and icon-only sizing.'),
    apiRow('type', '"button" | "submit" | "reset"', '"button"', 'Sets the native button type.')
  ],
  Card: [
    apiRow('as', '"div" | "article" | "section"', '"div"', 'Changes the rendered HTML element.'),
    apiRow('variant', '"default" | "muted" | "interactive" | "glass"', '"default"', 'Controls the card surface and affordance; variant="glass" is kept as a compatibility alias.')
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
    apiRow('language', 'string', '-', 'Labels the code language in block headers.'),
    apiRow('label', 'string', '-', 'Adds a compact filename or title to the block header.'),
    apiRow('copy', 'boolean', 'false', 'Shows a copy button when UIPrimitives is mounted.'),
    apiRow('highlighted', 'boolean', 'false', 'Allows a pre-highlighted pre/code tree, such as Shiki output, to render directly.'),
    apiRow('theme', '"auto" | "lumen" | "santi020k"', '"auto"', 'Selects the code palette family.')
  ],
  Combobox: [
    apiRow('list', 'string', 'required', 'Sets the id for the generated listbox and connects it to the combobox input.'),
    apiRow('label', 'string', '-', 'Adds a visible label above the input.'),
    apiRow('options', 'string[]', '[]', 'Creates selectable listbox options from strings.'),
    apiRow('type', 'HTML input type', '"text"', 'Sets the native input type.')
  ],
  Command: [
    apiRow('data-ui-command-item', 'boolean attribute', '-', 'Marks filterable command items for the runtime.')
  ],
  ContextMenu: [
    surfaceApiRow
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
    disclosureTriggerApiRow
  ],
  HoverCard: [
    surfaceApiRow,
    disclosureTriggerApiRow
  ],
  Input: [
    apiRow('type', 'HTML input type', '"text"', 'Sets the native input type.')
  ],
  InputOTP: [
    apiRow('length', 'number', '6', 'Sets the default maxlength for the one-time code.'),
    apiRow('maxlength', 'number', 'length', 'Overrides the native maximum character count.'),
    apiRow('inputmode', 'HTML inputmode value', '"numeric"', 'Hints the preferred on-screen keyboard.')
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
    apiRow('placeholder', 'string', '-', 'Adds a disabled placeholder option.')
  ],
  NavigationMenu: [
    surfaceApiRow
  ],
  Popover: [
    surfaceApiRow,
    disclosureTriggerApiRow
  ],
  Progress: [
    apiRow('value', 'number', '0', 'Sets the current progress value, clamped between 0 and max.'),
    apiRow('max', 'number', '100', 'Sets the upper bound for progress.')
  ],
  Select: [
    apiRow('options', 'Array<string | { label, value, disabled? }>', '[]', 'Creates native option elements.'),
    apiRow('placeholder', 'string', '-', 'Adds a disabled placeholder option.')
  ],
  Separator: [
    apiRow('orientation', '"horizontal" | "vertical"', '"horizontal"', 'Sets the separator direction.')
  ],
  Sheet: [
    surfaceApiRow,
    ...dialogTriggerApiRows('sheet')
  ],
  Sidebar: [
    surfaceApiRow
  ],
  Slider: [
    apiRow('type', 'HTML input type', '"range"', 'Sets the native input type.')
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
    surfaceApiRow
  ],
  Toggle: [
    apiRow('pressed', 'boolean', 'false', 'Sets the initial pressed state.'),
    apiRow('type', '"button" | "submit" | "reset"', '"button"', 'Sets the native button type.')
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
  ['Breadcrumb', 'Navigation', 'Shows page hierarchy and parent navigation.', '<Breadcrumb><a href="/docs">Docs</a><span>Components</span></Breadcrumb>'],
  ['Bubble', 'Data display', 'Frames chat messages and short comments.', '<Bubble from="user">Can you summarize the release?</Bubble>'],
  ['Button', 'Actions', 'Triggers primary, secondary, destructive, and quiet actions.', '<Button variant="default">Save changes</Button><Button variant="secondary">Cancel</Button>'],
  ['ButtonGroup', 'Actions', 'Groups related button actions.', '<ButtonGroup><Button variant="secondary">Back</Button><Button>Publish</Button></ButtonGroup>'],
  ['Calendar', 'Forms', 'Presents a calendar surface for date selection.', '<Calendar aria-label="Choose a delivery date" />'],
  ['Card', 'Layout', 'Frames a focused item, metric, plan, or form.', '<Card><h2>Starter</h2><p>For personal projects.</p></Card>'],
  ['Carousel', 'Layout', 'Displays a horizontal sequence of slides.', '<Carousel aria-label="Featured templates"><article>Dashboard</article><article>Portfolio</article></Carousel>'],
  ['Chart', 'Data display', 'Frames metric headers, SVG plots, and captions for lightweight data visualization.', '<Chart aria-label="Revenue"><header><h3>Revenue</h3><strong data-ui-chart-value>$128K</strong></header><svg viewBox="0 0 120 40" role="img" aria-label="Revenue trend"><path d="M0 35 L30 26 L60 18 L90 22 L120 8" fill="none" stroke="currentColor" stroke-width="3" /></svg><figcaption>Revenue is up 42% since Q1.</figcaption></Chart>'],
  ['Checkbox', 'Forms', 'Captures a binary form value.', '<label><Checkbox name="updates" /> Email me product updates</label>'],
  ['Collapsible', 'Layout', 'Shows and hides one optional content region.', '<Collapsible><summary>Advanced filters</summary><p>Filter controls</p></Collapsible>'],
  ['Code', 'Data display', 'Renders inline code and framed code blocks with theme-aware palettes.', '<Code variant="block" language="ts" label="theme.ts" copy>const theme = "lumen";\nconst accent = "hsl(var(--accent))";</Code>'],
  ['Combobox', 'Forms', 'Combines text entry and option selection.', '<Combobox label="Framework" list="framework-options" options={["Astro", "React", "Web Components"]} placeholder="Search package" />'],
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
  ['RichTextEditor', 'Forms', 'Frames rich text toolbar and editing compositions.', '<RichTextEditor><div role="toolbar"><ButtonGroup><Button>B</Button><Button>I</Button></ButtonGroup></div><div contenteditable="true">Draft release notes...</div></RichTextEditor>'],
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
  ['ThemeBuilder', 'Data display', 'Frames token previews and theme export controls.', '<ThemeBuilder><header><h2>Brand theme</h2></header><span data-ui-swatch style="--ui-swatch:#2563eb"></span></ThemeBuilder>'],
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
    ...(glassComponentNameSet.has(name) ? [glassApiRow] : []),
    ...(apiReferenceByComponent[name] ?? []),
    ...commonApiRows
  ],
  glass: glassComponentNameSet.has(name),
  name,
  category,
  summary,
  example
}))

export const componentCategories = [...new Set(componentDocs.map(component => component.category))].sort()
