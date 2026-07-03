export interface ComponentDoc {
  name: string
  category: 'Actions' | 'Data display' | 'Feedback' | 'Forms' | 'Layout' | 'Navigation' | 'Overlays'
  summary: string
  example: string
}

export const installCommands = [
  { label: 'pnpm', command: 'pnpm add @santi020k/lumen-astro' },
  { label: 'npm', command: 'npm install @santi020k/lumen-astro' },
  { label: 'yarn', command: 'yarn add @santi020k/lumen-astro' }
] as const

export const frameworkPackages = [
  ['Astro', '@santi020k/lumen-astro', 'Complete component catalog, shared CSS, and UIPrimitives runtime.'],
  ['React', '@santi020k/lumen-react', 'Early adapter with Button, Card, and Input.'],
  ['Web Components', '@santi020k/lumen-elements', 'Early adapter with lumen-button and lumen-card custom elements.'],
  ['Core', '@santi020k/lumen-core', 'Shared tokens, component metadata, and helper utilities for adapters.']
] as const

export const componentDocs: ComponentDoc[] = [
  ['Accordion', 'Layout', 'Stacks collapsible content sections.', '<Accordion><details open><summary>Billing</summary><p>Invoices and payment methods.</p></details></Accordion>'],
  ['Alert', 'Feedback', 'Surfaces contextual status messages.', '<Alert><strong>Project synced.</strong><p>Your tokens are available.</p></Alert>'],
  ['AlertDialog', 'Overlays', 'Confirms destructive or high-commitment actions.', '<AlertDialog><button data-dialog-trigger>Delete</button><div role="alertdialog" aria-modal="true">Delete this project?</div></AlertDialog>'],
  ['AspectRatio', 'Layout', 'Keeps media and embeds in a predictable ratio.', '<AspectRatio ratio="16/9"><img src="/preview.png" alt="Product preview" /></AspectRatio>'],
  ['Attachment', 'Data display', 'Displays a file attachment with metadata.', '<Attachment href="/files/report.pdf" name="report.pdf" size="248 KB" />'],
  ['Avatar', 'Data display', 'Represents a person, team, or entity.', '<Avatar src="/avatar.jpg" alt="Santiago Molina">SM</Avatar>'],
  ['Badge', 'Data display', 'Labels status, type, plan, or count information.', '<Badge variant="secondary">Astro</Badge>'],
  ['Breadcrumb', 'Navigation', 'Shows page hierarchy and parent navigation.', '<Breadcrumb><a href="/docs">Docs</a><span>Components</span></Breadcrumb>'],
  ['Bubble', 'Data display', 'Frames chat messages and short comments.', '<Bubble tone="user">Can you summarize the release?</Bubble>'],
  ['Button', 'Actions', 'Triggers primary, secondary, destructive, and quiet actions.', '<Button variant="default">Save changes</Button><Button variant="secondary">Cancel</Button>'],
  ['ButtonGroup', 'Actions', 'Groups related button actions.', '<ButtonGroup><Button variant="secondary">Back</Button><Button>Publish</Button></ButtonGroup>'],
  ['Calendar', 'Forms', 'Presents a calendar surface for date selection.', '<Calendar aria-label="Choose a delivery date" />'],
  ['Card', 'Layout', 'Frames a focused item, metric, plan, or form.', '<Card><h2>Starter</h2><p>For personal projects.</p></Card>'],
  ['Carousel', 'Layout', 'Displays a horizontal sequence of slides.', '<Carousel aria-label="Featured templates"><article>Dashboard</article><article>Portfolio</article></Carousel>'],
  ['Chart', 'Data display', 'Provides a styled frame for visualized data.', '<Chart><svg viewBox="0 0 120 40" role="img" aria-label="Revenue trend"><path d="M0 35 L30 26 L60 18 L90 22 L120 8" /></svg></Chart>'],
  ['Checkbox', 'Forms', 'Captures a binary form value.', '<label><Checkbox name="updates" /> Email me product updates</label>'],
  ['Collapsible', 'Layout', 'Shows and hides one optional content region.', '<Collapsible><button data-collapsible-trigger>Advanced filters</button><div data-collapsible-content>Filter controls</div></Collapsible>'],
  ['Combobox', 'Forms', 'Combines text entry and option selection.', '<Combobox><Input role="combobox" aria-expanded="false" placeholder="Search package" /><div role="listbox"><button role="option">Astro</button></div></Combobox>'],
  ['Command', 'Navigation', 'Builds command palettes and filterable action lists.', '<Command><Input placeholder="Type a command..." /><button data-command-item>Open docs</button></Command>'],
  ['ContextMenu', 'Overlays', 'Provides contextual actions for a selected object.', '<ContextMenu><button data-menu-trigger>Project actions</button><div role="menu"><button role="menuitem">Duplicate</button></div></ContextMenu>'],
  ['DataTable', 'Data display', 'Styles dense tabular data and records.', '<DataTable><Table><thead><tr><th>Name</th><th>Status</th></tr></thead><tbody><tr><td>Docs</td><td>Ready</td></tr></tbody></Table></DataTable>'],
  ['DatePicker', 'Forms', 'Provides a styled date input.', '<DatePicker name="launchDate" aria-label="Launch date" />'],
  ['Dialog', 'Overlays', 'Presents modal content for focused tasks.', '<Dialog><button data-dialog-trigger>Edit profile</button><section role="dialog" aria-modal="true">Profile form</section></Dialog>'],
  ['Direction', 'Layout', 'Controls directional layout and text flow.', '<Direction dir="rtl"><p>Localized content</p></Direction>'],
  ['Drawer', 'Overlays', 'Slides in supporting navigation, filters, or task panels.', '<Drawer><button data-dialog-trigger>Open filters</button><aside role="dialog">Filter controls</aside></Drawer>'],
  ['DropdownMenu', 'Overlays', 'Shows compact actions from a trigger.', '<DropdownMenu><button data-menu-trigger>More</button><div role="menu"><button role="menuitem">Rename</button></div></DropdownMenu>'],
  ['Empty', 'Feedback', 'Explains an empty state and next action.', '<Empty><h2>No projects yet</h2><p>Create your first workspace.</p></Empty>'],
  ['Field', 'Forms', 'Groups labels, controls, descriptions, and errors.', '<Field><Label for="email">Email</Label><Input id="email" type="email" /></Field>'],
  ['HoverCard', 'Overlays', 'Shows extra context on hover and focus.', '<HoverCard><a href="/team/santiago">Santiago</a><div role="tooltip">Maintainer of Lumen UI.</div></HoverCard>'],
  ['Input', 'Forms', 'Captures short text, email, password, search, or numeric values.', '<Input id="email" name="email" type="email" placeholder="you@example.com" />'],
  ['InputGroup', 'Forms', 'Combines inputs with prefixes, suffixes, or controls.', '<InputGroup><span>https://</span><Input aria-label="Domain" placeholder="example.com" /></InputGroup>'],
  ['InputOTP', 'Forms', 'Collects one-time passcodes and verification codes.', '<InputOTP name="code" length={6} inputmode="numeric" />'],
  ['Item', 'Data display', 'Creates a compact row for lists and search results.', '<Item><strong>Production docs</strong><span>Ready for review</span></Item>'],
  ['Kbd', 'Data display', 'Displays keyboard shortcuts.', '<p>Open the command menu with <Kbd>Cmd K</Kbd>.</p>'],
  ['Label', 'Forms', 'Labels form controls with consistent spacing.', '<Label for="workspace">Workspace name</Label><Input id="workspace" />'],
  ['Marker', 'Data display', 'Highlights status, position, or annotations.', '<Marker tone="success">Live</Marker>'],
  ['Menubar', 'Navigation', 'Creates horizontal application menus.', '<Menubar><button role="menuitem">File</button><button role="menuitem">View</button></Menubar>'],
  ['Message', 'Data display', 'Structures a chat, activity, or system message.', '<Message><Avatar>LM</Avatar><Bubble>Lumen components are installed.</Bubble></Message>'],
  ['MessageScroller', 'Layout', 'Provides a scrollable message feed.', '<MessageScroller><Message>First event</Message><Message>Second event</Message></MessageScroller>'],
  ['NativeSelect', 'Forms', 'Styles the browser-native select element.', '<NativeSelect name="plan" options={["Free", "Pro", "Team"]} />'],
  ['NavigationMenu', 'Navigation', 'Builds grouped top-level navigation.', '<NavigationMenu><a href="/docs">Docs</a><a href="/docs/components">Components</a></NavigationMenu>'],
  ['Pagination', 'Navigation', 'Moves through paginated records or result sets.', '<Pagination><a href="?page=1">Previous</a><a aria-current="page" href="?page=2">2</a><a href="?page=3">Next</a></Pagination>'],
  ['Popover', 'Overlays', 'Displays lightweight floating content from a trigger.', '<Popover><button data-popover-trigger>Invite</button><div data-popover-content>Email form</div></Popover>'],
  ['Progress', 'Feedback', 'Shows completion, loading progress, or quota usage.', '<Progress value={64} max={100} aria-label="Upload progress" />'],
  ['RadioGroup', 'Forms', 'Groups mutually exclusive options.', '<RadioGroup><label><input type="radio" name="theme" value="light" /> Light</label><label><input type="radio" name="theme" value="dark" /> Dark</label></RadioGroup>'],
  ['Resizable', 'Layout', 'Frames panes that can be resized.', '<Resizable><aside>Navigation</aside><main>Editor</main></Resizable>'],
  ['ScrollArea', 'Layout', 'Provides a styled scroll container.', '<ScrollArea style="max-height: 18rem"><p>Long release notes...</p></ScrollArea>'],
  ['Select', 'Forms', 'Creates a custom select control.', '<Select name="framework" options={["Astro", "React", "Web Components"]} />'],
  ['Separator', 'Layout', 'Separates related content groups.', '<Separator /><p>Next section</p>'],
  ['Sheet', 'Overlays', 'Shows a side sheet for secondary flows.', '<Sheet><button data-dialog-trigger>Open details</button><aside role="dialog">Details panel</aside></Sheet>'],
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
