# Cross-platform graphics

Lumen provides three complementary graphics primitives:

- `Graphic` frames application-owned artwork.
- `Backdrop` places an ambient pattern behind meaningful content.
- `Illustration` supplies small built-in semantic scenes for common product states.

The canonical artwork in `graphics/lumen.graphics.json` generates the web renderer and native
React Native, SwiftUI, and Compose geometry. Run `pnpm run generate:platform-graphics` after
changing it; `pnpm run check:platform-graphics` rejects stale or hand-edited outputs.

Use `Graphic` to frame application-owned logos, symbols, and small illustrations with the same
token-aware presentation on web and native platforms. It standardizes the recurring glow, grid,
and concentric orbit treatments used across Lumen consumer projects without bundling
product-specific artwork.

The presets are decorative by default. Add `label` only when the complete composition conveys
information that is not already available as nearby text. The label exposes the composition as one
image and prevents its internal artwork from becoming noisy accessibility output.

## Shared contract

| Option | Values | Default |
| --- | --- | --- |
| Variant | `glow`, `grid`, `orbit` | `orbit` |
| Tone | `brand`, `accent`, `neutral` | `brand` |
| Size | `sm` (160), `md` (240), `lg` (320) | `md` |
| Label | Optional accessible image name | Decorative |

The child content remains application-owned, so each platform can use its native image, vector,
SVG, or view system. Avoid placing controls inside `Graphic`; it is one visual composition rather
than an interaction container.

## Web

Astro and React export `Graphic`; Elements registers `lumen-graphic`.

```astro
<Graphic size="lg" tone="accent" variant="orbit">
  <img alt="" src="/brand-mark.svg" width="96" height="96" />
</Graphic>
```

```tsx
<Graphic size="lg" tone="accent" variant="grid">
  <BrandMark aria-hidden="true" />
</Graphic>
```

```html
<lumen-graphic size="lg" tone="accent" variant="glow">
  <img alt="" src="/brand-mark.svg" width="96" height="96" />
</lumen-graphic>
```

## Native

React Native, SwiftUI, and Compose expose the matching `LumenGraphic` name and presets while
rendering through their native view and drawing APIs.

```tsx
<LumenGraphic size="lg" tone="accent" variant="orbit">
  <BrandMark />
</LumenGraphic>
```

```swift
LumenGraphic(size: .lg, tone: .accent, variant: .orbit) {
    BrandMark()
}
```

```kotlin
LumenGraphic(
    size = LumenGraphicSize.Lg,
    tone = LumenGraphicTone.Accent,
    variant = LumenGraphicVariant.Orbit
) {
    BrandMark()
}
```

## Ambient backdrops

`Backdrop` keeps its aurora, dots, grid, or rays layer decorative while preserving the semantics
and opacity of its child content. Use `subtle`, `medium`, or `strong` intensity and a `brand`,
`accent`, or `neutral` tone. It is intended for hero panels, empty-state regions, and highlighted
surfaces—not as a replacement for readable surface and text tokens.

```astro
<Backdrop intensity="medium" tone="brand" variant="aurora">
  <Card variant="glass">Project overview</Card>
</Backdrop>
```

```tsx
<LumenBackdrop intensity="medium" tone="brand" variant="dots">
  <ProjectOverview />
</LumenBackdrop>
```

```swift
LumenBackdrop(intensity: .medium, tone: .brand, variant: .grid) {
    ProjectOverview()
}
```

```kotlin
LumenBackdrop(
    intensity = LumenBackdropIntensity.Medium,
    tone = LumenBackdropTone.Brand,
    variant = LumenBackdropVariant.Rays
) {
    ProjectOverview()
}
```

## Semantic illustrations

`Illustration` includes `empty`, `success`, `error`, and `offline` variants at shared 96, 128, and
176 unit sizes. Its default `auto` tone maps each state to the appropriate semantic token. Leave
the label absent when nearby text already explains the state; otherwise add one accessible image
name.

```astro
<Illustration label="No projects yet" size="md" variant="empty" />
```

```tsx
<LumenIllustration label="Saved successfully" size="md" variant="success" />
```

```swift
LumenIllustration(variant: .offline, size: .md, label: "Connection unavailable")
```

```kotlin
LumenIllustration(
    variant = LumenIllustrationVariant.Error,
    size = LumenIllustrationSize.Md,
    label = "Something went wrong"
)
```

## Images and media delivery

Lumen image components share contain or cover fitting, semantic corner radii, optional aspect
ratio, and decorative-or-labeled accessibility behavior. Delivery remains platform-owned: Astro
and React keep their framework optimizer, React Native uses its native image source, SwiftUI
accepts application-provided content, and Compose accepts a `Painter`.

```tsx
<LumenImage
  aspectRatio={16 / 9}
  fit="cover"
  label="Mountain valley at sunrise"
  source={{ uri: imageUrl }}
/>
```

```swift
LumenImage(aspectRatio: 16 / 9, fit: .cover, label: "Mountain valley at sunrise") {
    Image("mountain-valley").resizable()
}
```

```kotlin
LumenImage(
    painter = painterResource(R.drawable.mountain_valley),
    label = "Mountain valley at sunrise",
    aspectRatio = 16f / 9f,
    fit = LumenImageFit.Cover
)
```
