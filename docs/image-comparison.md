# Image comparison

`ImageComparison` reveals two versions of the same media without changing their framing. It is
available in Astro, React, and Web Components. The native range control works with keyboard,
touch, and assistive technology; the reveal follows the document's writing direction.

Use matching crops and dimensions. Lumen clips a full-size overlay instead of resizing it as the
control moves. Supply meaningful image alternative text, a visible control label, and localized
before/after labels. Image loading, optimization, editing, consent, and source ownership remain
application responsibilities.

## Astro

```astro
---
import { Image, ImageComparison } from '@santi020k/lumen-astro'
---

<ImageComparison
  label="Compare photo edits"
  beforeLabel="Original"
  afterLabel="Edited"
  ratio={4 / 3}
  value={50}
>
  <Image slot="before" src="/original.jpg" alt="Mountain lake before editing" width={1200} height={900} />
  <Image slot="after" src="/edited.jpg" alt="Mountain lake with warmer light" width={1200} height={900} />
  <p>Both images show the same crop.</p>
</ImageComparison>
```

Mount `UIPrimitives` once in the application layout. Before enhancement, the two labelled halves
remain visible and the range is disabled. Native `input`/`change` events remain available; the
root emits `ui:image-comparison-change` with `{ value: number }` while the user adjusts the range.
The `value` prop sets the initial position. To update it from application JavaScript, set the
native range value and dispatch its `input` event.

## React

```tsx
import { useState } from 'react'
import { Image, ImageComparison } from '@santi020k/lumen-react'

export function CompareEdit() {
  const [value, setValue] = useState(50)

  return (
    <ImageComparison
      label="Compare photo edits"
      beforeLabel="Original"
      afterLabel="Edited"
      ratio={4 / 3}
      value={value}
      onValueChange={setValue}
      before={<Image src="/original.jpg" alt="Mountain lake before editing" />}
      after={<Image src="/edited.jpg" alt="Mountain lake with warmer light" />}
    />
  )
}
```

Use `defaultValue` instead of `value` for component-owned state. A controlled component only changes
when its owner supplies a new value. Render media through `before` and `after`; optional children
appear in the caption below the control. Do not mount the Astro runtime in React.

## Web Components

```html
<script type="module">
  import { defineLumenImageComparison } from '@santi020k/lumen-elements/components/image-comparison'
  defineLumenImageComparison()
</script>

<lumen-image-comparison
  label="Comparar los ajustes"
  before-label="Original"
  after-label="Editada"
  locale="es"
  ratio="1.3333333333"
  value="50"
>
  <img slot="before" src="/original.jpg" alt="Lago de montaña antes de editar" width="1200" height="900" />
  <img slot="after" src="/edited.jpg" alt="El mismo lago con luz más cálida" width="1200" height="900" />
</lumen-image-comparison>
```

The standard `defineLumenElements()` registration also includes this component. Provide one direct
child with `slot="before"` and one with `slot="after"` before connecting the element. Their original
DOM nodes are preserved during enhancement. The numeric `value` property and the `value` attribute
stay synchronized; `ui:image-comparison-change` bubbles with `{ value: number }` for user changes.
Set or remove the boolean `disabled` attribute to control interaction. Without registration, the
original media children remain readable.

## Shared contract

- `value`: integer percentage of the **after** image visible; 0 shows the complete original and
  100 shows the complete result. Values clamp to 0–100; invalid values fall back to 50.
- `ratio`: positive finite number, default `16 / 9`. Both media layers always share this frame.
- `fit`: `cover` by default; use `contain` to show complete images with empty bands.
- `label`: visible label for the range. `beforeLabel` and `afterLabel` default to `Before` and
  `After`; Elements uses `before-label` and `after-label`.
- `locale`: formats the percentage announced with the after label. Localize the text labels as well.
- `disabled`: disables interaction while preserving the comparison and its alternative text.

Keep interactive descendants outside the media slots. ImageComparison is a visual comparison, not
an image editor, carousel, upload control, or chart. It adds no animation, network request, image
transformation, or photo upload. The documentation's matching landscape SVGs are original
illustrations with two color treatments; they do not imply an actual photo-editing result.

Form resets restore the initial reveal in Astro and Elements and `defaultValue` in uncontrolled
React. Controlled React retains the owner value. Canceled resets preserve the current view; reset
does not emit a user-change event.
