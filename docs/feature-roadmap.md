# Feature Roadmap

This roadmap turns the competitor research into Lumen work items. Astro remains the reference
surface; React and Web Components expose the same class and data contracts.

## Implemented Foundations

- AI discovery: `llms.txt` and `docs/ai-usage.md` point agents at the package map, catalog, styling
  contract, and setup rules.
- Registry manifest: `registry/lumen.registry.json` describes components, recipes, docs, tokens, and
  runtime files that a future `lumen add` command can install.
- Registry API and CLI: `@santi020k/lumen/registry` exports typed recipe metadata, and the `lumen`
  binary can list registry items, show recipe contents, print install commands, and add recipe
  starter files with `lumen add <item>`. Add supports `--dry-run`, `--cwd`, conflict-safe skips, and
  `--force`, plus `--fail-on-conflict` for CI and `--merge` for deterministic conflict-aware merges;
  list/show/add can load alternate local, remote, and token-authenticated private manifests with
  `--registry` when items provide inline `{ path, source }` file entries.
- Scheduling surfaces: `Schedule` and `Agenda`.
- Advanced data surfaces: `Tree`, `TreeGrid`, and `VirtualList`.
- Theme tooling surface: `ThemeBuilder`.
- Rich text composition surface: `RichTextEditor`.
- Advanced fields: `Autocomplete`, `NumberField`, `SearchField`, `TimeField`, `DateRangePicker`,
  `ColorPicker`, and `TagGroup`.
- Runtime hooks: `Schedule` emits `ui:schedule-change`, `VirtualList` emits
  `ui:virtual-list-range`, `ThemeBuilder` emits `ui:theme-export`, `RichTextEditor` emits
  `ui:editor-command`, and `TagGroup` emits `ui:tag-remove`.
- Shared behavior helpers: `@santi020k/lumen-core` exports schedule slot/recurrence/persistence
  and resize helpers, saved data-view serialization/filter/sort/pagination/persistence helpers,
  virtual range math, pinned-column and selection helpers, server request adapters, schedule conflict
  helpers, and theme CSS import/export plus contrast scoring and palette tuning helpers.
- Rich-text adapter guidance: `docs/ai-usage.md` documents the event-bridge pattern for Tiptap,
  ProseMirror, Lexical, or Markdown engines without adding a heavy editor runtime to Lumen.

## Next Behavior Layers

- Add deeper framework-specific adapter examples as real applications reveal repeated patterns.
