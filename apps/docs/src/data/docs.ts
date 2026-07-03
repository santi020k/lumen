export interface ComponentDoc {
  name: string
  category: 'Actions' | 'Data display' | 'Feedback' | 'Forms' | 'Layout' | 'Navigation' | 'Overlays'
  summary: string
  example: string
}

export interface InstallCommand {
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

export const docNavigation = [
  ['Introduction', '/docs#introduction'],
  ['Install and use', '/docs#installation'],
  ['Global styles', '/docs#global-styles'],
  ['Glassmorphism', '/docs#glassmorphism'],
  ['Packages', '/docs#packages'],
  ['Runtime', '/docs#runtime'],
  ['Components', '/docs/components']
] as const

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

export const installCommands = buildInstallCommands('@santi020k/lumen-astro')

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

export const glassSurfaceExamples: GlassSurfaceExample[] = [
  {
    code: `<Card variant="glass">
  <h2>Launch window</h2>
  <p>Glass cards use shared blur, border, highlight, and fallback tokens.</p>
</Card>`,
    description: 'Use the glass variant for standalone content surfaces.',
    label: 'Astro card',
    lang: 'astro'
  },
  {
    code: `<Popover surface="glass">
  <Button variant="outline" data-ui-trigger>Invite</Button>
  <div>
    <Label for="email">Email</Label>
    <Input id="email" type="email" />
  </div>
</Popover>`,
    description: 'Use the surface prop for overlays so semantic variants stay available.',
    label: 'Overlay surface',
    lang: 'astro'
  },
  {
    code: `<lumen-card variant="glass">
  <h2>Production</h2>
  <p>Custom elements use the same class contract.</p>
</lumen-card>`,
    description: 'Elements support the same glass classes through attributes.',
    label: 'Elements',
    lang: 'html'
  }
]

export const frameworkSetups: FrameworkSetup[] = [
  {
    id: 'astro',
    installCommands,
    label: 'Astro',
    lang: 'astro',
    note: 'After the stylesheet is loaded globally, import components where you use them. Mount UIPrimitives once near your root layout only when you use interactive primitives.',
    packageName: '@santi020k/lumen-astro',
    usage: astroUsage
  },
  {
    id: 'react',
    installCommands: buildInstallCommands('@santi020k/lumen-react', '@santi020k/lumen-astro'),
    label: 'React',
    lang: 'tsx',
    note: 'Install the React adapter with the shared stylesheet package, load the stylesheet globally, then import primitives directly in your components.',
    packageName: '@santi020k/lumen-react',
    usage: reactUsage
  },
  {
    id: 'elements',
    installCommands: buildInstallCommands('@santi020k/lumen-elements', '@santi020k/lumen-astro'),
    label: 'Elements',
    lang: 'html',
    note: 'Install the custom-elements adapter with the shared stylesheet package, load the stylesheet globally, register Lumen elements once, and use lumen-* tags anywhere HTML is valid.',
    packageName: '@santi020k/lumen-elements',
    usage: elementsUsage
  }
]

export const frameworkPackages = [
  ['Astro', '@santi020k/lumen-astro', 'Complete', 'Full component catalog, shared CSS, and the UIPrimitives runtime.'],
  ['React', '@santi020k/lumen-react', 'Complete', 'React components for the full primitive catalog using the shared class contract.'],
  ['Elements', '@santi020k/lumen-elements', 'Complete', 'Standards-based custom elements for the full primitive catalog.'],
  ['Core', '@santi020k/lumen-core', 'Shared', 'Design tokens, component metadata, and small adapter utilities.']
] as const

export const runtimeFeatures = [
  ['Dialogs and sheets', 'Trigger, dismiss, escape-key, and focus behavior for modal surfaces.'],
  ['Menus and popovers', 'Lightweight disclosure patterns for contextual actions and floating content.'],
  ['Tabs and command lists', 'Progressively enhanced keyboard navigation and client-side filtering.'],
  ['Toasts and carousel controls', 'Document-level behavior for transient feedback and slide navigation.']
] as const

export const componentDocs: ComponentDoc[] = [
  ['Accordion', 'Layout', 'Stacks collapsible content sections.', '<Accordion><details open><summary>Billing</summary><p>Invoices and payment methods.</p></details></Accordion>'],
  ['Alert', 'Feedback', 'Surfaces contextual status messages.', '<Alert><strong>Project synced.</strong><p>Your tokens are available.</p></Alert>'],
  ['AlertDialog', 'Overlays', 'Confirms destructive or high-commitment actions.', '<Button data-ui-alert-dialog-trigger="delete-project">Delete</Button><AlertDialog id="delete-project"><h2>Delete this project?</h2><Button data-ui-alert-dialog-close>Cancel</Button></AlertDialog>'],
  ['AspectRatio', 'Layout', 'Keeps media and embeds in a predictable ratio.', '<AspectRatio ratio="16/9"><img src="/preview.png" alt="Product preview" /></AspectRatio>'],
  ['Attachment', 'Data display', 'Displays a file attachment with metadata.', '<Attachment href="/files/report.pdf" name="report.pdf" size="248 KB" />'],
  ['Avatar', 'Data display', 'Represents a person, team, or entity.', '<Avatar src="/avatar.jpg" alt="Santiago Molina">SM</Avatar>'],
  ['Badge', 'Data display', 'Labels status, type, plan, or count information.', '<Badge variant="secondary">Astro</Badge>'],
  ['Breadcrumb', 'Navigation', 'Shows page hierarchy and parent navigation.', '<Breadcrumb><a href="/docs">Docs</a><span>Components</span></Breadcrumb>'],
  ['Bubble', 'Data display', 'Frames chat messages and short comments.', '<Bubble from="user">Can you summarize the release?</Bubble>'],
  ['Button', 'Actions', 'Triggers primary, secondary, destructive, and quiet actions.', '<Button variant="default">Save changes</Button><Button variant="secondary">Cancel</Button>'],
  ['ButtonGroup', 'Actions', 'Groups related button actions.', '<ButtonGroup><Button variant="secondary">Back</Button><Button>Publish</Button></ButtonGroup>'],
  ['Calendar', 'Forms', 'Presents a calendar surface for date selection.', '<Calendar aria-label="Choose a delivery date" />'],
  ['Card', 'Layout', 'Frames a focused item, metric, plan, or form.', '<Card variant="glass"><h2>Starter</h2><p>For personal projects.</p></Card>'],
  ['Carousel', 'Layout', 'Displays a horizontal sequence of slides.', '<Carousel aria-label="Featured templates"><article>Dashboard</article><article>Portfolio</article></Carousel>'],
  ['Chart', 'Data display', 'Frames metric headers, SVG plots, and captions for lightweight data visualization.', '<Chart aria-label="Revenue"><header><h3>Revenue</h3><strong data-ui-chart-value>$128K</strong></header><svg viewBox="0 0 120 40" role="img" aria-label="Revenue trend"><path d="M0 35 L30 26 L60 18 L90 22 L120 8" fill="none" stroke="currentColor" stroke-width="3" /></svg><figcaption>Revenue is up 42% since Q1.</figcaption></Chart>'],
  ['Checkbox', 'Forms', 'Captures a binary form value.', '<label><Checkbox name="updates" /> Email me product updates</label>'],
  ['Collapsible', 'Layout', 'Shows and hides one optional content region.', '<Collapsible><summary>Advanced filters</summary><p>Filter controls</p></Collapsible>'],
  ['Combobox', 'Forms', 'Combines text entry and option selection.', '<Combobox><Input role="combobox" aria-expanded="false" placeholder="Search package" /><div role="listbox"><button role="option">Astro</button></div></Combobox>'],
  ['Command', 'Navigation', 'Builds command palettes and filterable action lists.', '<Command><Input placeholder="Type a command..." /><button data-ui-command-item>Open docs</button></Command>'],
  ['ContextMenu', 'Overlays', 'Provides contextual actions for a selected object.', '<ContextMenu><button role="menuitem">Duplicate</button></ContextMenu>'],
  ['DataTable', 'Data display', 'Styles dense tabular data and records.', '<DataTable><table><thead><tr><th>Name</th><th>Status</th></tr></thead><tbody><tr><td>Docs</td><td>Ready</td></tr></tbody></table></DataTable>'],
  ['DatePicker', 'Forms', 'Provides a styled date input.', '<DatePicker name="launchDate" aria-label="Launch date" />'],
  ['Dialog', 'Overlays', 'Presents modal content for focused tasks.', '<Button data-ui-dialog-trigger="profile-dialog">Edit profile</Button><Dialog id="profile-dialog" surface="glass"><p>Profile form</p><Button data-ui-dialog-close>Close</Button></Dialog>'],
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
  ['Pagination', 'Navigation', 'Moves through paginated records or result sets.', '<Pagination><a href="?page=1">Previous</a><a aria-current="page" href="?page=2">2</a><a href="?page=3">Next</a></Pagination>'],
  ['Popover', 'Overlays', 'Displays lightweight floating content from a trigger.', '<Popover surface="glass"><Button data-ui-trigger>Invite</Button><div>Email form</div></Popover>'],
  ['Progress', 'Feedback', 'Shows completion, loading progress, or quota usage.', '<Progress value={64} max={100} aria-label="Upload progress" />'],
  ['RadioGroup', 'Forms', 'Groups mutually exclusive options.', '<RadioGroup><label><input type="radio" name="theme" value="light" /> Light</label><label><input type="radio" name="theme" value="dark" /> Dark</label></RadioGroup>'],
  ['Resizable', 'Layout', 'Frames panes that can be resized.', '<Resizable><aside>Navigation</aside><main>Editor</main></Resizable>'],
  ['ScrollArea', 'Layout', 'Provides a styled scroll container.', '<ScrollArea style="max-height: 18rem"><p>Long release notes...</p></ScrollArea>'],
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
  ['Textarea', 'Forms', 'Captures longer free-form text.', '<Textarea name="notes" rows={5} placeholder="Add release notes..." />'],
  ['Toast', 'Feedback', 'Displays temporary feedback for background actions.', '<Toast><strong>Saved</strong><p>Your changes are live.</p></Toast>'],
  ['Toggle', 'Actions', 'Represents an on/off action.', '<Toggle aria-label="Pin project" pressed={false}>Pin</Toggle>'],
  ['ToggleGroup', 'Actions', 'Groups related toggles.', '<ToggleGroup><Toggle>Day</Toggle><Toggle pressed>Week</Toggle><Toggle>Month</Toggle></ToggleGroup>'],
  ['Tooltip', 'Overlays', 'Adds concise helper text to compact controls.', '<Tooltip><button aria-label="Save changes">Save</button><span role="tooltip">Save changes</span></Tooltip>'],
  ['Typography', 'Data display', 'Applies Lumen text rhythm to article content.', '<Typography><h1>Release notes</h1><p>Lumen now includes production documentation.</p></Typography>']
].map(([name, category, summary, example]) => ({ name, category, summary, example })) as ComponentDoc[]

export const componentCategories = [...new Set(componentDocs.map(component => component.category))].sort()
