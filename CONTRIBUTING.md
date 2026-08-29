# Contributing

Thanks for helping Lumen stay sharp. This guide covers the working loop; public project context lives
in [README.md](README.md), and AI-specific instructions live in [AGENTS.md](AGENTS.md).

## Local Setup

```bash
pnpm install
pnpm run hooks:install
pnpm run dev
```

Install the [Quality CLI](https://github.com/santi020k/quality) before running the hook installer.
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
pnpm run check:affected
pnpm run build
pnpm run typecheck
pnpm run test
pnpm run lint
pnpm run validate
```

Use `pnpm run check:affected` for the normal development loop. It compares the current branch with
`origin/main`, runs build, typecheck, lint, and tests only for changed packages and their downstream
consumers, then checks changed repository-level files. The pre-push hook uses the same command.

Set `TURBO_SCM_BASE` and, when needed, `TURBO_SCM_HEAD` to compare another range. Use the individual
`build:affected`, `typecheck:affected`, `test:affected`, and `lint:affected` commands when iterating
on one kind of check.

Use `pnpm run validate` for broad cross-package changes, release work, and final confidence before
publishing. It intentionally remains exhaustive.

Pull request CI classifies changed paths before starting platform jobs. Web packages, React Native,
SwiftUI, Compose, browser suites, playground captures, MCP checks, package smoke tests, and bundle
budgets run only when their owning sources or shared foundations changed. The release canary uses
the same package boundaries; dispatch it manually when an explicit full web, Swift, and Compose
qualification run is required.

## Release Notes

Add a changeset when a package consumer can observe the change: new components, changed props,
styling changes, exports, runtime behavior, or package metadata. Skip changesets for internal-only
docs, tests, refactors, and CI maintenance.

## Documentation and Guides

Use **Guides** for task-oriented learning content. Keep API reference material under `/docs` and
release history in the changelog.

When adding a guide:

1. Register its title, description, author, publication date, and route in
   `apps/docs/src/data/guides.ts`.
2. Add the page below `apps/docs/src/pages/guides` and reuse that registered metadata in
   `BaseLayout` so article, social, breadcrumb, and RSS metadata stay aligned.
3. Teach one concrete product outcome with working code, important product states, accessibility
   checks, and a clear next step.
4. Add the guide to the documentation search index and generated social-image catalog.
5. Run the docs typecheck, tests, lint, and build before opening a pull request.

Do not publish generic announcements as guides. A guide should leave a developer able to build or
verify something they could not confidently complete before reading it.

## Publishing

All work merges into `main`; contributors do not create or merge a separate release branch.

1. Each user-visible pull request includes a changeset.
2. After it merges, the release workflow creates or updates `changeset-release/main`.
3. Merge that automated pull request when the accumulated changes are ready to publish.
4. The merge publishes the packages and creates the GitHub releases automatically.

Feature pull requests run affected package checks plus the platform and integration gates selected
from their changed paths. The automated release pull request resolves the exact Changesets package
set and runs only its builds and publish dry-runs because its generated changes are limited to
versions, changelogs, synchronized installation guidance, the lockfile, and the MCP snapshot. The
publication run resolves the same scope from pending Changesets or unpublished local versions and
retains package-family, native, and MCP release gates only when that scope requires them.
