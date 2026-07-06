# Lumen component audit

Date: 2026-07-06. Scope: all 79 Astro components (`packages/astro/components/`), main examples (`apps/docs/src/examples/`), glass examples (`apps/docs/src/examples/glass/`), shared CSS (`packages/astro/styles/lumen.css`), and runtime (`packages/astro/runtime/UIPrimitives.astro`).

Verified mechanically: every `ui-*` class emitted by components exists in `lumen.css` (no dangling classes), and runtime hooks were cross-checked against `data-ui-*` attributes.

The bar for examples (per your choice): each main example should demonstrate every prop, variant, size, and state. Glass variants are covered by the separate `glass/` examples, so they are not counted as missing from main examples.

---

## Cross-cutting findings

**C1 — Resolved.** `Textarea.astro` now keeps `<slot />` inline inside `<textarea>` and documents why, so placeholder text is no longer suppressed by component whitespace.

**C2 — Resolved.** `Select.astro` is now an enhanced listbox backed by a native select (`data-ui-select-native`, trigger, listbox, option buttons, disabled options, placeholder, and runtime keyboard/typeahead support); `NativeSelect.astro` remains the thin native wrapper.

**C3 — Resolved.** The behavior-implying shell gaps now have runtime coverage: `ContextMenu` binds `data-ui-context-menu-trigger` for right-click and Shift+F10 open behavior, and `DateRangePicker` syncs start/end date min/max values.

**C4 — Resolved except Tooltip follow-up.** `Skeleton` defaults to `aria-hidden` unless labeled, `AlertDialog` renders `role="alertdialog"`, `Autocomplete` dropped the incomplete explicit combobox role, `Button loading` disables the button, `Field` runtime wires hint/error ids into `aria-describedby`, and the `TagGroup` example gives remove buttons distinct labels. `Tooltip` still does not wire the trigger to the tooltip with `aria-describedby`.

**C5 — Mostly resolved.** Overlay `surface="glass"` props are now deprecated compatibility aliases that map through `resolveLumenGlass`; the remaining minor cleanup is `Avatar`, which can still render an empty root when no `src`, `fallback`, or slot content is provided.

**C6 — Resolved.** `resolveLumenAstroProps` in `packages/core/src/props.ts` now centralizes class/className merge and passthrough handling across the Astro component catalog.

**C7 — Resolved.** `AspectRatio` validates numeric and `a / b` ratio values and falls back to `16 / 9` for invalid input before writing the style attribute.

---

## Component-by-component

Legend — **Comp**: component implementation. **Ex**: main example vs the "all variants/states" bar. ✅ good · ⚠️ gaps · ❗ needs work.

### Actions & inputs

| Component | Comp | Ex | Findings |
|---|---|---|---|
| Button | ✅ | ✅ | Example now shows all variants, sizes, loading, and disabled; `loading` disables the native button. |
| ButtonGroup | ✅ | ✅ | Example includes labeled button groups and a 3-button attached row. |
| Toggle | ✅ | ✅ | Solid (aria-pressed + runtime); example includes pressed and disabled. |
| ToggleGroup | ✅ | ✅ | Roving focus via runtime. |
| Input | ✅ | ✅ | Example covers `sm`/default/`lg`, disabled, and invalid/described state. |
| InputGroup | ✅ | ✅ | Good composed example. |
| Textarea | ✅ | ✅ | Inline slot fixes the placeholder bug (C1). |
| Checkbox | ✅ | ✅ | Example covers unchecked, checked, indeterminate, and disabled. |
| Switch | ✅ | ✅ | Example covers checked, unchecked, and disabled. |
| RadioGroup | ✅ | ✅ | Fieldset + roving runtime; example wires name/checked correctly. |
| Slider | ✅ | ✅ | Example includes `step` and a labeled live value readout. |
| Select | ✅ | ✅ | Enhanced listbox with native select fallback, placeholder/options props, sizes, glass, disabled options, and keyboard/typeahead runtime. |
| NativeSelect | ✅ | ⚠️ | Native wrapper is distinct from Select and supports placeholder/options/sizes; example shows placeholder, disabled option, options prop, and `sm`, but not `lg` or disabled select. |
| Combobox | ⚠️ | ✅ | Runtime-backed; `options` accepts strings only (no value/label pairs, no disabled options). |
| Autocomplete | ✅ | ✅ | Clean datalist wrapper; explicit ARIA combobox role was removed. |
| NumberField | ✅ | ✅ | Thin native wrapper, example shows min/max/value. |
| SearchField | ✅ | ✅ | Fine. |
| ColorPicker | ✅ | ✅ | Fine. |
| DatePicker | ✅ | ✅ | Fine (native). |
| TimeField | ✅ | ✅ | Fine (native). |
| DateRangePicker | ✅ | ✅ | Runtime now keeps the two native date inputs consistent with min/max synchronization. |
| InputOTP | ✅ | ✅ | Native one-time-code input enhanced into segmented boxes. |
| Field | ✅ | ✅ | Runtime links hint/error descriptions via `aria-describedby` and powers `data-ui-form` validation events. |
| Label | ✅ | ✅ | Fine. |

### Overlays & menus

| Component | Comp | Ex | Findings |
|---|---|---|---|
| Dialog | ✅ | ✅ | Trigger/close runtime; best-in-repo example. |
| AlertDialog | ✅ | ✅ | Renders `role="alertdialog"` and uses the dialog trigger/close runtime. |
| Drawer | ✅ | ✅ | Fine. |
| Sheet | ✅ | ✅ | Fine. |
| Popover | ✅ | ✅ | Anchored-popover runtime; good example. |
| HoverCard | ✅ | ✅ | Fine. |
| DropdownMenu | ⚠️ | ✅ | Runtime works, but the component renders a `<menu>` wrapper around a user-provided `role="menu"` panel; document the expected trigger/panel shape or flatten later. |
| ContextMenu | ✅ | ✅ | Runtime-backed right-click and Shift+F10 behavior; example now uses a trigger instead of a permanently visible menu. |
| Menubar | ✅ | ✅ | Roving focus runtime. |
| Tooltip | ⚠️ | ✅ | Runtime handles hover/focus popover behavior and Escape dismissal, but does not set `aria-describedby` on the trigger. |
| Toast | ✅ | ✅ | Example covers success and warning programmatic toasts, placement, update, dismiss, action, and static fallback. |
| Sonner | ✅ | ✅ | `ui:toast` event demo with script; Toast example now covers multi-placement Sonner usage too. |

### Layout & structure

| Component | Comp | Ex | Findings |
|---|---|---|---|
| Card | ✅ | ✅ | Example covers default, muted, interactive, and `as`. |
| Accordion | ✅ | ✅ | Native details/summary; good example. |
| Collapsible | ✅ | ✅ | Fine. |
| AspectRatio | ✅ | ✅ | Ratio validation landed; example shows 16/9 and 4/3. |
| Separator | ✅ | ✅ | Example includes horizontal and vertical orientation. |
| ScrollArea | ✅ | ✅ | Great example. |
| Resizable | ✅ | ✅ | Split-panel runtime adds draggable, keyboard-accessible handles. |
| Sidebar | ✅ | ✅ | Fine. |
| Item | ✅ | ✅ | Fine. |
| Empty | ✅ | ✅ | Fine. |
| Direction | ✅ | ✅ | Fine. |
| Typography | ✅ | ✅ | Fine. |
| Table | ✅ | ✅ | Honest wrapper; fine. |
| DataTable | ✅ | ✅ | Runtime-enhanced sorting and row selection with form participation; event name is still the pre-`ui:*` `ui-datatable-selectionchange`. |

### Navigation

| Component | Comp | Ex | Findings |
|---|---|---|---|
| Breadcrumb | ⚠️ | ✅ | Still just a nav slot; consider documenting `<ol><li>` markup as the recommended children. |
| NavigationMenu | ✅ | ✅ | Fine. |
| Pagination | ✅ | ✅ | Example includes `rel="prev"/"next"` and disabled-state pagination. |
| Tabs | ✅ | ✅ | Runtime + fully wired ARIA example. |
| Command | ✅ | ✅ | Runtime filter; good example. |

### Data display & feedback

| Component | Comp | Ex | Findings |
|---|---|---|---|
| Badge | ✅ | ✅ | Example covers all variants. |
| Marker | ✅ | ✅ | Example covers default, success, warning, and danger. |
| Alert | ✅ | ✅ | Example covers default, success, warning, and destructive. |
| Avatar | ⚠️ | ✅ | Example now shows `src` and fallback; component can still emit an empty root when no image, fallback, or slot is provided. |
| Skeleton | ✅ | ✅ | Decorative by default with `aria-hidden`; example shows shaped/sized skeletons and an announced loading region. |
| Spinner | ✅ | ✅ | Best a11y handling in the repo. |
| Progress | ✅ | ✅ | Example shows default max, custom max, and 100% state. |
| Kbd | ✅ | ✅ | Fine. |
| Code | ✅ | ✅ | Richest component; example covers inline + block/copy/label. `theme` variants remain unshown (minor). |
| Chart | ✅ | ✅ | Static by design; example is exemplary. |
| Calendar | ✅ | ✅ | Runtime-enhanced month grid with navigation, selection, bounds, keyboard grid support, and form participation. |
| Tree | ✅ | ✅ | Example now shows nesting with `role="group"` and `aria-level`. |
| TreeGrid | ✅ | ✅ | Example now includes column headers and hierarchical levels. |
| VirtualList | ✅ | ✅ | Example now renders 200 rows to demonstrate virtualization. |
| TagGroup | ✅ | ✅ | Remove buttons have distinguishing labels. |

### Chat & scheduling

| Component | Comp | Ex | Findings |
|---|---|---|---|
| Bubble | ✅ | ✅ | Both `from` values shown. |
| Message | ✅ | ✅ | Fine. |
| MessageScroller | ✅ | ✅ | Great example. |
| Attachment | ✅ | ✅ | Example covers linked and non-link (`article`) forms. |
| Agenda | ✅ | ✅ | Fine. |
| Schedule | ✅ | ✅ | Drag runtime demoed. |
| Carousel | ✅ | ✅ | Prev/next runtime demoed. |
| RichTextEditor | ⚠️ | ✅ | Runtime delegates any `data-ui-editor-command` through `document.execCommand(command)` and documents the event bridge; still no curated supported command set. |
| ThemeBuilder | ✅ | ✅ | Live hue → token demo with export; excellent. |

---

## Prioritized fix list

**P1 — correctness & a11y (component code):**
1. Tooltip: set or document trigger `aria-describedby` wiring for `[role="tooltip"]`.
2. Decide whether `Avatar` should render a deliberate fallback/skeleton when no `src`, `fallback`, or slot content is provided.
3. Breadcrumb: document or enforce the recommended `<ol><li>` child structure.

**P2 — example coverage (the "all variants/states" bar):**
NativeSelect (`lg`, disabled select) · Code (`theme` variants, minor).

**P3 — consistency & maintenance:**
Broaden Combobox options beyond `string[]` if it should match Select option objects · flatten or document DropdownMenu markup expectations · document a curated RichTextEditor command set · rename DataTable's `ui-datatable-selectionchange` event to the `ui:*` convention at the next major.

Overall: the system is now much closer to its intended shape — thin, semantic, token-driven wrappers with runtime behavior on the components whose names promise interaction. The old correctness gaps are mostly closed; the remaining work is concentrated in a few semantics/a11y polish items, API breadth, and keeping event naming consistent across the newer runtime surface.
