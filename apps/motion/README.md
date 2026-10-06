# Lumen motion studio

A private workspace for reusable Lumen product animations. The first pilot, **One interface,
four appearances**, shows the same sample workspace in Lumen Light, Lumen Dark, Glass, and Studio. Studio is
an appearance preset; light/dark are color schemes. It uses public Astro components, existing logo
artwork, and the documentation site's locally shipped Montserrat font.

## Run locally

Use the root workspace's Node and pnpm versions. From the repository root:

```bash
pnpm install --frozen-lockfile
pnpm --filter @santi020k/lumen-motion dev
```

Open `http://127.0.0.1:4341/`. Choose Vertical, Square, or Landscape, select an appearance, or play/pause
the 20-second composition. Playback starts only on request. Reduced-motion preferences disable
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

The opening starts with an empty canvas and assembles the heading, laptop frame, cards, and
progress bars in two seconds. Light, Dark, Glass, and Studio follow at 0, 5, 8, and 11 seconds.
The same laptop layout remains steady during appearance changes. Glass uses the public Card
material over a semantic-color gradient; Studio uses its monochrome actions and restrained radii.

At 14 seconds, the laptop yields to an iPhone-style mobile layout. Both devices use the public
Astro `DeviceFrame` already integrated into local `release/v4.0.0`; no published version is needed.
The frame also supports real viewport scaling for iframes. This composition uses slotted HTML
so the single GSAP timeline controls component entrances and exports deterministically.
`Workspace.astro` is shared by both devices; the phone content remains at 390 × 844 CSS pixels
with stacked cards and a full-width action. Hardware silhouettes are illustrative.

Devices fit and center within the space between headline and footer. At 18 seconds, a short lift
and scale reveals the existing path-based Lumen logo, tagline, and website for the closing card.
CustomEase uses the public emphasized easing token. The full composition lasts 20 seconds.

Portrait, square, and landscape share the message and components, with format-specific typography
and spacing. Square simplifies secondary descriptions in the desktop view to retain readable feed
text. The browser preview scales the canvas to its container and keeps the selected appearance
when formats change.
Static appearance buttons seek to a fully assembled frame; reduced motion retains those controls.

Future pilots can reuse this structure for component spotlights and release highlights. Use
verified features and the [marketing claim ledger](../../docs/marketing/STRATEGY.md); visual
direction remains in [the brand guide](../../docs/brand-guidelines.md).

## Draft social copy

**Caption:** One interface. Three appearances. The same public Lumen UI components in Light,
Dark, Glass, and Studio, adapting from laptop to an iPhone-style mobile screen. Explore the theme playground: https://lumen.santi020k.com/docs/theme-playground

**Visual description:** A sample project workspace stays in the same layout while its colors and
surface styling change from Lumen Light to Lumen Dark to Glass to Studio. The interface assembles in sequence,
then alternates a laptop workspace with an iPhone-style screen containing a real mobile layout. Project counts are illustrative
sample data. The final line points to lumen.santi020k.com.

This is a draft asset and caption. Publication remains subject to the
[publishing queue](../../docs/marketing/PUBLISHING_QUEUE.md); generating a file grants no posting
or deployment authorization.
