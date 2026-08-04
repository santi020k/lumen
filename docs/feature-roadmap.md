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
- Data visualization: shared chart types, scales, ticks, line/area, grouped/stacked bar, and
  pie/donut geometry; tokenized `Chart`, `Sparkline`, `BarChart`, `LineChart`, and `PieChart`
  surfaces; revealable data tables; and Astro, React, and Elements parity without a charting
  runtime dependency. See
  [Observatory's consumer implementation learnings](consumer-chart-implementation-learnings.md)
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

## Next

- Continue moving independent Astro behaviors behind selector-gated controller chunks while
  preserving the single `UIPrimitives` mounting API.
- Ratchet coverage thresholds upward as focused React hook and interaction tests land.
- Keep full-browser interaction checks focused on behavior contracts; keep pixel regression on one
  deterministic browser and operating system.
