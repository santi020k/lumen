# Contributing

Thanks for helping Lumen stay sharp. This guide covers the working loop; public project context lives
in [README.md](README.md), and AI-specific instructions live in [AGENTS.md](AGENTS.md).

## Feedback and support

Use [Ideas](https://github.com/santi020k/lumen/discussions/categories/ideas) for suggestions,
[Q&A](https://github.com/santi020k/lumen/discussions/categories/q-a) for usage questions, and the
[bug form](https://github.com/santi020k/lumen/issues/new?template=bug-report.yml) for defects and
accessibility problems. Search existing conversations before posting. Reports are public; use
[SECURITY.md](SECURITY.md) for suspected vulnerabilities.

Accepted ideas link to implementation issues on the [public roadmap](https://lumen.santi020k.com/support#roadmap).
Follow the [community feedback workflow](docs/community-feedback.md) when reviewing feedback, linking work,
and recording the release that ships an improvement. Votes inform priorities without promising delivery.

## Local Setup

Use Node.js 22.22.2+, 24.15.0+, or 26+ and the pnpm version pinned in `package.json` (currently 12.8.1).
This workspace tooling requirement does not change the supported runtimes of published packages.

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

The canonical `pnpm run typecheck` also checks the local Figma Code Connect templates and their
shared ambient types with `pnpm run typecheck:figma`.

The root ESLint configuration explicitly supplies `@typescript-eslint/parser` for Astro files.
Keep it as a declared development dependency: the Astro plugin resolves the parser from the
consumer workspace, so a transitive installation alone does not guarantee type-aware linting.

The Next.js smoke app runs type checking after its own build so the two tasks do not overwrite
the same generated route types during combined checks.
Turborepo caches its production build output while excluding `.next/cache` and `.next/dev`;
those mutable directories must not be restored as production artifacts.

Use `pnpm run validate` for broad cross-package changes, release work, and final confidence before
publishing. It intentionally remains exhaustive.

Pull request CI classifies changed paths before starting platform jobs. Web packages, React Native,
SwiftUI, Compose, browser suites, playground captures, MCP checks, package smoke tests, and bundle
budgets run only when their owning sources or shared foundations changed. The release canary uses
the same package boundaries; dispatch it manually when an explicit full web, Swift, and Compose
qualification run is required.

CI runs repository lint, workflow contracts, and dependency security before expensive builds.
Release canaries also check version, API, and coordinated release contracts in that preflight.
Failures stop downstream jobs; browser shards cancel their sibling on failure and stop at the
first failed test. All accessibility tests remain covered across two shards. Packed npm, browser,
Compose, and packed React Native Android checks run in separate lanes after preflight.
Quality's pinned pnpm setup action restores Turbo task outputs, while Java setup caches Gradle
dependencies. Cache hits accelerate work but never replace the required checks or release approval.
Run `pnpm run ci:preflight` locally for the same early feedback; `pnpm run validate` remains the
complete release gate.

The Swift API baseline builds only arm64 because its symbol extraction targets arm64 on every
Apple SDK. It still checks all supported platforms and both public modules against the unchanged
classified baselines. This avoids compiling architectures the API checker does not consume.
Apple CI runs `pnpm run check:swift-package-candidate --check-api-baseline` to check those same
baselines from the clean tagged consumer's compiled modules, avoiding duplicate library builds.
Use `pnpm run check:swift-api-baseline` for a standalone source check; baseline updates always
build repository sources. No compiled consumer products are restored from cache.

Run `pnpm run test:visual` for documentation screenshots. It builds the dependencies and docs through
`prepare:visual` before starting Playwright, so the server-start budget covers only the preview
server. `test:visual:update` uses the same preparation. Direct `pnpm exec playwright test` requires
`pnpm run prepare:visual` first. Screenshot assertions and server-start limits remain unchanged.

Dependency age exceptions must identify the exact reviewed package version. Use a temporary exact-version exception for an approved security fix that cannot wait for
the normal 24-hour hold, then remove it once that hold expires. The
`http-cache-semantics@4.3.0` exception was retired after 2026-10-05 02:56:06 UTC; its fixed
version remains in the lockfile. Keep the age policy for other dependencies.


## Bundle size policy

`pnpm run check:bundle-size` reports raw and level-9 gzip bytes after a build. The complete
stylesheet, Astro runtime source, React component and hook catalogs, and Elements definition
catalog are informational measurements. They may grow as components are added and do not block
validation. They measure shipped entries, not the bytes every application downloads.

Focused modules and optional controllers retain their enforced raw/gzip budgets. Extracted related
files remain included in their owning measurement. Two minified browser consumer fixtures also
have enforced budgets: selective React ImageComparison (5,500 raw / 2,500 gzip bytes) and granular
Elements VirtualList registration (9,000 raw / 3,500 gzip bytes). React is external in these
fixtures; CSS and application framework code are excluded. These limits allow headroom above the
existing fixtures while catching accidental inclusion of unrelated catalog code.

New components can expand the catalog without raising a global ceiling. Review deliberate growth
in focused modules or consumer fixtures and update their budgets with measured evidence when
needed. Missing measured artifacts and failed consumer builds still fail the check. Release-scoped
checks honor `LUMEN_RELEASE_PACKAGES`; core changes measure all adapters.

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
4. Add the guide to the documentation search index; the build includes its social image automatically.
5. Run the docs typecheck, tests, lint, and build before opening a pull request.

Component reference examples live in `apps/docs/src/examples/<Name>.astro`. Keep data declarations
in the Astro data block so the shared snippet builder can include them in React usage. Use
public `Stack`, `Grid`, `Field`, and `Label` primitives rather than repeating layout and form markup.
For automatic grids, choose `minItemWidth`; the public Grid clamps it to the available width.

The docs tests check catalog coverage, parse generated React examples as JSX, and type-check them
against the public React adapter. These checks do not replace rendered interaction tests. Complex
framework contracts need explicit overrides in `apps/docs/src/lib/snippets.ts`. Elements chart examples
use JSON attributes or public element properties; do not leave Astro expressions in copyable HTML.
Label illustrative data as such.
Verify changed examples at a narrow phone size and desktop, including the playground width controls.

Keep documentation pages focused on one task. Put working previews before long explanations and
keep copyable code next to the preview, using `FrameworkExample` for adapter tabs. Chart directories
link to the canonical component pages; their selection, data, and interpretation guidance lives in
`apps/docs/src/data/chart-guides.ts`. Do not duplicate chart API reference pages.

For a new documentation route, update the relevant navigation and search metadata, then run the
docs build. Social images are derived from the final indexable HTML metadata, so
new routes are included automatically without maintaining a separate route catalog. Use accurate,
specific titles and descriptions in the page layout; those also drive the card and route manifest.
Native component cards reuse the verified native captures. Run
`pnpm --filter @santi020k/lumen-docs run check:og` and `pnpm --filter @santi020k/lumen-docs run audit:seo` after building. `DocsLayout` builds an
accessible section menu from page headings; pass explicit `pageNavigation` entries when sections
need different labels or a stable server-rendered menu. Preserve old deep links with an onward link
or a focused redirect. See [the navigation audit](docs/documentation-navigation-audit.md) for the
current page boundaries and validation coverage.

The docs post-build SEO audit also checks rendered header, sidebar, section, and footer navigation
and every destination in `docs-search.json`. Internal routes must resolve to a built page or static
file; fragments must identify a rendered element. Links inside live component previews are examples,
so they are excluded from site-navigation validation. Run
`pnpm --filter @santi020k/lumen-docs run audit:seo` against the current build when changing navigation
or search data. The same audit checks sitemap coverage and excludes internal/noindex pages.

Do not publish generic announcements as guides. A guide should leave a developer able to build or
verify something they could not confidently complete before reading it.

## Publishing

Prepare every non-initial release in `release/v<semver>` and open its pull request into `main`.

For the initial v4 publication, approval identifies the exact reviewed draft revision. After recording
approval, run `pnpm run generate:v4-migration` and `pnpm --filter @santi020k/lumen-mcp run generate`.
The revision gate permits only contract status/approval metadata and those two generated migration
mirrors to change. Both mirrors must match the approved contract; all migration rules and the rest
of the MCP snapshot must remain identical to the reviewed revision. Commit the approval and mirrors
together, then run `node scripts/check-approved-release-revision.mjs` from the clean committed tree.
The integrity check reads each generated mirror with a bounded 16 MiB subprocess buffer, including
the full MCP snapshot; oversized or unreadable mirrors fail publication. The MCP catalog hash
tracks catalog content and migration rules, excluding publication status and approval metadata.

1. Each user-visible change includes a Changeset. Use the installed generator to prepare package
   versions and changelogs, including any generated `changeset-release/main` work in the selected
   release branch.
2. For a coordinated major release such as v4, fold stabilization notes into the prepared, unpublished
   version. Consume its Changesets so publishing does not introduce another version bump.
3. Run the canonical validation and release gates, complete the independent pre-push review, and
   resolve every finding. Include migration guidance and a recovery plan in the release pull request.
4. Obtain explicit release approval and merge the authorized `release/v<semver>` pull request after
   required checks and reviews pass. The workflow detects package manifest and release manifest
   changes as well as pending Changesets, so a prepared release starts publication automatically.
5. GitHub Actions publishes packages and creates immutable release tags and GitHub releases from the
   merged commit. Public Apple builds and distribution run on standard GitHub macOS runners; private repositories use Xcode Cloud. Verify provenance, published
   consumers and deployed smoke checks before retiring the release branch.

The Changesets action can still create or update its version-preparation pull request when pending
Changesets reach `main`. Integrate that generated preparation into the selected release branch;
its automatic branch does not replace the reviewed release pull request. Never publish a subsequent
release directly from a developer machine.

Feature pull requests run affected package checks plus the platform and integration gates selected
from their changed paths. The automated release pull request resolves the exact Changesets package
set and runs only its builds and publish dry-runs because its generated changes are limited to
versions, changelogs, synchronized installation guidance, the lockfile, and the MCP snapshot. The
publication run resolves the same scope from pending Changesets or unpublished local versions and
retains package-family, native, and MCP release gates only when that scope requires them.
