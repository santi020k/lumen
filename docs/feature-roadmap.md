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
  `--target react`, and `--target elements` for component wrappers; `--dry-run`, `--cwd`,
  conflict-safe skips, `--force`, `--fail-on-conflict`, and `--merge` for deterministic
  conflict-aware installs; and alternate local, remote, and token-authenticated private manifests
  with `--registry` when items provide inline `{ path, source }` file entries.
- Per-component registry: component entries are addressable by canonical and kebab-case names, with
  target-aware local wrapper files, manifest-backed package metadata, and docs guidance for
  `lumen add <component> --target <framework>`.
- Bundled recipe parity: scheduler, data collections, advanced fields, theme builder, and rich text
  starter recipes now generate Astro, React, or Elements files with `lumen add <recipe> --target
  <framework>`.
- Scheduling surfaces: `Schedule` and `Agenda`.
- Advanced data surfaces: `DataTable`, `Tree`, `TreeGrid`, and `VirtualList`.
- Theme tooling surface: `ThemeBuilder`.
- Rich text composition surface: `RichTextEditor`.
- Advanced fields: `Autocomplete`, `NumberField`, `SearchField`, `TimeField`, `DateRangePicker`,
  `ColorPicker`, `InputOTP`, `Select`, and `TagGroup`.
- Runtime hooks: `Schedule` emits `ui:schedule-change`, `VirtualList` emits
  `ui:virtual-list-range`, `ThemeBuilder` emits `ui:theme-export`, `RichTextEditor` emits
  `ui:editor-command`, `TagGroup` emits `ui:tag-remove`, forms emit `ui:validate`,
  `ui:invalid`, and `ui:valid`, DataTable emits `ui-datatable-selectionchange`, and Toast/Sonner
  expose `ui:toast`, `ui:toast-update`, `ui:toast-dismiss`, and `ui:toast-action`.
- Shared behavior helpers: `@santi020k/lumen-core` exports schedule slot/recurrence/persistence
  and resize helpers, saved data-view serialization/filter/sort/pagination/persistence helpers,
  virtual range math, pinned-column and selection helpers, server request adapters, schedule conflict
  helpers, and theme CSS import/export plus contrast scoring and palette tuning helpers.
- Astro behavior hardening: `Select`, `Resizable`, `InputOTP`, `Calendar`, `DataTable`,
  `DateRangePicker`, `ContextMenu`, form validation, and Toast/Sonner now have runtime-backed
  behavior, with idempotent binding for global listeners.
- Astro component consistency: the catalog uses `resolveLumenAstroProps`, `surface="glass"` is a
  deprecated alias for `glass`, and the C1-C7 audit fixes are resolved except for the documented
  follow-up polish items.
- Documentation surface: component pages include docs search, keyboard interaction notes, runtime
  event tables, and per-component API references where rows have been authored.
- React behavior hooks: `useDialog`, `usePopover`, `useDropdownMenu`, `useTabs`, `useSelect`,
  `useToast`, and `useTooltip` expose the main behavior contracts for React apps.
- Rich-text adapter guidance: `docs/ai-usage.md` documents the event-bridge pattern for Tiptap,
  ProseMirror, Lexical, or Markdown engines without adding a heavy editor runtime to Lumen.

## Next

- Web Components behavior parity: `packages/elements` currently emits classes/default
  `data-ui-*` attributes and documents Astro as the reference runtime; behavior-heavy elements still
  need equivalent client behavior.
- Theme tooling polish: the docs theme playground now uses the public `ThemeBuilder` runtime; add
  import/check contrast flows when token review needs to go beyond generation and export.
- Per-component API prop tables completeness: `apps/docs/src/data/docs.ts` uses a partial
  `apiReferenceByComponent` map, so many components still rely only on common rows.
- Visual regression coverage for new interactive components: `tests/visual/components.spec.ts`
  covers 20 component docs pages, but not newer interactive surfaces such as Calendar, Resizable,
  InputOTP, Sonner, ContextMenu, DateRangePicker, Tree, TreeGrid, or VirtualList.
- Migration guide for `private-website`: no Lumen repo guide currently explains how to replace the
  sibling project's duplicated UI system with these primitives.
- DataTable event rename: `DataTable` still emits `ui-datatable-selectionchange`; rename it to the
  `ui:*` event convention at the next major.
