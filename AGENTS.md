# AI Working Guide

This file is the canonical guide for AI agents working in this repository. Keep it short, update it
when workflow changes, and link here from tool-specific instruction files instead of repeating the
same rules elsewhere.

## Project Shape

Lumen is a multi-framework primitive UI system. The Astro package is the primary implementation, and
the other packages adapt or expose shared pieces.

- `packages/core` holds shared tokens, component metadata, class helpers, and common behavior types.
- `packages/astro` holds the most complete component catalog, standalone CSS, and progressive
  enhancement runtime.
- `packages/react` holds React primitives.
- `packages/elements` holds standards-based Web Components.
- `packages/tokens` publishes the canonical platform-neutral token document.
- `packages/react-native`, `packages/swift`, and `packages/compose` hold native platform adapters;
  the repository-root `Package.swift` exposes the SwiftUI sources to Swift Package Manager.
- `packages/lumen` is the umbrella package and public package map.
- `apps/docs` is the Astro documentation and demo site.

Use [README.md](README.md) for the public overview, [docs/ai-usage.md](docs/ai-usage.md) for
AI-facing consumption examples, and [docs/brand-guidelines.md](docs/brand-guidelines.md) for voice
and visual guidance.

## Working Rules

- Prefer the existing package boundaries. Shared contracts belong in `packages/core`; framework
  details belong in the matching framework package.
- Treat `tokens/lumen.tokens.json` as the canonical native foundation source. Run
  `pnpm run generate:platform-tokens` after changing it and commit the generated adapter sources.
- Share semantic roles and behavior contracts across native adapters, but use SwiftUI, Compose, and
  React Native conventions instead of reproducing DOM APIs.
- Treat Astro as the reference surface unless the task explicitly targets another framework.
- Keep public APIs small and stable. Add exports intentionally and update the package README when
  the usage story changes.
- Preserve user work. Check `git status --short` before editing and do not overwrite unrelated
  local changes.
- Add a changeset for user-visible package changes. Documentation-only and internal maintenance
  work usually does not need one.
- Keep generated or built output out of commits unless the repo already tracks it.

## Commands

Use `pnpm` from the repo root.

```bash
pnpm install
pnpm run dev
pnpm run build
pnpm run typecheck
pnpm run test
pnpm run lint
pnpm run validate
swift test
(cd packages/compose && ./gradlew test lint)
```

For narrow checks, prefer the smallest command that covers the edited surface. Run `pnpm run validate`
before release-oriented work or broad cross-package changes.

## Implementation Notes

- Components should use the existing token names: `canvas`, `surface`, `surface-muted`,
  `surface-strong`, `line`, `ink`, `ink-soft`, `ink-muted`, `brand`, `brand-solid`, `brand-soft`,
  `on-brand`, `accent`, `success`, `warning`, `danger`, and `on-danger`.
- Standalone component CSS lives in `packages/astro/styles/lumen.css`. The docs app can layer its
  own theme tokens in `apps/docs/src/styles/global.css`.
- Interactive Astro primitives should keep working without requiring Tailwind configuration from
  consumers.
- Treat all library input as uncontrolled. Avoid backtracking-prone regular expressions and
  single-occurrence replacements used as escaping or structural transforms; prefer linear scans
  and add adversarial-length regression tests for parsers.
- In Lumen-owned apps and documentation, always use the public Lumen component when an equivalent
  exists. Do not recreate a component by applying `ui-*` classes directly to a native element.
- Keep native HTML only when it is required by a Lumen compound component's documented child
  contract or no Lumen equivalent exists. Add reusable missing UI to Lumen first, then consume the
  public component.
- Use accessible names, keyboard paths, focus states, and semantic markup for every primitive.
- Tests live beside package code as `*.test.ts`. Add or update tests when behavior, exported
  metadata, or component contracts change.

## Documentation Rules

- The root README explains what Lumen is and how to start.
- Package READMEs explain package-specific install and usage details.
- AI usage examples for downstream app generation live in [docs/ai-usage.md](docs/ai-usage.md).
- Brand guidance lives only in [docs/brand-guidelines.md](docs/brand-guidelines.md).
- Contributor workflow lives in [CONTRIBUTING.md](CONTRIBUTING.md).
- The MCP server for AI agents lives in [packages/mcp](packages/mcp/README.md); regenerate its bundled
  snapshot with `pnpm --filter @santi020k/lumen-mcp run generate` after changing components, tokens, or `llms.txt`.
- Figma workflows: implementing Figma designs with Lumen follows
  [docs/figma-design-to-code.md](docs/figma-design-to-code.md); token export to Figma lives in
  [docs/figma.md](docs/figma.md); reusable AI maintenance instructions for the library live in
  [docs/figma-ai-working-guide.md](docs/figma-ai-working-guide.md).
- Tool-specific AI files should be tiny pointers back to this file.

## Imported Claude Cowork project instructions

<!-- santi020k-quality-policy:start -->
## ESLint and TypeScript quality policy

- Treat every ESLint warning and TypeScript diagnostic as work to resolve, not successful output.
- Run the repository's canonical lint and type-check commands before handoff. Use
  `--max-warnings=0` for every direct ESLint command, including workspace scripts and
  `lint-staged`; never use `--quiet` to hide warnings.
- Fix the underlying implementation. Do not lower rule severity, widen ignores, or add
  `eslint-disable`, `@ts-ignore`, `@ts-expect-error`, `any`, unsafe casts, or non-null assertions
  merely to make a check pass.
- A narrow suppression is acceptable only when the root cause cannot be fixed safely. Explain why,
  scope it to the smallest surface, and leave a tracking path.
- Fix all safe and feasible diagnostics you encounter, including pre-existing ones exposed by the
  work. Never finish while feasible warnings or type errors remain.
- If an external or unrelated blocker cannot be resolved safely, report the exact command, file,
  and diagnostic instead of hiding it.
- Do not add ESLint or TypeScript to a repository that does not use that toolchain solely for
  uniformity; apply this policy when that toolchain exists or is introduced for project reasons.
<!-- santi020k-quality-policy:end -->

<!-- commitprompt:start -->
## Commit generation

- Inspect the repository status and staged diff before proposing a commit message.
- Run `pnpm exec commitprompt types --json` and
  `pnpm exec commitprompt instructions --json` to load the repository rules.
- Pass structured fields to `pnpm exec commitprompt format --json`, then validate
  the exact message with `pnpm exec commitprompt validate --json`.
- Only run `pnpm exec commitprompt commit --yes --json` when the user explicitly
  authorizes a commit. Never stage unrelated files or bypass Git hooks.
- Review messages generated by Zed or VS Code. The `commit-msg` hook is the final
  authority and rejected messages must be corrected, not forced through.
<!-- commitprompt:end -->
