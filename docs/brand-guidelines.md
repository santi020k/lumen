# Brand Guidelines

Lumen UI is a calm, production-ready primitive system. It should feel precise, useful, and quietly
polished rather than flashy.

## Positioning

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
| Secondary accent | `accent` |
| Status | `success`, `warning`, `danger` |

Default Lumen themes lean crisp and product-focused: light surfaces, dark readable text, blue brand
actions, teal accents, and warm status colors. The docs app may use the `santi020k-*` themes for a
more personal violet expression.

## Logo

Use the Lumen mark as a compact glass-panel symbol paired with `Lumen UI` when the brand needs to be
explicit. In tight spaces, the mark can stand alone with an accessible label.

Do not redraw the mark from memory. Use the existing implementation in
`apps/docs/src/components/LumenLogo.astro` or exported assets when they exist.

## Interface Principles

- Prioritize legibility, focus states, keyboard access, and predictable composition.
- Keep primitives visually restrained so consumers can adapt them.
- Use radius and shadows sparingly. Components should feel crisp before they feel decorative.
- Do not hide core behavior behind visual flourish.
- Prefer real component examples over abstract marketing sections.

## Naming

- Product name: `Lumen UI`.
- Package scope: `@santi020k/`.
- Package names: `@santi020k/lumen`, `@santi020k/lumen-core`, `@santi020k/lumen-astro`,
  `@santi020k/lumen-react`, and `@santi020k/lumen-elements`.
