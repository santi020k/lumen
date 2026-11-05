# Migrating from Lumen 4 to 5

Lumen 5 is being prepared locally. This guide and the [versioned contract](../registry/lumen-5-contract.json)
describe the candidate; they do not assert registry availability or publication approval.

## Required contract review

Web adapters now install runtime dependencies only. If your scripts or contributors use `lumen`,
install `@santi020k/lumen` separately as a development dependency through your existing package
manager. The Astro, React and Elements packages no longer provide the command. Keep application
runtime adapters in production dependencies.

Astro's `LumenInitUiPrimitives(scope)` returns a promise. Await it before relying on enhancement of
newly inserted markup. The runtime dispatches `ui:ready` after initialization and `ui:runtime-error`
when automatic initialization fails. Keep the public `UIPrimitives` component in the shared layout.
`LumenToast` still returns an ID immediately, but loads its controller and stylesheet before rendering.
Do not synchronously query for the newly requested toast node. Test cold interactions, failed chunk
recovery, client navigation and application-created markup.

`ScrollReveal` and `RevealGroup` honor their explicit visibility ratio. Tall or clipped content stays
visible if that ratio is unreachable. Keyboard focus and reduced motion disable decorative hiding.
Check repeatable reveals and enlarged text; keep thresholds that express your intended animation.

## Optional delivery and composition improvements

Astro components import their foundation and component styles automatically. React and Elements
consumers can import `styles/foundation.css` once and `styles/components/<component>.css` for each
documented component. `lumen add` generates the supported setup. Full `styles.css` remains supported.
Remove full CSS only after checking all routes, themes, compound children, Markdown, and runtime-created
markup. Frameworks may share CSS and JavaScript chunks across routes.

Use exported selective JavaScript entries where available. Elements registrations must cover every
component a route uses. Root imports remain supported; a facade over the whole catalog does not
guarantee selective delivery. [Measurements](import-and-icon-performance.md) separate installed
dependencies, traversed modules, emitted assets, and actual route requests.

Prefer documented `data-slot` parts for Timeline, ThemeToggle and WorldMap. ThemeToggle exposes
`--ui-theme-toggle-icon-size`. Keep application styling and local patches until their replacements
pass equivalent consumer tests; names or source matches alone cannot prove a patch is obsolete.

Editable [product recipes](interactive-editorial-recipes.md) compose maintained primitives for video,
code, sharing, article reading, search and image viewing. Applications still own content, localization,
requests and routing. Installing a new library version does not overwrite recipe copies.

## Review, apply and verify

Run the separately installed candidate CLI in the consumer:

```sh
pnpm exec lumen migrate v5 --dry-run --json
pnpm exec lumen audit-consumer --version 5.0.0 --json
```

The v5 migration performs no automatic source rewrites. It does not replay v4 gap, size or MCP SDK
code transformations. Reports separate incompatible version evidence, compatibility review signals, and optional
adoption opportunities. Source matches are advisory and can include examples or comments. The target
is explicit; an audit cannot establish that a candidate is published or a route is correctly rendered.

Dependency changes remain opt-in with `--dependencies --apply` and the existing package-manager and
dirty-worktree safeguards. Use them only once your intended version is available from the configured
registry. Ordinary `doctor` and migration commands never start browsers or application servers.
The explicit [rendered audit](rendered-audit.md) accepts a local URL and uses caller-installed Playwright.

Validate types, lint, tests, builds, package exports, mobile/desktop rendering, RTL, enlarged text,
keyboard/focus, reduced motion, no JavaScript, and first interaction on cold routes. Test packed
packages, not only workspace aliases. Native pins remain application-owned; rebuild native consumers
when changing their package versions.

Recovery: restore the consumer manifest, lockfile, setup and reviewed patches together to the previous
known-good revision. Keep review reports. Never replace published tags; a published correction uses
a new commit and version through the normal GitHub release workflow.
