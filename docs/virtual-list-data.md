# VirtualList data rendering

Use the default mounted mode for modest collections whose uncontrolled DOM state must survive
scrolling. Use data mode for large fixed-height collections: it mounts only the visible rows,
overscan, and the focused row with its immediate keyboard neighbors. A distant focused row does not
cause all intervening rows to mount.

## React

```tsx
import { Button, VirtualList } from '@santi020k/lumen-react'

const records = Array.from({ length: 10000 }, (_, id) => ({ id, label: `Record ${id + 1}` }))

export function Records() {
  return (
    <VirtualList
      aria-label="Records"
      items={records}
      getKey={record => record.id}
      renderItem={record => <Button variant="ghost">{record.label}</Button>}
      itemSize={44}
      overscan={4}
      style={{ height: '20rem' }}
    />
  )
}
```

`items`, `getKey`, and `renderItem` form the data-mode contract; do not supply `children` with them.
Use immutable items and stable unique string or numeric keys. The default role is `list`; mounted
rows expose their position and the full collection size. Render only fixed-height content that fits
`itemSize`; use pagination or a different composition for variable-height content.

## Astro and Elements

Declare an empty data-mode root before the automatic runtime initializes:

```astro
---
import { VirtualList } from '@santi020k/lumen-astro'
---
<VirtualList id="records" mode="data" role="list" aria-label="Records" />
```

```html
<lumen-virtual-list id="records" mode="data" role="list" aria-label="Records"></lumen-virtual-list>
```

Install `@santi020k/lumen-core` directly when using its client controller. Load the matching adapter
stylesheet and runtime as usual, then attach the application-owned data renderer:

```ts
import { createLumenVirtualCollectionController } from '@santi020k/lumen-core'

const root = document.getElementById('records')

if (root) {
  const controller = createLumenVirtualCollectionController(root, {
    items: Array.from({ length: 10000 }, (_, id) => ({ id })),
    getKey: record => record.id,
    itemSize: 44,
    overscan: 4,
    renderItem: (record, _index, previous) => {
      const row = previous ?? document.createElement('div')
      row.textContent = `Record ${record.id + 1}`
      return row
    }
  })

  // Replace application data; keys retain mounted row wrappers.
  controller.update([{ id: 0 }, { id: 1 }])
  // Call controller.destroy() when this application-owned view is removed.
}
```

The controller requires an empty root. `renderItem` may reuse its previous content element during a
data update. Use public Lumen components for interactive row content. Keep form drafts, selection,
and editing state in application data: offscreen rows unmount, so local uncontrolled state is not
retained. Removed records are no longer focus targets. Mode selection is an initialization choice;
destroy the application controller before replacing the surface.

## Verification

Check the first and last windows, empty and shrunk collections, duplicate keys, container resizing,
RTL layout, forward and reverse Tab navigation, and focus during a distant scroll. Compare mounted
row counts against viewport size plus overscan and at most three focused neighbors. Provide an
application fallback when data or JavaScript is unavailable. Source or SSR rendering alone does not
prove browser scroll and keyboard behavior.
