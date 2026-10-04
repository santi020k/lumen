# Lumen for Figma — Beta

**Beta version · Astro only · Development plugin.** This MVP inspects one selection, recognizes
instances from the canonical Lumen Figma library, produces an Astro component starter, and exports
a structured handoff for an existing coding agent. Generated output requires review.

The beta runs locally with no network access, API keys, accounts, telemetry, or inference charges.
It does not call an AI model itself. The user chooses whether to share the exported handoff with
their coding agent. That handoff contains the selected design's visible text and component data.

## Build and try

From the repository root, use the Node and pnpm versions documented in
[CONTRIBUTING.md](../../CONTRIBUTING.md):

```bash
pnpm install --frozen-lockfile
pnpm exec turbo run build --filter=@santi020k/lumen-figma-plugin
```

In Figma desktop, open **Plugins → Development → Import plugin from manifest** and choose
`apps/figma-plugin/dist/manifest.json`. The manifest deliberately has no invented published plugin
ID. This is a local development build, not a Figma Community listing.

Open a design using the [Lumen library](https://www.figma.com/design/luQW2pTQ3jGGxSFPAAsfa9),
select one frame or component instance, and run **Lumen for Figma · Beta**.

1. Choose **Inspect selection**.
2. Review verified components and unresolved items.
3. Copy or save the **Astro starter** or **AI handoff**.
4. Give the handoff to a coding agent working in the target repository. It directs the agent to
   check installed Lumen versions, retrieve component contracts, connect application behavior,
   and validate the rendered result.

The plugin does not modify the selected design. It adds a document-level relaunch entry so it can
be opened again. Selection or page edits invalidate the displayed output; inspect again to refresh.

## Supported conversion

| Component | Mapped properties | Review still required |
| --- | --- | --- |
| Button | Label, variant, size, loading, disabled | Action behavior and icon swaps |
| Input | Placeholder, visual size | Label, type, name, validation |
| Field | Label, helper visibility/text, one recognized Input | Other control swaps and form rules |
| Card | Title and body | Custom nested content and heading hierarchy |
| Tabs | Three labels and active tab | Panel content and application state |
| Dialog | Title, description, action labels/visibility | Trigger placement, confirmation action |

Known components are matched by observed component or component-set keys, never by layer name
alone. Renaming an instance is supported. Detached instances and duplicated libraries have no
verified identity and require review. Custom layers remain in the handoff and are explicitly
omitted from the starter. Frames become a starting Stack layout; responsive breakpoints, spacing,
alignment, typography, images, and custom visual overrides require review.

The handoff records the target package version, selected structure, layout values, visible text,
properties, paint-variable names, and findings. Color names map through
[`registry/figma-design-map.json`](../../registry/figma-design-map.json). Unbound visible solid paints and unknown
color variables are reported across the complete visible subtree, including recognized instances.
Image and gradient paints do not require semantic solid-color bindings. This beta does not claim a full token, contrast, or accessibility audit.

Exports are component fragments. Load the stylesheet and Astro runtime once at the application
boundary, as described in the handoff. Generated IDs are unique within one export; namespace them
when using multiple copies. No routes, API calls, authorization, or destructive operations are inferred.

The selection limit is 1,500 visible layers, 40 nesting levels, and 100,000 text characters. Oversized
selections fail with a useful message instead of silently truncating the design.

## Local preview and validation

```bash
pnpm --filter @santi020k/lumen-figma-plugin dev
pnpm --filter @santi020k/lumen-figma-plugin typecheck
pnpm --filter @santi020k/lumen-figma-plugin test
pnpm --filter @santi020k/lumen-figma-plugin lint
pnpm run test:figma-plugin
```

The browser preview is explicitly labeled and uses a synthetic settings screen. It does not connect
to Figma. The browser suite type-checks and builds the generated Astro fixture, then verifies labels,
tabs, dialog focus, downloads, and narrow/desktop layouts. Test the development build in Figma desktop for host permissions, real selections, clipboard
behavior, and downloads before distribution. Browser and mocked-host checks do not establish native
Figma acceptance or Community publication.

## Maintenance

`src/contracts.ts` contains the six component identities observed in the canonical library on
2026-10-04. Keep them synchronized with the existing Code Connect templates in `figma/`, the actual
Astro props, and regression tests. Component snapshots are design data, never executable code or
instructions. Build output is ignored and reproducible; do not commit `dist/`.

## Automated candidates

The [Figma plugin candidate workflow](../../.github/workflows/figma-plugin.yml) runs on relevant pull
requests and changes merged into `main`. It can also be dispatched in GitHub Actions. It builds,
type-checks, lints, runs the plugin and packaging tests, and verifies the browser export flow and
generated Astro interactions before uploading an artifact retained for 30 days. It requires no Figma
credentials and has read-only repository permissions.

Each artifact contains a ZIP named with the beta version and Git revision, a SHA-256 checksum, and
`release.json` with the full source revision, plugin ID, and per-file checksums. The ZIP includes
only the runtime files and release metadata. Pull request artifacts are review candidates; use the
artifact from the approved, merged `main` commit for Community publication.

To reproduce packaging locally after building workspace dependencies:

```bash
pnpm --filter @santi020k/lumen-figma-plugin run package
```

Packaging uses the system `zip` command (macOS and Ubuntu runners include it). Packaging tests also
use `unzip`. Output goes to `dist/artifacts/`. Local changes add `-dirty` to the ZIP name and set
`dirty: true` in its metadata. CI refuses to package a dirty checkout. A missing Figma plugin ID
produces a development candidate, never a claim of Community readiness.

## Figma Community publication

The [prepared listing materials](community/LISTING.md) include copy, the icon and cover image,
data-practice notes, and the remaining verification steps. They are ready for review; registration
and testing inside Figma desktop are still pending.

**Beta version · Not yet published to Community.** Classic plugins can be published on any Figma
plan. The earlier account permission denial concerned the connector's generative-plugin tool;
it does not establish a restriction on publishing this classic plugin.

Figma's [documented publication flow](https://help.figma.com/hc/en-us/articles/360042293394-Publish-classic-plugins-to-the-Figma-Community)
requires the desktop app. No supported unattended Community publishing API or CLI was found.
GitHub Actions automates candidate preparation; submitting and updating the listing is the remaining
manual boundary. A successful workflow does not establish Figma host compatibility or publication.

1. Create the development plugin in Figma desktop using the intended Community publisher account.
   Enable two-factor authentication and retain the plugin ID assigned by Figma. Add that ID to the
   source `manifest.json` through the normal reviewed release branch; do not invent an ID or edit
   only the generated manifest. See [Figma's manifest reference](https://developers.figma.com/docs/plugins/manifest/).
2. Download the candidate from the approved `main` commit, verify its checksum, and extract it.
   Import its `manifest.json` in Figma desktop. Confirm the full revision, version, registered ID,
   and `dirty: false` in `release.json`.
3. Verify real Lumen selections, empty/multiple selections, selection changes, clipboard, and
   downloads in Figma. The browser tests do not replace this host check.
4. In **Plugins → Manage plugins**, publish **Lumen for Figma · Beta**. Prepare an icon, thumbnail,
   description, and support link. Use the existing [Lumen support page](https://lumen.santi020k.com/support).
   Describe the six supported components, Astro starter, and AI handoff accurately: the beta does
   not run an AI model or send design data to a server. Retain the Beta label in the listing and docs.
5. Submit for Figma's initial review. After approval, verify the public install/run flow and record
   the listing URL in this guide and the docs page. Until then, keep the development-only status.

For subsequent updates, increment this app's version, describe changes in the reviewed release PR,
and repeat the automated candidate and desktop publishing steps. Preserve the approved ZIP and
checksums before Actions retention expires. Follow the repository release workflow; do not publish
from an unmerged local checkout. No GitHub secret, remote JavaScript loader, or paid runner is needed.

For recovery, republish the last verified bundle through Figma desktop, retaining its source
revision and recording the rollback in the listing's version notes. Figma distributes updates to
all users and does not let them select an older version; see [plugin version management](https://developers.figma.com/docs/plugins/#plugin-management).
