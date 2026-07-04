# Lumen component audit

Date: 2026-07-04. Scope: all 80 Astro components (`packages/astro/components/`), main examples (`apps/docs/src/examples/`), glass examples (`apps/docs/src/examples/glass/`), shared CSS (`packages/astro/styles/lumen.css`), and runtime (`packages/astro/runtime/UIPrimitives.astro`).

Verified mechanically: every `ui-*` class emitted by components exists in `lumen.css` (no dangling classes), and runtime hooks were cross-checked against `data-ui-*` attributes.

The bar for examples (per your choice): each main example should demonstrate every prop, variant, size, and state. Glass variants are covered by the separate `glass/` examples, so they are not counted as missing from main examples.

---

## Cross-cutting findings

**C1 — Likely Textarea bug (verify first).** `Textarea.astro` renders `<slot />` on its own indented line inside `<textarea>`. Whitespace inside a textarea becomes its default value, which suppresses `placeholder`. Render `<textarea ...><slot /></textarea>` on one line and confirm the placeholder shows.

**C2 — `Select.astro` and `NativeSelect.astro` are byte-identical** (verified with `diff`). Either make `Select` an enhanced listbox (runtime-driven, like Combobox) or delete one and re-export/alias it with a doc note. Shipping two identical public components is confusing.

**C3 — Behavior-implying names with no behavior.** These render a styled container only; either add runtime support or document them explicitly as styling shells:

- `ContextMenu` — no right-click wiring at all; the example renders a permanently visible menu, which misrepresents the component.
- `Resizable` — no handle, no drag runtime (CSS only).
- `DateRangePicker` — no start ≤ end linkage between the two inputs.
- `DataTable` — no sorting/selection despite the name (vs plain `Table`).
- `InputOTP` — `length` only sets `maxlength`; no segmented boxes.
- `Calendar` — static; no month navigation or day selection.

**C4 — Accessibility defaults worth fixing in the components:**

- `Skeleton`: decorative by default — should emit `aria-hidden="true"` unless labeled; the current example puts `aria-label` on a bare `div` with no role.
- `AlertDialog`: should set `role="alertdialog"` on the `<dialog>`.
- `Autocomplete`: explicit `role="combobox"` without `aria-expanded` is an incomplete ARIA pattern; the native `list`/datalist behavior already provides combobox semantics — drop the role or manage the state.
- `Button`: `loading` sets `aria-busy` but does not disable — a loading button is still clickable.
- `Field`: hint/error text is not linked via `aria-describedby`; consider an optional `hint`/`describedby` wiring.
- `TagGroup` example: remove buttons all read "Remove" — should be "Remove Astro", etc.

**C5 — API consistency.** `glass` (boolean | 'subtle' | 'strong') exists on ~35 components; overlay components additionally have `surface: 'default' | 'glass'`, which overlaps `glass` entirely. Pick one (recommend `glass`) and deprecate `surface`. Also `Avatar` renders an empty `<span></span>` when neither `src` nor `fallback` is set.

**C6 — Boilerplate.** The `class`/`className` merge + passthrough cast is copy-pasted in all 80 files. A tiny helper in `packages/core` would cut ~10 lines per component and keep the pattern uniform.

**C7 — Minor.** `AspectRatio` interpolates `ratio` into a style attribute unvalidated (cosmetic risk only).

---

## Component-by-component

Legend — **Comp**: component implementation. **Ex**: main example vs the "all variants/states" bar. ✅ good · ⚠️ gaps · ❗ needs work.

### Actions & inputs

| Component | Comp | Ex | Findings |
|---|---|---|---|
| Button | ✅ | ⚠️ | Example shows all 6 variants but no sizes (`sm`, `lg`, `icon`), no `loading`, no `disabled`. Component: `loading` should disable (C4). |
| ButtonGroup | ✅ | ⚠️ | Fine. Example could add `role="group"` + `aria-label` and a 3+ button attached row. |
| Toggle | ✅ | ⚠️ | Solid (aria-pressed + runtime). Example missing `disabled`. |
| ToggleGroup | ✅ | ✅ | Roving focus via runtime. |
| Input | ✅ | ⚠️ | Example shows one state; missing `size="sm"`/`"lg"`, `disabled`, invalid state. |
| InputGroup | ✅ | ✅ | Good composed example. |
| Textarea | ❗ | ⚠️ | Whitespace/placeholder bug (C1). Example fine otherwise. |
| Checkbox | ✅ | ⚠️ | Example missing `checked`/`disabled`; note `indeterminate` needs JS. |
| Switch | ✅ | ⚠️ | Example missing `disabled`. |
| RadioGroup | ✅ | ✅ | Fieldset + roving runtime; example wires name/checked correctly. |
| Slider | ✅ | ⚠️ | Example could add `step` and a labeled value readout. |
| Select | ⚠️ | ⚠️ | Identical to NativeSelect (C2). Example misses `placeholder`, `options` prop, `size`, disabled option. |
| NativeSelect | ⚠️ | ⚠️ | Same as Select — example misses same props. |
| Combobox | ⚠️ | ✅ | Runtime-backed; `options` accepts strings only (no value/label pairs, no disabled options). |
| Autocomplete | ⚠️ | ✅ | ARIA role issue (C4); otherwise a clean datalist wrapper. |
| NumberField | ✅ | ✅ | Thin native wrapper, example shows min/max/value. |
| SearchField | ✅ | ✅ | Fine. |
| ColorPicker | ✅ | ✅ | Fine. |
| DatePicker | ✅ | ✅ | Fine (native). |
| TimeField | ✅ | ✅ | Fine (native). |
| DateRangePicker | ❗ | ✅ | Layout shell only — no range linkage (C3). |
| InputOTP | ⚠️ | ✅ | `length` under-delivers (C3); consider segmented rendering or rename docs expectation. |
| Field | ⚠️ | ✅ | Add `aria-describedby` wiring for hint text (C4). |
| Label | ✅ | ✅ | Fine. |

### Overlays & menus

| Component | Comp | Ex | Findings |
|---|---|---|---|
| Dialog | ✅ | ✅ | Trigger/close runtime; best-in-repo example. |
| AlertDialog | ⚠️ | ✅ | Add `role="alertdialog"` (C4). |
| Drawer | ✅ | ✅ | Fine. |
| Sheet | ✅ | ✅ | Fine. |
| Popover | ✅ | ✅ | Anchored-popover runtime; good example. |
| HoverCard | ✅ | ✅ | Fine. |
| DropdownMenu | ⚠️ | ✅ | `<menu>` wrapper + inner `role="menu"` div in example is a doubled structure; document the expected markup or flatten. |
| ContextMenu | ❗ | ❗ | No context-menu behavior; example shows a permanently visible menu (C3). Highest-impact gap. |
| Menubar | ✅ | ✅ | Roving focus runtime. |
| Tooltip | ✅ | ✅ | Runtime targets `.ui-tooltip`; verify it sets `aria-describedby` on the trigger. |
| Toast | ✅ | ⚠️ | Example missing `success` and `warning` variants. |
| Sonner | ✅ | ✅ | `ui:toast` event demo with script — excellent. |

### Layout & structure

| Component | Comp | Ex | Findings |
|---|---|---|---|
| Card | ✅ | ⚠️ | Example shows default only; missing `muted`, `interactive`, and `as` prop. |
| Accordion | ✅ | ✅ | Native details/summary; good example. |
| Collapsible | ✅ | ✅ | Fine. |
| AspectRatio | ⚠️ | ⚠️ | Unvalidated style interpolation (C7); example could show a second ratio. |
| Separator | ✅ | ⚠️ | Example missing `orientation="vertical"`. |
| ScrollArea | ✅ | ✅ | Great example. |
| Resizable | ❗ | ⚠️ | No drag runtime/handle (C3); example implies panes that don't resize. |
| Sidebar | ✅ | ✅ | Fine. |
| Item | ✅ | ✅ | Fine. |
| Empty | ✅ | ✅ | Fine. |
| Direction | ✅ | ✅ | Fine. |
| Typography | ✅ | ✅ | Fine. |
| Table | ✅ | ✅ | Honest wrapper; fine. |
| DataTable | ⚠️ | ✅ | Name promises more than wrapper delivers (C3). |

### Navigation

| Component | Comp | Ex | Findings |
|---|---|---|---|
| Breadcrumb | ⚠️ | ✅ | Consider documenting `<ol><li>` markup as the recommended children. |
| NavigationMenu | ✅ | ✅ | Fine. |
| Pagination | ✅ | ⚠️ | Add `rel="prev"/"next"` and a disabled-state demo. |
| Tabs | ✅ | ✅ | Runtime + fully wired ARIA example. |
| Command | ✅ | ✅ | Runtime filter; good example. |

### Data display & feedback

| Component | Comp | Ex | Findings |
|---|---|---|---|
| Badge | ✅ | ⚠️ | Example missing `warning` variant (5 of 6 shown). |
| Marker | ✅ | ⚠️ | Example missing `default` variant. |
| Alert | ✅ | ⚠️ | Example missing `destructive` and `warning` (2 of 4 shown). |
| Avatar | ⚠️ | ⚠️ | Example never shows `src` image path; component emits empty span with no props (C5). |
| Skeleton | ⚠️ | ⚠️ | Needs `aria-hidden` default (C4); example should show shaped/sized skeletons. |
| Spinner | ✅ | ✅ | Best a11y handling in the repo. |
| Progress | ✅ | ⚠️ | Example could show `max` and a 100% state. |
| Kbd | ✅ | ✅ | Fine. |
| Code | ✅ | ✅ | Richest component; example covers inline + block/copy/label. `theme` variants unshown (minor). |
| Chart | ✅ | ✅ | Static by design; example is exemplary. |
| Calendar | ⚠️ | ✅ | Static shell (C3); fine if documented as such. |
| Tree | ✅ | ⚠️ | Keyboard runtime exists, but example is 2 flat items — show nesting with `role="group"`, `aria-level`. |
| TreeGrid | ✅ | ⚠️ | Example is a single row — add header row and levels. |
| VirtualList | ✅ | ⚠️ | Example has 3 rows, which defeats the point — generate 100+ rows to demo virtualization. |
| TagGroup | ✅ | ⚠️ | Remove buttons need distinguishing labels (C4). |

### Chat & scheduling

| Component | Comp | Ex | Findings |
|---|---|---|---|
| Bubble | ✅ | ✅ | Both `from` values shown. |
| Message | ✅ | ✅ | Fine. |
| MessageScroller | ✅ | ✅ | Great example. |
| Attachment | ✅ | ⚠️ | Example missing the non-link (`article`) form. |
| Agenda | ✅ | ✅ | Fine. |
| Schedule | ✅ | ✅ | Drag runtime demoed. |
| Carousel | ✅ | ✅ | Prev/next runtime demoed. |
| RichTextEditor | ⚠️ | ✅ | Only bold/italic commands in runtime; document the supported command set. |
| ThemeBuilder | ✅ | ✅ | Live hue → token demo; excellent. |

---

## Prioritized fix list

**P1 — correctness & a11y (component code):**
1. Textarea whitespace/placeholder bug (C1).
2. ContextMenu: add right-click runtime or rename/document as a menu surface (C3).
3. Skeleton `aria-hidden` default; AlertDialog `role="alertdialog"`; Autocomplete role cleanup; Button `loading` → disabled (C4).
4. Resolve Select/NativeSelect duplication (C2).

**P2 — example coverage (the "all variants/states" bar):**
Button (sizes, loading, disabled) · Card (muted, interactive, `as`) · Alert (+destructive, +warning) · Toast (+success, +warning) · Badge (+warning) · Marker (+default) · Input (sizes, states) · Select/NativeSelect (placeholder, `options`, sizes) · Separator (vertical) · Avatar (src) · Skeleton (shapes) · Tree/TreeGrid (nesting, headers) · VirtualList (100+ rows) · Attachment (non-link) · Checkbox/Switch/Toggle (disabled) · Pagination (rel, disabled).

**P3 — consistency & maintenance:**
Unify `glass`/`surface` API (C5) · shared class-merge helper in core (C6) · runtime for Resizable and DateRangePicker or explicit "styling shell" docs (C3) · Field `aria-describedby` · TagGroup remove-button labels · AspectRatio ratio validation.

Overall: the system is consistent and honest at its core — thin, semantic, token-driven wrappers with a genuinely good runtime for the hard parts (dialogs, combobox, tabs, roving focus, virtual list, theme builder). The gaps are concentrated in a handful of shell components whose names promise behavior, a few a11y defaults, and main examples that show one state where the component supports several.
