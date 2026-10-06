# Lumen motion studio

A private workspace for reusable Lumen product animations. The first pilot, **One interface,
three themes**, shows the same sample workspace in Lumen Light, Lumen Dark, and Studio. Studio is
an appearance preset; light/dark are color schemes. It uses public Astro components, existing logo
artwork, and the documentation site's locally shipped Montserrat font.

## Run locally

Use the root workspace's Node and pnpm versions. From the repository root:

```bash
pnpm install --frozen-lockfile
pnpm --filter @santi020k/lumen-motion dev
```

Open `http://127.0.0.1:4341/`. Choose Vertical, Square, or Landscape, select an appearance, or play/pause
the 18-second composition. Playback starts only on request. Reduced-motion preferences disable
playback and retain the still-frame appearance controls. Neither preference nor controls mutate
the documentation site's theme or persistent application data.

## Build, verify, and render

```bash
pnpm --filter @santi020k/lumen-motion build
pnpm --filter @santi020k/lumen-motion typecheck
pnpm --filter @santi020k/lumen-motion lint
pnpm --filter @santi020k/lumen-motion test
pnpm --filter @santi020k/lumen-motion check:composition
pnpm --filter @santi020k/lumen-motion render:portrait
pnpm --filter @santi020k/lumen-motion render:square
pnpm --filter @santi020k/lumen-motion render:landscape
```

Tests require the repository's Playwright Chromium installation. HyperFrames needs a compatible
local Chrome and FFmpeg; its `doctor` command describes missing dependencies. The render scripts
export at 30 fps to:

- `apps/motion/renders/one-interface-three-themes-vertical.mp4` — 1080 × 1920.
- `apps/motion/renders/one-interface-three-themes-square.mp4` — 1080 × 1080.
- `apps/motion/renders/one-interface-three-themes.mp4` — 1920 × 1080.

All three exports are silent; the on-screen text carries the message. Portrait content leaves room
above and below for social overlays. Platform overlays differ, so review the final upload preview
before publication. The source compositions live at `dist/portrait/index.html` and
`dist/square/index.html` and `dist/landscape/index.html`; run HyperFrames preview on either built directory for its timeline
editor. Keep authored edits in `src/` because the next build replaces `dist/`.

HyperFrames local rendering uses no HeyGen credits or subscription. Optional hosted rendering,
generated assets, audio services, and the coding agent can have their own costs. This workflow
does not call those services. CLI scripts disable HyperFrames telemetry. The pinned CLI is the
newest release that satisfied this repository's dependency-age policy when added; review upstream
release notes before upgrading it.

## Source and reuse

- `src/components/Workspace.astro` owns the sample interface and clearly labels its data.
- `src/pages/[format].astro` owns the shared message, three appearances, and canvas dimensions.
- `src/scripts/timeline.ts` registers the paused GSAP timeline with precise seeking for export and
  browser playback. Preview messages validate origin, sender, shape, and finite seek values.
- `src/styles/composition.css` owns composition layout; colors come from Lumen semantic tokens.
- `scripts/prepare-assets.mjs` copies existing artwork/font assets and the installed GSAP/CustomEase runtime.
- `scripts/prepare-compositions.mjs` generates a stylesheet from selectors matching the rendered
  composition. It retains component/token rules and removes browser-clock animation/transition
  declarations so the GSAP timeline owns every export frame. It does not change the library CSS.

Generated assets, static output, screenshots, and MP4s are ignored. No published Lumen package
depends on this workspace. Build output can be served by an ordinary static web server; the
preview and composition assets are self-contained and make no remote asset requests.

## Motion and responsive composition

The opening builds the workspace with short staggered entrances and fills its progress bars.
Three six-second chapters alternate wide and compact layouts while changing appearances; matching
frame widths keep the theme transitions continuous. CSS container queries stack the project cards at the compact
width; this is live reflow, not a cropped desktop recording. CustomEase uses Lumen's public
emphasized easing token. The paused GSAP timeline owns all timing so exports can seek backwards
without relying on autoplay or browser-clock CSS transitions.

Portrait, square, and landscape share the message and components, with format-specific typography
and spacing. Square simplifies secondary descriptions to retain readable feed text. The browser
preview scales the canvas to its container and keeps the selected appearance when formats change.
Static appearance buttons seek to a fully assembled frame; reduced motion retains those controls.

Future pilots can reuse this structure for component spotlights and release highlights. Use
verified features and the [marketing claim ledger](../../docs/marketing/STRATEGY.md); visual
direction remains in [the brand guide](../../docs/brand-guidelines.md).

## Draft social copy

**Caption:** One interface. Three appearances. The same public Lumen UI components in Light,
Dark, and Studio, adapting from a wide workspace to a compact layout. Explore the theme playground: https://lumen.santi020k.com/docs/theme-playground

**Visual description:** A sample project workspace stays in the same layout while its colors and
surface styling change from Lumen Light to Lumen Dark to Studio. The interface assembles in sequence,
then alternates wide and compact layouts, stacking project cards when the workspace narrows. Project counts are illustrative
sample data. The final line points to lumen.santi020k.com.

This is a draft asset and caption. Publication remains subject to the
[publishing queue](../../docs/marketing/PUBLISHING_QUEUE.md); generating a file grants no posting
or deployment authorization.
