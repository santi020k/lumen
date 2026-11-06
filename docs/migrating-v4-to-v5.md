# Migrating from Lumen 4 to 5

This guide and the [versioned contract](../registry/lumen-5-contract.json) describe Lumen 5 migration
behavior. Bundled guidance does not query the registry or establish publication availability.
For a release candidate, validate packed packages from one reviewed revision. Use registry install
commands below only after that version is published to your configured registry.

## Required contract review

Web adapters now install runtime dependencies only. If your scripts or contributors use `lumen`,
install `@santi020k/lumen` separately as a development dependency through your existing package
manager. The Astro, React and Elements packages no longer provide the command. Keep application
runtime adapters in production dependencies.

Use the [release manifest](../registry/release-manifest.json) for each package's version. In the initial
v5 release, the six linked web/tooling packages target 5.0.0; React Hook Form targets 4.0.2, brand icons 4.0.1, React Native and tokens 4.1.0. Compose and Wear also target 4.1.0. V5 dependency migration uses this map instead of assigning 5.0.0 to every
package. `migrate v5` follows the bundled CLI's v5 release versions; explicit audit targets must match
that bundled manifest. Swift and Maven pins remain application-owned. The refreshed Lucide catalog retains all previous names through aliases and adds new Swift enum cases. Review exhaustive `LumenIconName` switches when updating the Swift package. The repository playground now uses Expo SDK 58 with React Native 0.88 and React 19.3; regenerate and rebuild native applications when adopting that toolchain. See [dependency upgrades](lumen-5-dependencies.md) for exact versions and compatibility holds.

Astro's `LumenInitUiPrimitives(scope)` returns a promise. Await it before relying on enhancement of
newly inserted markup. The runtime dispatches `ui:ready` after initialization and `ui:runtime-error`
when automatic initialization fails. Keep the public `UIPrimitives` component in the shared layout.
After that runtime has loaded and your application has inserted its markup, replace synchronous
initialization with an awaited call:

```js
const scope = document.querySelector('#dynamic-content')
const initialize = window.LumenInitUiPrimitives

if (!scope || typeof initialize !== 'function') {
  throw new Error('The content and Lumen runtime must be ready before enhancement.')
}

try {
  await initialize(scope)
  // Enhanced controls are now ready for application interaction.
} catch (error) {
  // Keep readable fallback content and expose the application's retry action.
  console.error('Unable to enhance dynamic content.', error)
}
```

Handle rejection of an explicit call in the caller. Observe `ui:runtime-error` on `document` for
automatic initialization failures; `ui:ready` is also dispatched on `document`. Avoid relying on an
event listener attached after initialization has already completed. A call interrupted by client
navigation must not be used to interact with the previous page's markup.

`LumenToast` still returns an ID immediately, but loads its controller and stylesheet before rendering.
Do not synchronously query for the newly requested toast node. Test cold interactions, failed chunk
recovery, client navigation and application-created markup.

`ScrollReveal` and `RevealGroup` honor their explicit visibility ratio. Tall or clipped content stays
visible if that ratio is unreachable. Keyboard focus and reduced motion disable decorative hiding.
Check repeatable reveals and enlarged text; keep thresholds that express your intended animation.

## Default appearance

The default light and dark palettes change across web and native, including chart colors that
follow the brand. Review visual baselines and product colors paired with Lumen backgrounds. Token
names and control dimensions stay the same. Use `brand` for text on `brand-soft` and `on-brand`
for text on `brand-solid`. Applications can keep their own palette at the theme boundary. The
optional santi020k and Studio palettes retain their own brand colors.

On mobile, adopt Paper, Field or santi020k one screen at a time with the named theme APIs in
[Appearance presets](appearance-presets.md#named-themes-on-mobile). Move playground-style copies of
the website palette to the supplied santi020k definition. Filled primary actions now use ink while
links and charts keep the branded palette. Store appearance preference separately from the theme
identifier. Existing Default, Studio and Glass calls continue to work.


## Optional delivery and composition improvements

Astro components import their foundation and component styles automatically. React and Elements
consumers can import `styles/foundation.css` once and `styles/components/<component>.css` for each
documented component. `lumen add` generates the supported setup. Full `styles.css` remains supported.
The selective foundation ships Lumen light and dark. Add only the appearances you use from your adapter: `styles/themes/paper.css`, `styles/themes/field.css`, `styles/themes/studio.css`, `styles/themes/santi020k.css`, or `styles/effects/glass.css`. Full `styles.css` includes every appearance. This includes glass variants and the branded Code theme.
Remove full CSS only after checking all routes, themes, compound children, Markdown, and runtime-created
markup. Frameworks may share CSS and JavaScript chunks across routes.

For example, a React button can use these public imports:

```tsx
import '@santi020k/lumen-react/styles/foundation.css'
import '@santi020k/lumen-react/styles/components/button.css'
import { Button } from '@santi020k/lumen-react/components/button'

export function SaveAction() {
  return <Button type="submit">Save</Button>
}
```

This is optional after the required contract review. Keep full CSS while auditing coverage, then
choose one delivery approach for the application. See [selective installation](selective-installation.md)
for compound components, catalog fallbacks and generated wrappers.

Use exported selective JavaScript entries where available. Elements registrations must cover every
component a route uses. Root imports remain supported; a facade over the whole catalog does not
guarantee selective delivery. [Measurements](import-and-icon-performance.md) separate installed
dependencies, traversed modules, emitted assets, and actual route requests.

Prefer documented `data-slot` parts for Timeline, ThemeToggle and WorldMap. ThemeToggle exposes
`--ui-theme-toggle-icon-size`. Keep application styling and local patches until their replacements
pass equivalent consumer tests; names or source matches alone cannot prove a patch is obsolete.

Editable [product workflow recipes](product-workflow-recipes.md) cover video, code and sharing;
[interactive editorial recipes](interactive-editorial-recipes.md) cover article reading, search and
image viewing. Both compose maintained primitives. Applications still own content, localization,
requests and routing. Installing a new library version does not overwrite recipe copies.

## Review, apply and verify

Start from a clean consumer revision and record its installed versions and current local patches.
Install the target CLI separately with the application's package manager. For pnpm:

```sh
pnpm add -D @santi020k/lumen@5.0.0
pnpm exec lumen migrate v5 --dry-run --json
pnpm exec lumen audit-consumer --version 5.0.0 --json
```

The v5 migration performs no automatic source rewrites. It does not replay v4 gap, size or MCP SDK
code transformations. Reports separate incompatible version evidence, compatibility review signals, and optional
adoption opportunities. Source matches are advisory and can include examples or comments. The target
is explicit; an audit cannot establish registry availability or prove a route is correctly rendered.

Commit or otherwise preserve the reviewed CLI manifest and lockfile changes before using the automated
dependency rollout, which requires a clean worktree and pnpm:

```sh
pnpm exec lumen migrate v5 --dependencies --dry-run --json
pnpm exec lumen migrate v5 --dependencies --apply --json
```

Dependency changes remain opt-in. Inspect the manifest and lockfile diff before continuing. The
rollout uses the bundled per-package release map and does not change native Swift or Maven pins.
Other package managers should update their own manifest and lockfile using the versions in the
release manifest; source-only diagnostics do not require pnpm. For example, update only the web
adapter the app actually uses, keeping it in production dependencies. Do not install all adapters.

Apply the required runtime changes above, then run:

```sh
pnpm exec lumen doctor --json
pnpm exec lumen audit-consumer --version 5.0.0 --json
```

Ordinary `doctor` and migration commands never start browsers or application servers.
The explicit [rendered audit](rendered-audit.md) accepts a local URL and uses caller-installed Playwright.

Validate types, lint, tests, builds, package exports, mobile/desktop rendering, RTL, enlarged text,
keyboard/focus, reduced motion, no JavaScript, and first interaction on cold routes. Test packed
packages, not only workspace aliases. Native pins remain application-owned; rebuild native consumers
when changing their package versions.

Recovery: restore the consumer manifest, lockfile, setup and reviewed patches together to the previous
known-good revision. Keep review reports. Never replace published tags; a published correction uses
a new commit and version through the normal GitHub release workflow.
