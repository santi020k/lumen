# Lumen Migration Improvements

This document collects reusable improvements discovered while moving existing projects onto Lumen.
Completed entries are removed instead of retained as a second changelog. User-visible implementation
history lives in package changesets and changelogs.

## Coolstead v2 consumer findings

The Coolstead macOS and Astro migration from Lumen 1.x to `2.0.0` completed on 2026-08-28. The v2
source migrator reported no pending changes after the runtime import moved to
`@santi020k/lumen-astro/runtime`, `lumen doctor` finished healthy after the integration findings
below were addressed, and the consumer's complete lint, build, test, and type-check gate passed.

### Make internal-selector diagnostics directly actionable

**Observed:** `lumen doctor` correctly reported Coolstead selectors such as `.ui-badge` and
`.ui-icon` as unstable internal coupling. The remediation text suggested component props, semantic
tokens, documented custom properties, or `[data-slot]`, but `Badge` and `Icon` do not expose a
relevant documented slot. The successful consumer fix was to pass a product-owned class through the
component's public `class` prop and target that class from application CSS.

**Improve:** When a component accepts `class` or `className`, include that concrete migration in the
diagnostic and component contract. Recommend `[data-slot]` only when the diagnosed component
actually exposes a documented slot. Consider reporting the likely component name when the selector
maps unambiguously to a catalog root.

**Acceptance evidence:**

- Diagnostics for `.ui-badge` and `.ui-icon` propose a public product-class example.
- Slot guidance is emitted only for components with a documented stable slot.
- Tests cover Astro `class`, React `className`, and Elements host-class remediation without
  presenting an unsafe automatic rewrite.

### Add a rendered responsive completion check

**Observed:** The v2 migrator, Astro type-check, build, and static integration doctor all passed,
but a 390-pixel rendered check still found horizontal overflow from product-owned decorative
elements. The issue was outside Lumen's component CSS and therefore not suitable for a source
codemod, but it remained a real migration-quality defect until browser verification.

**Improve:** Add a documented optional rendered migration check, or a doctor mode that accepts a
local URL, and verifies representative mobile and desktop widths for horizontal overflow and
browser console warnings. Keep this separate from the deterministic source doctor so ordinary
package diagnosis does not start an application server or browser implicitly.

**Acceptance evidence:**

- The workflow documents at least one compact mobile width and one desktop width.
- The rendered check reports the route, viewport, document width, and overflowing element or
  pseudo-element context when possible.
- Console warnings and errors are included without treating expected application logs as Lumen
  failures.
- The source-only doctor remains fast, deterministic, and browser-free by default.

## Between Contractions v2 consumer findings

Between Contractions upgraded one Astro site plus its SwiftUI, macOS, watchOS, Compose, and Wear OS
consumers to Lumen `2.0.0` on 2026-08-28. The migration preserved the timer, history, Partner Sync,
safety guidance, localization, themes, widgets, and wearable behavior. Astro check, lint, tests,
production build, native compilation, and rendered mobile and desktop verification passed.

### Teach native doctor to understand Gradle version catalogs

**Observed:** The native doctor resolved the Swift package at `2.0.0`, but reported that Compose
source used Lumen without a Maven coordinate carrying an explicit version. The application declares
both `lumen-compose` and `lumen-compose-wear` through `gradle/libs.versions.toml`, with the shared
`lumenCompose = "2.0.0"` version reference. Gradle then resolved and compiled both modules
successfully, so the doctor warning was a false positive caused by configuration indirection.

**Improve:** Resolve standard Gradle version-catalog aliases before deciding that a native version
is missing. Follow `version.ref`, inline `version`, and plugin aliases from the root catalog, then
report the effective coordinate and the source file that supplied it. Keep an unknown result as a
warning rather than treating it as evidence that the package is absent.

**Acceptance evidence:**

- The doctor resolves `group`, `name`, and `version.ref` from a conventional
  `gradle/libs.versions.toml` catalog.
- Multiple aliases sharing one Lumen version, including Compose and Wear, produce one coordinated
  version result without a missing-coordinate warning.
- Direct dependency strings, catalog aliases, composite builds, and genuinely unresolved aliases
  have separate fixtures and diagnostics.
- The report distinguishes declared, resolved, and compiled evidence instead of implying that one
  proves the others.

### Make the Astro runtime boundary the canonical v2 setup everywhere

**Observed:** The v2 application contract requires the stylesheet once and the Astro runtime from
`@santi020k/lumen-astro/runtime`, but repeated page templates make it easy to import styles and
mount `UIPrimitives` independently. Between Contractions introduced one application-owned
`LumenRoot` boundary to centralize both responsibilities. Some Lumen setup examples still show a
root-package `UIPrimitives` import, which conflicts with the dedicated v2 runtime contract and can
teach a stale setup even when the migrator knows the new subpath.

**Improve:** Make every v2 setup surface generate the same small root-boundary pattern: import
`styles.css` once, default-import `UIPrimitives` from `/runtime`, and mount it once above all
interactive routes. Update the root README, package README, docs, portable skill, registry recipes,
CLI snippets, and MCP guidance together. Extend doctor to identify multiple mounts or stylesheet
imports across a shared Astro layout graph when it can do so deterministically.

**Acceptance evidence:**

- Every published v2 Astro example uses the dedicated runtime subpath and agrees on its export
  shape.
- A generated multi-route Astro fixture contains one stylesheet import and one runtime mount.
- Doctor reports duplicate application-boundary setup with file locations and suggests moving it
  to the nearest shared layout without rewriting product structure automatically.
- Static routes remain runtime-free when their layout does not render interactive Lumen
  primitives.

### Upgrade coordinated package policy, not only the direct adapter

**Observed:** Updating the website catalog was not sufficient for a clean immediate install. The
consumer's pnpm minimum-release-age policy also named exact releases for
`@santi020k/lumen-astro`, `@santi020k/lumen-core`, and `@santi020k/lumen`; those entries had to move
to `2.0.0` together before the lockfile could represent the coordinated release. The current v2
migrator validates source contracts but does not own or preview this package-policy migration.

**Improve:** Add an opt-in dependency phase to `lumen migrate v2`, or a dedicated upgrade command,
that discovers catalogs and minimum-release-age exclusions, previews the complete Lumen family
change, uses the repository's declared package manager, and verifies the resolved lockfile. Source
migration steps should remain runnable independently for consumers that manage dependencies
elsewhere.

**Acceptance evidence:**

- Dry-run output separately lists manifest, catalog, release-age-policy, source, and lockfile
  changes.
- Applying the upgrade preserves exact-versus-range conventions and unrelated policy entries.
- The final report compares declared and resolved adapter, core, and umbrella versions and fails
  when they are not one coordinated release.
- Repeating the command is idempotent and makes no unrelated dependency updates.

### Separate compatibility completion from adoption opportunities

**Observed:** The migrator correctly reported no remaining source rewrites and doctor became
healthy, but neither result explained whether newly released v2 components should replace existing
product UI. Between Contractions deliberately retained its safety-sensitive timer, hospital
guidance, native charts, contact fields, widgets, and platform navigation until each candidate can
match existing accessibility, localization, and behavioral coverage. A healthy upgrade therefore
means compatibility is complete, not that every new catalog component has been adopted.

**Improve:** Add a non-blocking post-upgrade adoption report based on the catalog delta between the
old and new coordinated releases. Describe new components and relevant replacement candidates, but
do not automatically rewrite domain controls or lower a healthy compatibility result when the
consumer chooses to keep them. Link each suggestion to its framework contract, accessibility
requirements, and a migration recipe where one exists.

**Acceptance evidence:**

- The completion report has distinct `Compatibility`, `Setup`, and `Adoption opportunities`
  sections.
- Suggestions are derived from versioned catalog metadata rather than component names remembered
  by the tool.
- Each suggestion explains why it may apply and how to suppress or accept it explicitly.
- No suggestion is emitted as an error, and no domain component is replaced without an explicit
  consumer action.
