# Image performance across frameworks

Lumen owns image presentation, not delivery infrastructure. Keep the optimizer provided by Astro,
Next.js, another framework, your CMS, or your image CDN, and apply Lumen at the final rendered
`img`. This avoids duplicate transformations and preserves the framework's build-time analysis,
responsive sources, cache behavior, and preload decisions.

Across web and native adapters, the shared presentation contract includes `contain` or `cover`
fitting and semantic `none`, `sm`, `md`, `lg`, or `full` radii. Native `LumenImage` implementations
also accept an optional positive aspect ratio and an accessible label; omit the label only for
decorative imagery.

## Shared rules

- Always provide useful `alt` text, or `alt=""` for a decorative image.
- Provide intrinsic width and height, or use a framework mode that derives them, to prevent layout
  shift.
- Keep images lazy unless they are visible immediately. Only the single likely LCP image should
  normally receive eager loading, high fetch priority, or framework preloading.
- Match `sizes` to the image's actual responsive layout. An inaccurate `sizes` value can make the
  browser download a needlessly large candidate.
- Prefer imported/static image metadata when the framework supports it. Configure allowed remote
  origins and cache behavior in the host application, not in Lumen.
- Use `invertOnDark` or `ui-image--invert-dark` only for monochrome artwork authored for light
  backgrounds. Do not invert photos or colorful illustrations.

## Astro

`@santi020k/lumen-astro` delegates its `Image` component to `astro:assets`. Astro-specific props
such as `layout`, `quality`, `format`, `widths`, `sizes`, `inferSize`, and `priority` pass through.
Prefer a static import for local images so Astro can derive intrinsic dimensions and process the
asset at build time. `layout="full-width"` and `layout="constrained"` generate responsive
`srcset`, `sizes`, and layout styles; use `layout="fixed"` for images that should not grow.

```astro
---
import { Image } from '@santi020k/lumen-astro'
import hero from '../assets/hero.jpg'
---

<Image alt="Mountain valley at sunrise" layout="full-width" priority quality={80} src={hero} />
```

Use `priority` only for the likely LCP image. Astro then applies eager loading, high fetch priority,
and synchronous decoding. Public-directory and remote string sources need dimensions; use
`inferSize` only for an authorized remote source whose dimensions are not already known.

## Next.js and React optimizers

Pass an optimizer component through the React adapter's `as` prop. Its framework-specific props
remain available and Lumen adds the `ui-image` class to its output.

```tsx
import NextImage from 'next/image'
import { Image as LumenImage } from '@santi020k/lumen-react'
import hero from './hero.jpg'

<LumenImage
  alt="Mountain valley at sunrise"
  as={NextImage}
  placeholder="blur"
  preload
  sizes="(max-width: 768px) 100vw, 50vw"
  src={hero}
  style={{ height: 'auto', width: '100%' }}
/>
```

With an optimizer supplied through `as`, Lumen does not inject its native lazy-loading default.
Next.js keeps control of resizing, format negotiation, caching, placeholders, and preloading. Add
accurate `sizes` for responsive or `fill` images. String and remote sources need `width` and
`height` unless `fill` is used; remote URLs also need a narrow `images.remotePatterns` entry.

In Next.js 16+, use `preload` instead of the deprecated `priority` prop for the one clear LCP image.
Do not combine `preload` with `loading` or `fetchPriority`. Leave below-the-fold images on the
Next.js defaults. This `as` pattern also works with compatible React image components from a CMS or
CDN.

## Other frameworks and generated markup

Let the framework produce its optimized `picture` or `img`, then apply `class="ui-image"` to the
final image element. If the framework does not forward classes, use its documented styling hook or
wrap its generated props around a native image. Preserve generated `srcset`, `sizes`, dimensions,
decoding, and loading attributes.

```html
<picture>
  <source srcset="/hero.avif" type="image/avif">
  <source srcset="/hero.webp" type="image/webp">
  <img
    alt="Mountain valley at sunrise"
    class="ui-image"
    decoding="async"
    height="800"
    loading="lazy"
    sizes="(max-width: 768px) 100vw, 50vw"
    src="/hero.jpg"
    width="1200"
  >
</picture>
```
