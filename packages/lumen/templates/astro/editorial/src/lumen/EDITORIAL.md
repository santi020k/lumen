# Editorial recipes for Astro

These nine independent components and one example page are copied into your project by
`lumen add editorial --target astro`. Edit the copies to fit your content. React and Elements
implementations are not included in this family.

Import `@santi020k/lumen-astro/styles.css` once in your root layout. The static compositions need
only CSS. The video dialog ships with its own small Astro script. The example's `ThemeToggle`
needs the standard single `UIPrimitives` mount in the root layout. Tailwind and the private
templates package are not required.

```astro
---
import EditorialCard from './editorial-card.astro'
---

<EditorialCard
  category="Research"
  description="What we learned from testing the first version with readers."
  headingId="research-card"
  href="/research/"
  linkLabel="Read the findings"
  title="A clearer starting point"
/>
```

## Component contracts

| File | Inputs | Slots |
| --- | --- | --- |
| `editorial-cover-spread.astro` | Required `headingId`, `title`; optional `eyebrow`, `description`, `headingLevel` (1–4, default 1), `layout` (`wide` or `contained`). No media renders a text-only opening. | `media` and `metadata` |
| `editorial-introduction.astro` | Required `label`, `description`; optional `category`. | None |
| `editorial-card.astro` | Required `headingId`, `title`, `description`, `href`, `linkLabel`; optional `category`, `icon`, `headingLevel` (2–4, default 3), `newTab`. | None |
| `editorial-replacement-notice.astro` | Required `title`, `currentLabel`, `destinationLabel`, `replacementLabel`, `href`, `linkLabel`; optional `replacementDetail`, `newTab`. | Default explanatory content |
| `editorial-contact-panel.astro` | Required `headingId`, `label`, `title`; optional `headingLevel` (2–4, default 2), `icon` (default `mail`). | Default body and optional `note` |
| `editorial-testimonial-spotlight.astro` | `headingId`, `title`, and ordered `items` with `quote`, `author`, and optional `detail` or `portrait`. The first quote is featured. | None |
| `editorial-linked-timeline.astro` | `headingId`, `title`, and ordered `items` with `title`, `dateLabel`, and optional `dateTime`, `href`, `description`, `logo`, or `newTab`. | None |
| `editorial-footer.astro` | `title`, optional `description`, and `groups` with a unique `title` and `links` (`label`, `href`, and optional `newTab`). Place outside the main landmark for a site footer. | `action`, `credits` |
| `editorial-video-dialog.astro` | Unique `id`, `title`, `src`, optional `poster`, and localized `playLabel`, `closeLabel`, `fileLabel`, `errorLabel`, and `transcriptLabel`. | `artwork`, `transcript`, `tracks` |

Supply caption tracks for spoken or meaningful audio. The video loads on opening, pauses on
closing, and retries load failures on reopen. The direct file link and transcript remain
available without JavaScript. Artwork is separate from the play control and may use Astro
`Picture`; applications choose the appropriate media URL and formats.

Give each heading a unique ID when composing multiple instances. Choose heading levels to fit
the surrounding document. All visible copy comes from your props or slots, so it can be localized.
`newTab` defaults to false; enabling it uses Lumen's `noopener noreferrer` handling.

Put your own Astro `Image` or `Picture` in the cover's `media` slot. Supply meaningful alternative
text for informative images and an empty alternative for decorative ones. The consumer owns
image sizing, formats, loading priority, routes, link validation, data selection, and content claims.
The sample art is decorative CSS and Lumen icons; no website photographs or client assets ship.

Styles are scoped and use Lumen's inherited semantic colors, including nested themes. Container
queries adapt the components to their available space. No global website stylesheet, collection,
fixed component ID, or Tailwind utility is required. Customize the copied styles while keeping focus outlines
and readable wrapping intact.

The example `editorial.astro` contains one page landmark and illustrative content. Use it once
per page, or import individual compositions into your own layout. Replace example links and copy
before using it as a product page.

These generalized compositions are part of Lumen under its MIT license. Their design originated
in versions 4.1 and 5 of Santiago Molina's website; personal writing, photographs, and client assets remain outside
the recipe. Keep the copyright and license notice supplied with Lumen when redistributing copies.
