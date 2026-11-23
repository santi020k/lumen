# Visual interactions implementation

This work extends the current `release/v4.0.0` candidate. Each capability remains an additive,
optional contract. Astro is the reference surface; React and Elements share behavior and styling.
The existing native duration and easing vocabulary remains the motion foundation.

## Completion requirements

- Coordinated motion: keyed list reordering, enter/exit behavior, shared-element view changes,
  selection indicators, disclosure resizing, and pending/success feedback. Verify interruption,
  cleanup, reduced motion, keyboard focus, and unsupported browser fallbacks.
- Visual effects: mesh and aurora backgrounds, spotlight, grain, gradient borders, SVG drawing,
  and scroll-linked depth. Use semantic tokens, legible content, static fallbacks, and explicit
  animation controls across Astro, React, and Elements.
- Product blocks: installable pricing, feature preview, onboarding, and command-center recipes
  across all three web targets. Include realistic states and working interactions.
- Visual playground: live timing and intensity controls, reduced-motion comparison, and accurate
  copyable Astro, React, and Elements usage. Register navigation and search metadata.
- AI surfaces: prompt composition, streaming messages, citations, tool activity, approval cards,
  retry and stop controls. Keep transport, model selection, and authorization application-owned.
- Chart continuity: stable identities across updates, animated value changes and live points,
  coordinated inspection, and explicit loading/empty transitions. Preserve accessible values.
- Optional integrations: Motion spring/layout/gesture composition and Rive state-machine binding,
  with actual runtime contract checks, lifecycle cleanup, errors, and reduced-motion handling.
- Documentation and distribution: component contracts, examples, package exports, Changesets,
  registry and MCP snapshots, consumer smoke checks, and performance budgets.
- Verification: focused behavioral tests, web adapter checks, responsive rendered verification,
  zero-warning lint, strict types, and canonical `pnpm run validate`.
- Local release integration: focused commits, refresh the release target in a clean idle worktree,
  merge completed work, rerun affected checks, and prove Git ancestry. Remote actions require
  separate authorization.

## Worktree boundaries

`feature/visual-interactions` starts from revision `2a7cbade`. The selected release target is
`release/v4.0.0`; refresh its current revision and worktree ownership before integration. Other
motion and release chats have advanced independently; never change their checkouts or include
uncommitted work from them.

## Evidence

- Implemented eight web primitives, seven effects, shared tab/disclosure/chart motion, four
  interactive product recipes per web target, and the visual playground.
- Optional Motion 14 and Rive 2.44 adapters compile against their installed SDK contracts. Rive
  lifecycle tests inject a typed runtime. A temporary browser fixture also loaded Rive’s official
  `data_bind_runtime_test.riv`, updated its `outer` string binding, paused for local reduced motion,
  rejected updates after disposal, and surfaced a missing-asset error. Motion keyboard activation
  preserved native button semantics.
- `pnpm run build` passed. `pnpm run typecheck` passed all 26 tasks. The full Vitest suite passed
  2,471 tests across 235 files, including Astro swap cleanup and hostile citation input.
- Canonical lint, spelling, unused-code, registry, framework/native contract, MCP evaluation, and
  production dependency security checks passed in the validation sequence.
- Browser checks at 1280×900 and 390×844 showed no horizontal overflow. Verified local reduced
  motion, immediate chart table values, pricing selections, onboarding focus/completion, command
  activation, approvals, stream stop/retry, coordinated keyboard chart inspection, and loading/empty
  chart states. The route selects the Web documentation context. Temporary screenshots are in
  `/tmp/lumen-visual-evidence/`.
- The original catalog-size gate failed at CSS 36.0 KiB gzip and Elements registration 46.4 KiB.
  Release policy revision `eaf4bcdc` now reports complete catalog sizes and enforces focused module
  and selective consumer limits. Revalidate against that policy before integration.
- Generated Astro and Elements recipes were exercised in temporary browser fixtures: annual
  pricing, feature selection, accessible onboarding focus/completion, and keyboard commands.
  Fixed Astro disabled-class synchronization and Elements input labeling found by these checks.
  Temporary smoke pages, installed recipe copies, and SDK assets were removed afterward.
- Packed package consumers, React Native peer/type checks, and external MCP stdio/HTTP smoke tests
  passed. Local release integration remains pending. No remote action or publication is established
  by this evidence.
