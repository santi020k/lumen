# Feature Roadmap

This roadmap turns the competitor research into Lumen work items. Astro remains the reference
surface; React and Web Components expose the same class and data contracts.

## Implemented Foundations

- AI discovery: `llms.txt` and `docs/ai-usage.md` point agents at the package map, catalog, styling
  contract, and setup rules.
- Registry manifest: `registry/lumen.registry.json` describes components, recipes, docs, tokens, and
  runtime files that a future `lumen add` command can install.
- Registry API and CLI: `@santi020k/lumen/registry` exports typed recipe metadata, and the `lumen`
  binary can list registry items, show recipe contents, print install commands, add recipe starter
  files, and generate component wrappers with `lumen add <item>`. Add supports `--target astro`,
  `--target react`, and `--target elements` for component wrappers and bundled recipe starters;
  `--dry-run`, `--cwd`,
  conflict-safe skips, `--force`, `--fail-on-conflict`, and `--merge` for deterministic
  conflict-aware installs; and alternate local, remote, and token-authenticated private manifests
  with `--registry` when items provide inline `{ path, source }` file entries.
- Per-component registry: component entries are addressable by canonical and kebab-case names, with
  target-aware local wrapper files, manifest-backed package metadata, and docs guidance for
  `lumen add <component> --target <framework>`.
- Bundled recipe parity: scheduler, data collections, advanced fields, theme builder, and rich text
  starter recipes now generate Astro, React, or Elements files with `lumen add <recipe> --target
<framework>`.
- Product template gallery: analytics, SaaS admin, commerce, project workspace, and
  authentication/onboarding families have live responsive previews plus installable Astro, React,
  and Elements recipes with shared token-based styling.
- Scheduling surfaces: `Schedule` and `Agenda`.
- Advanced data surfaces: `DataTable`, `Tree`, `TreeGrid`, and `VirtualList`.
- Data visualization: shared categorical, numeric, and time scales; line/area, grouped/stacked bar,
  pie/donut, scatter/bubble, heatmap, range, and combo geometry; deterministic reduction and live
  windows; generated visualization tokens; accessible summaries and fallback data; and web,
  React Native, SwiftUI, and Compose surfaces without a required charting
  runtime dependency. See
  [Observatory's consumer implementation learnings](archive/consumer-chart-implementation-learnings.md)
  for product-level feedback and possible follow-up improvements.
- Theme tooling surface: `ThemeBuilder`.
- Rich text composition surface: `RichTextEditor`.
- Advanced fields: `Autocomplete`, `NumberField`, `SearchField`, `TimeField`, `DateRangePicker`,
  `ColorPicker`, `InputOTP`, `Select`, and `TagGroup`.
- Runtime hooks: `Schedule` emits `ui:schedule-change`, `VirtualList` emits
  `ui:virtual-list-range`, `ThemeBuilder` emits `ui:theme-export`, `RichTextEditor` emits
  `ui:editor-command`, `TagGroup` emits `ui:tag-remove`, forms emit `ui:validate`,
  `ui:invalid`, and `ui:valid`, DataTable emits `ui:data-table-selection-change`, and Toast
  expose `ui:toast`, `ui:toast-update`, `ui:toast-dismiss`, and `ui:toast-action`.
- Shared behavior helpers: `@santi020k/lumen-core` exports schedule slot/recurrence/persistence
  and resize helpers, saved data-view serialization/filter/sort/pagination/persistence helpers,
  virtual range math, pinned-column and selection helpers, server request adapters, schedule conflict
  helpers, and theme CSS import/export plus contrast scoring and palette tuning helpers.
- Astro behavior hardening: `Select`, `Resizable`, `InputOTP`, `Calendar`, `DataTable`,
  `DateRangePicker`, `ContextMenu`, form validation, and Toast now has runtime-backed
  behavior, with idempotent binding for global listeners.
- Astro component consistency: the catalog uses `resolveLumenAstroProps`, the v1 glass API is
  consistent across framework adapters, and the C1-C7 audit fixes are resolved except for the
  documented follow-up polish items.
- Documentation surface: component pages include docs search, keyboard interaction notes, runtime
  event tables, and an exhaustive typed per-component API reference. Adding a component without an
  API entry now fails type-checking.
- React behavior hooks: `useDialog`, `usePopover`, `useDropdownMenu`, `useTabs`, `useSelect`,
  `useContextMenu`, `useFormValidation`, `useCalendar`, `useInputOTP`, `useDateRangePicker`,
  `useRichTextEditor`, `useSchedule`, `useResizable`, `useToast`, and `useTooltip` expose the main
  behavior contracts for React apps.
- Rich-text adapter guidance: `docs/ai-usage.md` documents the event-bridge pattern for Tiptap,
  ProseMirror, Lexical, or Markdown engines without adding a heavy editor runtime to Lumen.
- Catalog-wide visual regression: every documented component page is derived from the shared
  catalog and captured in light and dark themes, with additional interactive-state scenarios.
- Cross-framework conformance: CI checks the shared root class and behavior data-attribute
  contracts across Astro, React, and Elements.
- Runtime budgets: CI tracks raw and gzip budgets for the Astro controller chunks, shared CSS,
  React components and hooks, and Elements controller.
- Version 1 compatibility cleanup: `ui:data-table-selection-change` is the only DataTable selection
  event, and glass-aware surfaces use the `glass` prop or attribute across all adapters.
- Sibling application navigation and clipboard contracts: `Progress` supports hydrated updates,
  `Anchor` supports rich items plus accessible deterministic scroll state, `Item` supports semantic
  hosts, and `CopyButton` copies arbitrary values or referenced content with event and Toast
  feedback across Astro, React, and Elements.

## Consumer-driven improvements

See [consumer UI recipes](consumer-ui-recipes.md) for the static React icon entrypoint, opt-in
responsive record tables across web adapters, and React Native sheet composition controls.
Editor layouts, whole-unit amount fields, and asynchronous workflows remain consumer recipes.

## Lumen 4 release priorities

- Complete the [v4 readiness plan](lumen-4-readiness.md), including automated checks, package-consumer
  canaries, compatibility, security, provenance and exact-revision approval. The
  [current release policy](native-release-runbook.md#current-release-policy) supersedes historical
  native consumer/device and stability completion requirements.
- Versioned migration previews cover v2, v3 and v4. V3 coordinates package updates without
  inventing web source rewrites; v4 preserves explicit layout gaps and flags application-owned CSS,
  chart, dialog and native contracts for review.
- Inherited RTL keyboard navigation is verified across web adapters, including direction changes after
  mounting. Native range inputs retain browser-owned keyboard behavior.
- [VirtualList data mode](virtual-list-data.md) provides bounded rendering of large fixed-height
  collections, with stable keys, total scroll extent and retained keyboard focus.

## Lumen 5

Lumen 5 shipped modular delivery within the existing packages, editable recipes, consumer
regression fixes, and measured route-level CSS and JavaScript costs. The
[Lumen 5 plan](archive/lumen-5-plan.md) is archived with its measurements and acceptance record.

## Open backlog

This section is the single list of open work. Add new items here instead of creating a new
top-level backlog file. Each item links to the archived record that holds its original evidence
and acceptance criteria. Remove an item once its acceptance work has landed.

### Consumer adoption tooling

Carried from the [Lumen 4.2 consumer upgrade findings](archive/lumen-4.2-consumer-upgrade-findings.md).
Re-check each one against the v5 CLI before starting work.

- **P1: Release-map-aware rollout.** `lumen rollout` and `lumen migrate --dry-run` should read the
  release manifest so an independently versioned family does not report false mismatches or
  downgrade newer compatible packages.
- **P2: Verify the transitive umbrella.** `lumen audit-consumer` should compare the resolved graph
  with the release manifest and suggest the smallest package-manager-specific update.
- **P2: Recognize critical CSS imports.** Consumer audits should follow CSS import chains and
  accept `styles/critical.css`, reporting only components that fall outside its coverage.
- **P2: Cheaper fresh SwiftPM adoption.** Measure cold and warm resolution for a small consumer and
  compare ways to ship only the required sources without changing the public package URL or tags.
- **P2: Actionable migration findings.** Group manual review findings by behavior and link each one
  to a documented contract and a concrete verification step.

### Native components

Carried from the [native consumer backlog](archive/native-consumer-backlog-v4.md). Items marked
Recipe need examples and interaction tests, not a new primitive.

#### Open: API work

- [SwiftUI date-field verbatim and custom-label content](archive/native-consumer-backlog-v4.md#swiftui-date-field-verbatim-and-custom-label-content): DateField still stores LocalizedStringKey title, description, and error. LumenTextContent and custom-label overloads remain to implement and test.
- [SwiftUI structured-state verbatim content](archive/native-consumer-backlog-v4.md#swiftui-structured-state-verbatim-content): EmptyState and ErrorState still store localized-key content. Verbatim title/description/reference overloads and their fixtures remain; generic action slots already exist.
- [SwiftUI semantic icon tones in status labels](archive/native-consumer-backlog-v4.md#swiftui-semantic-icon-tones-in-status-labels): Icon accepts explicit Color and inherits button content color, but has no public semantic-tone initializer. Tone resolution and combined noninteractive status examples remain.
- [SwiftUI icon-button verbatim accessibility labels](archive/native-consumer-backlog-v4.md#swiftui-icon-button-verbatim-accessibility-labels): IconButton accessible labels remain LocalizedStringKey even though its loading value accepts LumenTextContent. Both named-icon and SF Symbol label overloads remain.
- [Native button hierarchy and semantic tone](archive/native-consumer-backlog-v4.md#native-button-hierarchy-and-semantic-tone): Button intent still combines hierarchy and color, with a filled danger intent. Independent success/destructive tone across primary, secondary, and quiet hierarchies remains a public-contract proposal.
- [SwiftUI share-button width and resolved-label contract](archive/native-consumer-backlog-v4.md#swiftui-share-button-width-and-resolved-label-contract): ShareButton has custom-label initializers and localized-key convenience labels, but no explicit full-width/alignment or LumenTextContent convenience contract. System sharing stays host-owned.
- [SwiftUI divider orientation and contrast contract](archive/native-consumer-backlog-v4.md#swiftui-divider-orientation-and-contrast-contract): Divider remains a horizontal one-point theme-line rectangle. Vertical orientation and semantic media-contrast treatment remain; retain native system-menu dividers.
- [SwiftUI text-input character-limit contract](archive/native-consumer-backlog-v4.md#swiftui-text-input-character-limit-contract): TextField and Textarea expose no character-limit contract. Specify grapheme counting, validation versus truncation, paste/composition behavior, and counters before implementing an additive API.
- [SwiftUI transient status actions and resolved localization](archive/native-consumer-backlog-v4.md#swiftui-transient-status-actions-and-resolved-localization): Toast and related status surfaces still use localized-key content in their convenience contracts. Verbatim status/action content and multi-action ownership recipes remain.
- [SwiftUI compact selected date tiles](archive/native-consumer-backlog-v4.md#swiftui-compact-selected-date-tiles): No dedicated compact selection-tile contract was identified. First validate a composition with current primitives, selected traits, directional padding, and a 44-point target before adding a new primitive.
- [SwiftUI section-header leading content and verbatim titles](archive/native-consumer-backlog-v4.md#swiftui-section-header-leading-content-and-verbatim-titles): SectionHeader title and subtitle are LocalizedStringKey and only trailing actions are generic. Verbatim content, decorative leading slots, and intrinsic-fit action layout remain.
- [SwiftUI grouped list-card composition and selectable row semantics](archive/native-consumer-backlog-v4.md#swiftui-grouped-list-card-composition-and-selectable-row-semantics): ListRow and Card exist separately; no dedicated grouped list-card/header/footer/selected-row contract was identified. Evaluate a public composition first, preserving native activation and context menus.

#### Partial: remaining acceptance work

- [SwiftUI compact button hit targets](archive/native-consumer-backlog-v4.md#swiftui-compact-button-hit-targets): Expanded semantic-frame, adjacent-target, selected-action, and adaptive composition acceptance remain.
- [SwiftUI slider gesture and composition contract](archive/native-consumer-backlog-v4.md#swiftui-slider-gesture-and-composition-contract): The binding and bounds are still Double; generic floating-point support and the complete gesture/undo example remain.
- [SwiftUI button loading accessibility content](archive/native-consumer-backlog-v4.md#swiftui-button-loading-accessibility-content): Loading still couples disabling and the built-in spinner; independently configurable busy presentation and rendered locale assertions remain.
- [SwiftUI accent-derived theme bridge](archive/native-consumer-backlog-v4.md#swiftui-accent-derived-theme-bridge): A coherent derived-accent recipe with contrast verification remains.
- [SwiftUI selection-control rich option content](archive/native-consumer-backlog-v4.md#swiftui-selection-control-rich-option-content): Rich option labels/values and adaptive layouts need an intentional contract; the many nested-card recipes need separate acceptance.
- [SwiftUI badge accessory and verbatim content](archive/native-consumer-backlog-v4.md#swiftui-badge-accessory-and-verbatim-content): Accessory/chip APIs and parent-owned count semantics examples remain.
- [Native spinner color in nested actions](archive/native-consumer-backlog-v4.md#native-spinner-color-in-nested-actions): Standalone defaults remain brand. Size, parent-owned announcement, nested-theme, and rendered cross-adapter acceptance remain.
- [SwiftUI icon-only menu labels on macOS](archive/native-consumer-backlog-v4.md#swiftui-icon-only-menu-labels-on-macos): A direct accessible-name parameter and rendered macOS locale/disabled tests remain.
- [SwiftUI system-container boundary guidance](archive/native-consumer-backlog-v4.md#swiftui-system-container-boundary-guidance): Complete per-container rendered and semantic regression coverage remains.
- [SwiftUI phone-input in-app localization](archive/native-consumer-backlog-v4.md#swiftui-phone-input-in-app-localization): Document the in-app locale bridge and verify mounted updates and opposite-locale behavior.
- [Native status-bar message reflow](archive/native-consumer-backlog-v4.md#native-status-bar-message-reflow): Keep task lifecycle host-owned.
- [SwiftUI skeleton theme inheritance and media composition](archive/native-consumer-backlog-v4.md#swiftui-skeleton-theme-inheritance-and-media-composition): Add branded placeholder grids, one parent announcement, circle geometry regression coverage, and media-boundary examples.
- [Compose sheet locale and form presentation](archive/native-consumer-backlog-v4.md#compose-sheet-locale-and-form-presentation): Caller locale propagation and opposite-locale rendered fixtures remain to verify.

#### Core present: verification remains

- [SwiftUI semantic button roles](archive/native-consumer-backlog-v4.md#swiftui-semantic-button-roles): Remaining acceptance work is role-specific interaction coverage and the complete native-treatment recipe.
- [SwiftUI picker rich label and current-value content](archive/native-consumer-backlog-v4.md#swiftui-picker-rich-label-and-current-value-content): PickerLabelTests covers selected-label layout; the full opposite-locale and interaction matrix is not established by that test.
- [SwiftUI icon-button loading state](archive/native-consumer-backlog-v4.md#swiftui-icon-button-loading-state): The README documents the transition; the requested compact native interaction and semantic-frame fixtures remain.
- [Compose disabled quiet-button background](archive/native-consumer-backlog-v4.md#compose-disabled-quiet-button-background): Representative long-label rendered and consumer acceptance remain unverified here.
- [SwiftUI compact stat density](archive/native-consumer-backlog-v4.md#swiftui-compact-stat-density): Complete the requested two-stat 360-point and localized-value rendering matrix.

#### Recipe: examples and interaction tests

- [SwiftUI pinned browser surfaces with independent controls](archive/native-consumer-backlog-v4.md#swiftui-pinned-browser-surfaces-with-independent-controls): Add the pinned opaque-bar recipe with directional insets, independent control semantics, scrolling geometry, and material-boundary guidance.
- [SwiftUI disclosure and nested-action ownership](archive/native-consumer-backlog-v4.md#swiftui-disclosure-and-nested-action-ownership): Add deterministic nested-action examples, collapsed/expanded focus assertions, and single-owner activation guidance.
- [SwiftUI informational card migration boundaries](archive/native-consumer-backlog-v4.md#swiftui-informational-card-migration-boundaries): Add before/after informational-card examples and ensure descriptions, summaries, and nearby actions stay consumer-owned.
- [SwiftUI sheet cards and scroll-to-action reachability](archive/native-consumer-backlog-v4.md#swiftui-sheet-cards-and-scroll-to-action-reachability): Add nested-card reachability fixtures above safe-area actions, asserting visible/hittable controls rather than presence alone.
- [SwiftUI membership information cards and selection boundaries](archive/native-consumer-backlog-v4.md#swiftui-membership-information-cards-and-selection-boundaries): Add the requested membership example and selection/large-text interaction acceptance.
- [SwiftUI control-rich scheduling cards and nested action targets](archive/native-consumer-backlog-v4.md#swiftui-control-rich-scheduling-cards-and-nested-action-targets): Add the non-action scheduling card with independent target, focus-order, and narrow-width assertions.
- [SwiftUI result cards with independent score and picker controls](archive/native-consumer-backlog-v4.md#swiftui-result-cards-with-independent-score-and-picker-controls): Add the result/sorting example with separate score and picker actions, static headings, resolved text, and viewport coverage.
- [SwiftUI action cards with independent overlaid accessories](archive/native-consumer-backlog-v4.md#swiftui-action-cards-with-independent-overlaid-accessories): Add sibling-overlay examples and assertions that accessory activation never triggers the primary action.
- [SwiftUI zero-padding cards as grouped selection rows](archive/native-consumer-backlog-v4.md#swiftui-zero-padding-cards-as-grouped-selection-rows): Add grouped native-button rows with selected traits, separators, target sizes, and no parent action.
- [SwiftUI list-row inset ownership inside native lists](archive/native-consumer-backlog-v4.md#swiftui-list-row-inset-ownership-inside-native-lists): Add native List recipes that deliberately remove native row insets and preserve outer-button and secondary-control semantics.
- [SwiftUI responsive informational cards with a concise accessibility summary](archive/native-consumer-backlog-v4.md#swiftui-responsive-informational-cards-with-a-concise-accessibility-summary): Add horizontal/vertical non-action card examples with a caller-owned concise summary, one static focus stop, and independently reachable external actions.
- [SwiftUI non-action cards with nested controls in a partial sheet](archive/native-consumer-backlog-v4.md#swiftui-non-action-cards-with-nested-controls-in-a-partial-sheet): Verify that card-level modifiers do not mask child actions.
- [SwiftUI grouped cards above a persistent action bar](archive/native-consumer-backlog-v4.md#swiftui-grouped-cards-above-a-persistent-action-bar): Add grouped-card examples with score and copy/add actions above a safe-area bar, using exact token inspection and scroll-to-action assertions.
- [SwiftUI cards inside native navigation links](archive/native-consumer-backlog-v4.md#swiftui-cards-inside-native-navigation-links): Add navigation/context-menu fixtures, one semantic action, and accessible-size media-summary reflow.
- [SwiftUI grouped cards containing independent controls](archive/native-consumer-backlog-v4.md#swiftui-grouped-cards-containing-independent-controls): Add shared static-card helpers with independent choice and crop controls, preserving stable leaf identities, safe-area reachability, and token-density comparisons.
- [SwiftUI single-action selection cards inside a static group](archive/native-consumer-backlog-v4.md#swiftui-single-action-selection-cards-inside-a-static-group): Add a static parent with independently actionable child cards, explicit selected traits, cached/ready/disabled states, and deterministic generating fixtures.
- [SwiftUI action cards with sibling overlay controls](archive/native-consumer-backlog-v4.md#swiftui-action-cards-with-sibling-overlay-controls): Add enabled/capacity/over-capacity fixtures proving primary-action disabling does not disable useful sibling controls; assert separate identities and targets.
- [SwiftUI selection cards with directional consumer padding](archive/native-consumer-backlog-v4.md#swiftui-selection-cards-with-directional-consumer-padding): Document directional host insets and stable domain identities; evaluate a directional-inset API only if composition cannot satisfy the example.
- [SwiftUI non-action surfaces inside existing menu buttons](archive/native-consumer-backlog-v4.md#swiftui-non-action-surfaces-inside-existing-menu-buttons): Add resolved-name/value fixtures, one activation owner, and before/after density checks.

### Web delivery

- Continue moving independent Astro behaviors behind selector-gated controller chunks while
  preserving the single `UIPrimitives` mounting API.
- Ratchet the coverage thresholds in `vitest.config.ts` upward as focused React hook and
  interaction tests land.
- Keep full-browser interaction checks focused on behavior contracts; keep pixel regression on one
  deterministic browser and operating system.
