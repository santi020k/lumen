# Feature Roadmap

This roadmap turns the competitor research into Lumen work items. Astro remains the reference
surface; React and Web Components expose the same class and data contracts.

## Implemented Foundations

- AI discovery: `llms.txt` and `docs/ai-usage.md` point agents at the package map, catalog, styling
  contract, and setup rules.
- Registry manifest: `registry/lumen.registry.json` describes components, recipes, docs, tokens, and
  runtime files that a future `lumen add` command can install.
- Registry API and CLI: `@santi020k/lumen/registry` exports typed recipe metadata, and the `lumen`
  binary can list registry items, show recipe contents, and print install commands.
- Scheduling surfaces: `Schedule` and `Agenda`.
- Advanced data surfaces: `Tree`, `TreeGrid`, and `VirtualList`.
- Theme tooling surface: `ThemeBuilder`.
- Rich text composition surface: `RichTextEditor`.
- Advanced fields: `Autocomplete`, `NumberField`, `SearchField`, `TimeField`, `DateRangePicker`,
  `ColorPicker`, and `TagGroup`.
- Runtime hooks: `Schedule` emits `ui:schedule-change`, `VirtualList` emits
  `ui:virtual-list-range`, `ThemeBuilder` emits `ui:theme-export`, `RichTextEditor` emits
  `ui:editor-command`, and `TagGroup` emits `ui:tag-remove`.

## Next Behavior Layers

- Add resize, collision, recurrence, resource lanes, and persistence adapters for `Schedule`.
- Add sorting, column pinning, saved views, and server-data adapters for `DataTable`, `TreeGrid`,
  and `VirtualList`.
- Add import helpers and palette generation for `ThemeBuilder`.
- Add Tiptap or adapter examples for `RichTextEditor` without making the core package heavy.
- Add a full `lumen add <item>` installer once the public file-writing story is ready.
