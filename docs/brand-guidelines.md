# Brand Guidelines

Lumen UI is a calm, production-ready primitive system. It should feel precise, useful, and quietly
polished rather than flashy.

## Positioning

- An open-source UI library built for AI-assisted development of accessible web and native interfaces.
- Reusable components, precise API guidance, and focused context for coding agents.
- Describe token efficiency as a design goal; publish savings only with a reproducible comparison
  and its model, tasks, quality checks, and limitations. Follow [the claim ledger](marketing/STRATEGY.md).
- Multi-framework primitives with Astro as the reference implementation.
- Standalone CSS that renders without consumer Tailwind configuration.
- Practical defaults for real product interfaces, docs, tools, and dashboards.
- Small primitives that compose well instead of heavy opinionated page templates.

## Voice

Write like a careful engineer explaining a useful tool.

- Clear over clever.
- Specific over broad.
- Confident but not loud.
- Helpful without explaining too much.
- Short examples before long theory.

Avoid hype-heavy phrases, vague claims, and repeated descriptions of the same package architecture.
Link to the root README or package README when the reader needs setup context.

## Visual System

The shared token vocabulary is the brand contract:

| Role | Tokens |
| --- | --- |
| Base surfaces | `canvas`, `surface`, `surface-muted`, `surface-strong` |
| Text | `ink`, `ink-soft`, `ink-muted` |
| Borders | `line` |
| Action color | `brand`, `brand-solid`, `brand-soft` |
| On-color foregrounds | `on-brand`, `on-danger` |
| Secondary accent | `accent` |
| Status | `success`, `warning`, `danger` |

Default Lumen uses a warm paper canvas with near-white cards in light mode and charcoal surfaces
with warm white text in dark mode. Deep cyan fills identify primary actions; links and selection
use a brighter cyan on dark surfaces. Use the green accent sparingly and let a fine border carry
most of the separation between surfaces. The same semantic colors reach every adapter. The docs app may
use the `santi020k-*` themes for a more personal violet expression.

## Logo

Use the Lumen mark as a lowercase `lu` monogram with one warm point of light. Pair the contained
mark directly with the `lumen ui` wordmark when the brand needs to be explicit; do not add a divider
or repeat the monogram as text. In tight spaces, the mark can stand alone with an accessible label.

Do not redraw the mark from memory or substitute live text. Use the path-based implementation in
`apps/docs/src/components/LumenLogo.astro` or the exported `logo.svg`, `icon.svg`, and favicon assets.

Pair the mark with the restrained serif wordmark and keep product UI copy in the app sans face. The
smaller `ui` suffix is a quiet descriptor, not a separate accent. The contrast should feel editorial
and intentional, not decorative.

## Lu mascot

Lu is Lumen’s calm, curious lantern companion: a rounded ivory shell, cyan feet and trim,
a softly lit face, and one warm amber flame. Preserve the approved 2.5D artwork, proportions,
palette, and silhouette. Lu complements the logo and never replaces it.

Use the optional `@santi020k/lumen/lu` player and the artwork exported under `lu/` so projects
share one source. Idle is a gentle breath and blink; thinking is a small tilt with a cheek touch;
celebration is one happy hop followed by idle. Keep Lu supplemental to clear product status text,
provide pause controls, and honor reduced motion. See the [integration guide](https://lumen.santi020k.com/docs/lu).

## Interface Principles

- Prioritize legibility, focus states, keyboard access, and predictable composition.
- Keep primitives visually restrained so consumers can adapt them.
- Use radius and shadows sparingly. Components should feel crisp before they feel decorative.
- Do not hide core behavior behind visual flourish.
- Prefer real component examples over abstract marketing sections.

## Motion

Motion should explain a state change, establish hierarchy, or make an entrance feel intentional.
It should never compete with the content.

- Use `--ui-duration-fast` for compact feedback, `--ui-duration` for ordinary state changes, and
  `--ui-duration-slow` for entrances and overlays.
- Use `--ui-ease` for interaction and `--ui-ease-emphasized` for entrances.
- Prefer `ScrollReveal` for one content block and `RevealGroup` for a short staggered sequence.
- Keep stagger intervals short and ordered. Do not stagger long reading surfaces.
- Use `AnimatedNumber` only when the change in value is meaningful.
- Do not use marquees, endlessly moving text, or decorative motion on every card.
- Every animation must preserve readable server-rendered content and honor
  `prefers-reduced-motion`.

## Naming

- Product name: `Lumen UI`.
- Package scope: `@santi020k/`.
- Package names: `@santi020k/lumen`, `@santi020k/lumen-core`, `@santi020k/lumen-astro`,
  `@santi020k/lumen-react`, and `@santi020k/lumen-elements`.
