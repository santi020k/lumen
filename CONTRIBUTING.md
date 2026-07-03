# Contributing

Thanks for helping Lumen stay sharp. This guide covers the working loop; public project context lives
in [README.md](README.md), and AI-specific instructions live in [AGENTS.md](AGENTS.md).

## Local Setup

```bash
pnpm install
pnpm run dev
```

The docs app is the fastest way to inspect components while working.

## Change Workflow

1. Check the current state with `git status --short`.
2. Keep the change scoped to the affected package or docs area.
3. Update tests or examples when behavior changes.
4. Run the smallest useful validation command.
5. Add a changeset for user-visible package changes.
6. Use the pull request template and note any commands you could not run.

## Validation

Common commands:

```bash
pnpm run build
pnpm run typecheck
pnpm run test
pnpm run lint
pnpm run validate
```

Use `pnpm run validate` for broad changes, release work, and final confidence before publishing.

## Release Notes

Add a changeset when a package consumer can observe the change: new components, changed props,
styling changes, exports, runtime behavior, or package metadata. Skip changesets for internal-only
docs, tests, refactors, and CI maintenance.

