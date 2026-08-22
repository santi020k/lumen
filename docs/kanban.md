# Kanban composition and movement

Lumen provides layout and interaction contracts for status-based boards without owning product data,
workflow names, persistence, authorization, or API updates.

## Scope

- `KanbanBoard` provides horizontal overflow, responsive column sizing, scroll snapping, focus treatment,
  and the `ui:kanban-move-request` behavior boundary.
- `KanbanColumn` provides a semantic column surface identified by `value`.
- Use the existing `Card` for items, `Badge` for visible status text, `Empty variant="compact"` for empty
  columns, and `Skeleton` to preserve column geometry while loading.
- The first contract moves items between columns. Applications that support ordering may add `beforeId`
  when requesting a move; Lumen does not calculate or persist ranks.
- Large boards remain server-backed. Paginate or incrementally load each column rather than mounting
  hundreds of cards or assuming virtualization can preserve drag, focus, and screen-reader context.

## Controlled movement

Mark each item with `data-ui-kanban-item="stable-id"` and place a dedicated button inside it with
`data-ui-kanban-handle`. Do not make the entire card draggable. Astro's `UIPrimitives`, registered Web
Components, and React's `useKanban` support mouse drag, touch pointer movement, and Left/Right Arrow
movement from the focused handle.

Lumen emits a cancellable `ui:kanban-move-request` event:

```ts
interface LumenKanbanMoveDetail {
  beforeId?: string
  fromColumn: string
  input: 'keyboard' | 'pointer'
  itemId: string
  toColumn: string
}
```

The event never moves the item. The application should prevent the event when the move is invalid,
set `aria-busy="true"` and a visible pending state while saving, update its own data after success, and
restore the previous state with an error announcement after failure. Status names, moderation rules,
visibility, optimistic data, and rollback stay in the host application.

## Layout customization

Customize the layout without replacing its behavior:

```css
.product-board {
  --ui-kanban-column-width: clamp(17rem, 32vw, 24rem);
  --ui-kanban-column-min-height: 24rem;
  --ui-kanban-gap: 1rem;
}
```

## Loading and empty states

Render every expected column during loading and put card-shaped `Skeleton` blocks inside each one.
This preserves the workspace geometry and avoids replacing the board with a page-level spinner. Use a
compact `Empty` inside a column after loading completes; use the default `Empty` only when the entire
board has no meaningful columns or next action.

## Validation matrix

Before shipping a board, verify:

| Surface | Required evidence |
| --- | --- |
| Keyboard | Every move is possible from the dedicated handle; edge columns do not wrap unexpectedly; focus remains stable. |
| Screen reader | Board, columns, handles, pending state, successful move, and failed move have understandable names or announcements. |
| Mouse and touch | Drag starts only from the handle, scrolling remains possible outside it, and invalid targets do not accept a move. |
| Direction | Left/Right movement follows both LTR and RTL visual order. |
| Motion | Reduced motion removes decorative transitions without hiding state changes. |
| Reflow | Columns and controls remain usable at 200% and 400% zoom without page-level horizontal overflow. |
| Localization | Long translated headings, counts, empty copy, and status text wrap without clipping. |
| Failure | Slow, rejected, repeated, and out-of-order requests expose pending state and roll back deterministically. |
| Scale | Pagination or incremental loading bounds DOM size while counts and empty states remain accurate. |
