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
[`registry/figma-design-map.json`](../../registry/figma-design-map.json). Unbound paints and unknown
color variables are reported. This beta does not claim a full token, contrast, or accessibility audit.

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

The Figma account-library creation tool rejected creation with the current account permissions during
initial development. This repository build remains usable as a local development plugin. A hosted
plugin or public listing requires separate permission and publication verification.
