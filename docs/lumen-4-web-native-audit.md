# Lumen 4 web-to-native audit

This audit covers every entry in `lumenComponentNames` from `packages/core/src/components.ts`.
Native counterparts are checked against `registry/native-components.json`; they share a semantic
role, not identical props or DOM behavior. Native component documentation records exact APIs and
supported Apple form factors. Wear and WidgetKit intentionally use separate, smaller catalogs.

## Dispositions

- **Counterpart:** a shared native contract exists in React Native, SwiftUI and Compose.
- **Composition:** existing native primitives cover the role, but there is no matching standalone
  export or guaranteed drop-in recipe. Product state, slots and interaction still need implementation.
- **Platform / host:** use native layout, accessibility, navigation or OS integration; the application
  owns permissions, requests, persistence and routing. These boundaries are not parity promises.
- **Gap:** a library contract or documented reusable recipe is absent. React Native rich-text
  editing remains deferred by the user; its plain model and limited SwiftUI/Compose subset do not
  close that gap.

Reviewed 193 web entries: 93 counterparts, 65 compositions,
33 platform/host boundaries and 2 gaps. The 23 new counterparts have dedicated native
contracts, controlled examples and focused behavior checks. Full catalog captures and combined
validation are tracked in [the completion plan](native-catalog-parity-plan.md); this source audit
alone does not qualify a release. MultiSelect and RangeSlider remain additional shared contracts.

For controlled Rating, Stepper and Timeline compositions, start with the
[native progression recipes](native-progression-recipes.md), which link the complete examples in
all three adapters. Table and hierarchical selection now also have public counterparts; remaining
product-specific behavior belongs in consumers.

## Verification boundaries

Native contracts share semantic roles and controlled ownership, with exact platform APIs documented
in [the native parity guides](native-components.md#catalog-parity-completion-guides). Host navigation,
networking, persistence, coordinate measurement and business rules remain application concerns.
Physical VoiceOver/TalkBack, React Native device runs and consumer/release qualification remain
separate from local model, emulator, simulator and rendered browser checks. No package publication
or store update is implied by this audit.

## Complete catalog

| Web entry | Disposition | Native contract or pending boundary |
| --- | --- | --- |
| `Accordion` | Composition | `disclosure` plus host slots/state; no matching standalone export. |
| `Alert` | Counterpart | `alert` |
| `AlertDialog` | Counterpart | `alert-dialog` |
| `Agenda` | Counterpart | `agenda`; Grouped native event browsing; host owns formatted dates and availability. |
| `AspectRatio` | Platform / host | Native layout constraints, stacks, grids and safe-area containers. |
| `Attachment` | Composition | `list-row` plus host slots/state; no matching standalone export. |
| `AttachmentList` | Composition | `list-row` plus host slots/state; no matching standalone export. |
| `AttachmentPreview` | Platform / host | Platform document/media viewer and picker; host owns permissions, upload, retry and file URLs. |
| `Autocomplete` | Counterpart | `autocomplete` |
| `Avatar` | Counterpart | `avatar` |
| `Backdrop` | Counterpart | `backdrop` |
| `BackToTop` | Platform / host | OS navigation, URL opening and named native scroll targets. SwiftUI also exports LumenLink. |
| `Badge` | Counterpart | `badge` |
| `BarChart` | Counterpart | `bar-chart` |
| `Breadcrumb` | Counterpart | `breadcrumb`; Stable ancestor IDs and current-page semantics; host owns routing. |
| `Bubble` | Composition | `card` plus host slots/state; no matching standalone export. |
| `Button` | Counterpart | `button` |
| `ButtonGroup` | Counterpart | `button-group` |
| `Calendar` | Counterpart | `calendar`; Controlled month/day selection, bounds and event indicators. |
| `Callout` | Counterpart | `banner` |
| `Card` | Counterpart | `card` |
| `CardContent` | Composition | `card` plus host slots/state; no matching standalone export. |
| `CardDescription` | Composition | `card` plus host slots/state; no matching standalone export. |
| `CardFooter` | Composition | `card` plus host slots/state; no matching standalone export. |
| `CardHeader` | Composition | `card` plus host slots/state; no matching standalone export. |
| `CardTitle` | Composition | `card` plus host slots/state; no matching standalone export. |
| `Carousel` | Counterpart | `carousel`; Controlled native paging with localized positions and status guards. |
| `Chart` | Composition | `line-chart` plus host slots/state; no matching standalone export. |
| `Checkbox` | Counterpart | `checkbox` |
| `CheckboxGroup` | Composition | `checkbox` plus host slots/state; no matching standalone export. |
| `Collapsible` | Composition | `disclosure` plus host slots/state; no matching standalone export. |
| `Code` | Platform / host | Native text and LumenTabs; host owns syntax highlighting. |
| `CodeTabs` | Platform / host | Native text and LumenTabs; host owns syntax highlighting. |
| `Combobox` | Counterpart | `autocomplete` |
| `Container` | Platform / host | Native layout constraints, stacks, grids and safe-area containers. |
| `CopyButton` | Platform / host | Application clipboard operation with a named LumenButton. |
| `Command` | Counterpart | `command`; Controlled command filtering, active selection and host actions. |
| `ContextNavigation` | Composition | `navigation-bar` plus host slots/state; no matching standalone export. |
| `ContextMenu` | Counterpart | `menu` |
| `ColorPicker` | Counterpart | `color-picker`; Validated color drafts, channels and canonical named palette selection. |
| `DataTable` | Counterpart | `data-table`; Controlled stable sorting and retained record selection. |
| `DatePicker` | Counterpart | `date-field` |
| `DateRangePicker` | Counterpart | `date-range-field` |
| `Dialog` | Counterpart | `sheet` |
| `DialogHeader` | Composition | `sheet` plus host slots/state; no matching standalone export. |
| `DialogTitle` | Composition | `sheet` plus host slots/state; no matching standalone export. |
| `DialogBody` | Composition | `sheet` plus host slots/state; no matching standalone export. |
| `DialogFooter` | Composition | `sheet` plus host slots/state; no matching standalone export. |
| `DialogClose` | Composition | `sheet` plus host slots/state; no matching standalone export. |
| `Direction` | Platform / host | Native layout direction and accessibility traversal. |
| `Drawer` | Counterpart | `sheet` |
| `DropdownMenu` | Counterpart | `menu` |
| `Empty` | Counterpart | `empty-state` |
| `ErrorState` | Counterpart | `error-state` |
| `ErrorSummary` | Composition | `alert` plus host slots/state; no matching standalone export. |
| `Eyebrow` | Composition | `text` plus host slots/state; no matching standalone export. |
| `Field` | Composition | `field-group` plus host slots/state; no matching standalone export. |
| `FieldError` | Composition | `field-group` plus host slots/state; no matching standalone export. |
| `FloatingBadge` | Composition | `badge` plus host slots/state; no matching standalone export. |
| `Form` | Composition | `field-group` plus host slots/state; no matching standalone export. |
| `FormattedDate` | Platform / host | Locale-aware platform date formatting. |
| `Graphic` | Counterpart | `graphic` |
| `HoverCard` | Composition | `sheet` plus host slots/state; no matching standalone export. |
| `Icon` | Counterpart | `icon` |
| `Image` | Counterpart | `image` |
| `DeviceFrame` | Platform / host | Web device demonstration shell; native hosts own preview containers and embedded content. |
| `ImageComparison` | Counterpart | `image-comparison` |
| `Illustration` | Counterpart | `illustration` |
| `Input` | Counterpart | `text-field` |
| `InputGroup` | Composition | `field-group` plus host slots/state; no matching standalone export. |
| `InputOTP` | Counterpart | `input-otp` |
| `Item` | Counterpart | `list-row` |
| `KanbanBoard` | Counterpart | `kanban-board`; Controlled move requests, drag and accessible alternatives; host owns persistence. |
| `KanbanColumn` | Counterpart | `kanban-column`; Controlled column content, card actions and status semantics. |
| `Kbd` | Platform / host | Platform shortcut and menu APIs; LumenMenu covers contextual actions. |
| `Label` | Composition | `text` plus host slots/state; no matching standalone export. |
| `Link` | Platform / host | OS navigation, URL opening and named native scroll targets. SwiftUI also exports LumenLink. |
| `LineChart` | Counterpart | `line-chart` |
| `ListBox` | Composition | `multi-select` plus host slots/state; no matching standalone export. |
| `Marker` | Composition | `badge` plus host slots/state; no matching standalone export. |
| `Menubar` | Platform / host | Platform shortcut and menu APIs; LumenMenu covers contextual actions. |
| `Message` | Composition | `card` plus host slots/state; no matching standalone export. |
| `MessageScroller` | Platform / host | Native scrolling/lazy-list containers with stable record identities. |
| `NativeSelect` | Counterpart | `picker` |
| `NavigationMenu` | Composition | `navigation-bar` plus host slots/state; no matching standalone export. |
| `AmountField` | Platform / host | Native text fields retain application-owned exact decimal or minor-unit draft contracts. The web formatter does not establish native parity. |
| `NumberField` | Counterpart | `number-field` |
| `Pagination` | Platform / host | Application paging/request state with named LumenButton actions. |
| `PasswordField` | Counterpart | `password-field` |
| `PhoneInput` | Counterpart | `phone-input` |
| `PieChart` | Counterpart | `pie-chart` |
| `Pill` | Counterpart | `chip` |
| `Popover` | Composition | `sheet` plus host slots/state; no matching standalone export. |
| `Progress` | Counterpart | `progress` |
| `Prose` | Composition | `text` plus host slots/state; no matching standalone export. |
| `RadioGroup` | Counterpart | `radio-group` |
| `Resizable` | Platform / host | Native split-view/pane layout; Compose includes adaptive list/detail scaffolds. |
| `RichTextEditor` | Gap | React Native rich editing explicitly deferred; no new native editor dependency. SwiftUI/Compose inline formatting is a limited subset. |
| `ScrollArea` | Platform / host | Native scrolling/lazy-list containers with stable record identities. |
| `ScrollProgress` | Platform / host | Native pinned headers, overlays and scroll observation. |
| `Schedule` | Counterpart | `schedule`; Timed native day columns and controlled move requests. |
| `SearchField` | Counterpart | `search-field` |
| `Select` | Counterpart | `picker` |
| `Separator` | Counterpart | `divider` |
| `Sheet` | Counterpart | `sheet` |
| `Sidebar` | Composition | `navigation-bar` plus host slots/state; no matching standalone export. |
| `Skeleton` | Counterpart | `skeleton` |
| `SkipLink` | Platform / host | Native layout direction and accessibility traversal. |
| `Slider` | Counterpart | `slider` |
| `Sparkline` | Counterpart | `sparkline` |
| `Spinner` | Counterpart | `spinner` |
| `Switch` | Counterpart | `toggle` |
| `Table` | Counterpart | `table`; Named native records or contained horizontal columns; host formats cells. |
| `Tabs` | Counterpart | `tabs` |
| `TagGroup` | Composition | `chip` plus host slots/state; no matching standalone export. |
| `Textarea` | Counterpart | `textarea` |
| `ThemeBuilder` | Platform / host | Development token authoring; canonical native token generation. |
| `ThemeToggle` | Composition | `toggle` plus host slots/state; no matching standalone export. |
| `TimeField` | Counterpart | `time-field` |
| `Toast` | Counterpart | `toast` |
| `ToastViewport` | Composition | `toast` plus host slots/state; no matching standalone export. |
| `Toggle` | Counterpart | `toggle` |
| `ToggleGroup` | Composition | `button-group` plus host slots/state; no matching standalone export. |
| `Tooltip` | Counterpart | `tooltip`; Controlled accessible help with native dismissal. |
| `Tree` | Counterpart | `tree`; Controlled expansion/selection and stable node IDs. |
| `TreeGrid` | Counterpart | `tree-grid`; Controlled hierarchical records and retained host state. |
| `Typography` | Counterpart | `text` |
| `VirtualList` | Platform / host | Native scrolling/lazy-list containers with stable record identities. |
| `LanguageToggle` | Composition | `segmented-control` plus host slots/state; no matching standalone export. |
| `Particles` | Composition | `graphic` plus host slots/state; no matching standalone export. |
| `AnimatedNumber` | Composition | `text` plus host slots/state; no matching standalone export. |
| `RevealGroup` | Composition | `surface` plus host slots/state; no matching standalone export. |
| `ScrollReveal` | Composition | `surface` plus host slots/state; no matching standalone export. |
| `Stat` | Counterpart | `stat` |
| `StatDescription` | Composition | `stat` plus host slots/state; no matching standalone export. |
| `StatIcon` | Composition | `stat` plus host slots/state; no matching standalone export. |
| `StatLabel` | Composition | `stat` plus host slots/state; no matching standalone export. |
| `StatTrend` | Composition | `stat` plus host slots/state; no matching standalone export. |
| `StatValue` | Composition | `stat` plus host slots/state; no matching standalone export. |
| `Stack` | Platform / host | Native layout constraints, stacks, grids and safe-area containers. |
| `Meter` | Counterpart | `gauge` |
| `Note` | Counterpart | `banner` |
| `Rating` | Counterpart | `rating`; Whole-number controlled selection with localized option labels. |
| `Timeline` | Counterpart | `timeline`; Host-owned chronological content with explicit terminal connectors. |
| `AnimatedLogo` | Composition | `graphic` plus host slots/state; no matching standalone export. |
| `AnimatedPortrait` | Composition | `image` plus host slots/state; no matching standalone export. |
| `ButtonLink` | Composition | `button` plus host slots/state; no matching standalone export. |
| `CoverImage` | Composition | `image` plus host slots/state; no matching standalone export. |
| `GradientDivider` | Composition | `divider` plus host slots/state; no matching standalone export. |
| `Stepper` | Counterpart | `stepper`; Host-owned progress with localized state and invalid-ID guards. |
| `FileUpload` | Platform / host | Platform document/media viewer and picker; host owns permissions, upload, retry and file URLs. |
| `Tour` | Counterpart | `tour`; Controlled guidance using measured host targets and recovery for missing targets. |
| `Anchor` | Platform / host | OS navigation, URL opening and named native scroll targets. SwiftUI also exports LumenLink. |
| `Segmented` | Counterpart | `segmented-control` |
| `Toolbar` | Composition | `button-group` plus host slots/state; no matching standalone export. |
| `Descriptions` | Composition | `text` plus host slots/state; no matching standalone export. |
| `DescriptionItem` | Composition | `text` plus host slots/state; no matching standalone export. |
| `DescriptionTerm` | Composition | `text` plus host slots/state; no matching standalone export. |
| `DescriptionDetail` | Composition | `text` plus host slots/state; no matching standalone export. |
| `Popconfirm` | Counterpart | `alert-dialog` |
| `Transfer` | Counterpart | `transfer`; Controlled source/target selections retaining hidden host values. |
| `Cascader` | Counterpart | `cascader`; Controlled destination paths with native branch browsing. |
| `TreeSelect` | Counterpart | `tree-select`; Controlled tree expansion and destination selection. |
| `Mentions` | Counterpart | `mentions`; Controlled suggestion insertion and composition guards; Apple text editor on iOS/visionOS. |
| `QRCode` | Counterpart | `qr-code`; Offline Unicode encoding with independently decoded rendered output. |
| `Watermark` | Platform / host | Native overlay drawing; host owns content and privacy. |
| `Affix` | Platform / host | Native pinned headers, overlays and scroll observation. |
| `SpeedDial` | Composition | `button-group` plus host slots/state; no matching standalone export. |
| `Grid` | Platform / host | Native layout constraints, stacks, grids and safe-area containers. |
| `ScatterChart` | Counterpart | `scatter-chart` |
| `Heatmap` | Counterpart | `heatmap` |
| `RangeChart` | Counterpart | `range-chart` |
| `ComboChart` | Counterpart | `combo-chart` |
| `VisuallyHidden` | Platform / host | Native layout direction and accessibility traversal. |
| `CalendarHeatmap` | Counterpart | `calendar-heatmap` |
| `FunnelChart` | Counterpart | `funnel-chart` |
| `BoxPlot` | Counterpart | `box-plot` |
| `BulletChart` | Counterpart | `bullet-chart` |
| `LollipopChart` | Counterpart | `lollipop-chart` |
| `DumbbellChart` | Counterpart | `dumbbell-chart` |
| `Histogram` | Counterpart | `histogram` |
| `WaterfallChart` | Counterpart | `waterfall-chart` |
| `ChangeSummary` | Composition | `list-row` plus host slots/state; no matching standalone export. |
| `FilterBar` | Composition | `search-field` plus host slots/state; no matching standalone export. |
| `ChartMotion` | Platform / host | Web SVG interpolation; native chart animation remains adapter-owned. |
| `MotionGroup` | Platform / host | Web keyed DOM geometry; native layout transitions remain adapter-owned. |
| `VisualEffect` | Platform / host | Web CSS and pointer effects; native rendering uses platform drawing APIs. |
| `ApprovalCard` | Composition | `surface` plus consumer-owned approval state and native actions. |
| `PromptComposer` | Composition | `text-field` plus consumer-owned submission, stop and transport state. |
| `SourceCitation` | Platform / host | Named native links and OS URL opening plus consumer-owned citation metadata. |
| `StreamMessage` | Composition | `surface` plus consumer-owned streamed content and accessible status. |
| `ToolActivity` | Composition | `surface` plus consumer-owned disclosure and tool status. |
| `WorldMap` | Gap | Web-only SVG visualization; native map renderers are not implemented. Consumers own travel data and routing. |
