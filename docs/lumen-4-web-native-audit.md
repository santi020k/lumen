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
- **Gap:** a library contract or documented reusable recipe is absent. Rich-text editing and board
  drag/reorder need a dedicated interaction design before adopting a shared API.

Reviewed 182 web entries: 70 counterparts, 61 compositions,
27 platform/host boundaries and 24 gaps. MultiSelect is an additional native
contract; web composes its selection primitives. It now exists in all three adapters. RangeSlider
is also shared after the preceding interval-control pass.

## Next useful work

Start with accessible rating, step progression and timeline recipes, then table and hierarchical
selection contracts driven by a consumer. These are pending candidates, not implemented features.
Calendar/schedule, command search, mention editing and board interactions require application
integration and broader interaction tests. Compose tooltip coverage remains asymmetric.

Physical VoiceOver/TalkBack, React Native device runs, Android instrumentation for this pass and
consumer qualification remain separate from local unit checks and iPhone simulator/Expo preview.
No package publication or store update is implied by this audit.

## Complete catalog

| Web entry | Disposition | Native contract or pending boundary |
| --- | --- | --- |
| `Accordion` | Composition | `disclosure` plus host slots/state; no matching standalone export. |
| `Alert` | Counterpart | `alert` |
| `AlertDialog` | Counterpart | `alert-dialog` |
| `Agenda` | Gap | No standalone native event/availability calendar or agenda/schedule contract; date fields cover date selection only. |
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
| `Breadcrumb` | Gap | No native breadcrumb contract; compact navigation normally uses platform back/title. |
| `Bubble` | Composition | `card` plus host slots/state; no matching standalone export. |
| `Button` | Counterpart | `button` |
| `ButtonGroup` | Counterpart | `button-group` |
| `Calendar` | Gap | No standalone native event/availability calendar or agenda/schedule contract; date fields cover date selection only. |
| `Callout` | Counterpart | `banner` |
| `Card` | Counterpart | `card` |
| `CardContent` | Composition | `card` plus host slots/state; no matching standalone export. |
| `CardDescription` | Composition | `card` plus host slots/state; no matching standalone export. |
| `CardFooter` | Composition | `card` plus host slots/state; no matching standalone export. |
| `CardHeader` | Composition | `card` plus host slots/state; no matching standalone export. |
| `CardTitle` | Composition | `card` plus host slots/state; no matching standalone export. |
| `Carousel` | Gap | No shared native carousel contract; paging must currently be application-owned. |
| `Chart` | Composition | `line-chart` plus host slots/state; no matching standalone export. |
| `Checkbox` | Counterpart | `checkbox` |
| `CheckboxGroup` | Composition | `checkbox` plus host slots/state; no matching standalone export. |
| `Collapsible` | Composition | `disclosure` plus host slots/state; no matching standalone export. |
| `Code` | Platform / host | Native text and LumenTabs; host owns syntax highlighting. |
| `CodeTabs` | Platform / host | Native text and LumenTabs; host owns syntax highlighting. |
| `Combobox` | Counterpart | `autocomplete` |
| `Container` | Platform / host | Native layout constraints, stacks, grids and safe-area containers. |
| `CopyButton` | Platform / host | Application clipboard operation with a named LumenButton. |
| `Command` | Gap | No native command-search/palette contract. |
| `ContextNavigation` | Composition | `navigation-bar` plus host slots/state; no matching standalone export. |
| `ContextMenu` | Counterpart | `menu` |
| `ColorPicker` | Gap | No shared native color-selection contract. |
| `DataTable` | Gap | No shared native tabular sorting/selection contract. |
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
| `ImageComparison` | Counterpart | `image-comparison` |
| `Illustration` | Counterpart | `illustration` |
| `Input` | Counterpart | `text-field` |
| `InputGroup` | Composition | `field-group` plus host slots/state; no matching standalone export. |
| `InputOTP` | Counterpart | `input-otp` |
| `Item` | Counterpart | `list-row` |
| `KanbanBoard` | Gap | No native board drag/reorder contract. |
| `KanbanColumn` | Gap | No native board drag/reorder contract. |
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
| `RichTextEditor` | Gap | No native rich-text editing contract. |
| `ScrollArea` | Platform / host | Native scrolling/lazy-list containers with stable record identities. |
| `ScrollProgress` | Platform / host | Native pinned headers, overlays and scroll observation. |
| `Schedule` | Gap | No standalone native event/availability calendar or agenda/schedule contract; date fields cover date selection only. |
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
| `Table` | Gap | No shared native tabular sorting/selection contract. |
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
| `Tooltip` | Gap | Compose only; SwiftUI and React Native have no Lumen tooltip counterpart. |
| `Tree` | Gap | No shared native hierarchy expansion/selection or hierarchical table contract. |
| `TreeGrid` | Gap | No shared native hierarchy expansion/selection or hierarchical table contract. |
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
| `Rating` | Gap | No shared accessible rating contract. |
| `Timeline` | Gap | No native timeline contract. |
| `AnimatedLogo` | Composition | `graphic` plus host slots/state; no matching standalone export. |
| `AnimatedPortrait` | Composition | `image` plus host slots/state; no matching standalone export. |
| `ButtonLink` | Composition | `button` plus host slots/state; no matching standalone export. |
| `CoverImage` | Composition | `image` plus host slots/state; no matching standalone export. |
| `GradientDivider` | Composition | `divider` plus host slots/state; no matching standalone export. |
| `Stepper` | Gap | No shared step progression contract. |
| `FileUpload` | Platform / host | Platform document/media viewer and picker; host owns permissions, upload, retry and file URLs. |
| `Tour` | Gap | No native guided-tour contract. |
| `Anchor` | Platform / host | OS navigation, URL opening and named native scroll targets. SwiftUI also exports LumenLink. |
| `Segmented` | Counterpart | `segmented-control` |
| `Toolbar` | Composition | `button-group` plus host slots/state; no matching standalone export. |
| `Descriptions` | Composition | `text` plus host slots/state; no matching standalone export. |
| `DescriptionItem` | Composition | `text` plus host slots/state; no matching standalone export. |
| `DescriptionTerm` | Composition | `text` plus host slots/state; no matching standalone export. |
| `DescriptionDetail` | Composition | `text` plus host slots/state; no matching standalone export. |
| `Popconfirm` | Counterpart | `alert-dialog` |
| `Transfer` | Gap | No native dual-list transfer contract. |
| `Cascader` | Gap | No shared native hierarchy expansion/selection or hierarchical table contract. |
| `TreeSelect` | Gap | No shared native hierarchy expansion/selection or hierarchical table contract. |
| `Mentions` | Gap | No native mention suggestion/editor contract. |
| `QRCode` | Gap | No native QR rendering contract. |
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
