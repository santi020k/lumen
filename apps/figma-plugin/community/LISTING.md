# Lumen for Figma listing materials

These are prepared listing materials, not a published Community listing. Use the [reviewer walkthrough](#reviewer-walkthrough) on the approved candidate.
Publish only after the target packages and documentation are live and verified, following the [publication workflow](../README.md#figma-community-publication).

## Listing fields

| Field | Prepared value |
| --- | --- |
| Name | Lumen for Figma |
| Tagline | Export Lumen designs to web and native code. |
| Category | Software development |
| Support | <https://lumen.santi020k.com/support> |
| Documentation | <https://lumen.santi020k.com/docs/figma> |
| Privacy | <https://lumen.santi020k.com/privacy#figma-plugin> |
| Publish as | Lumen team |
| Author | [santi020k](https://santi020k.com) |

## Description to paste

Select a frame in a design that uses the [Lumen UI library](https://www.figma.com/community/file/1662337342676541513). Lumen for Figma identifies linked components, shows which layers need work, and exports a starter you can edit.

**For the web:** Export Astro, React TSX, or HTML with Lumen Web Components. Choose Lumen 5.0.0 or 4.4.0 and the appearance used by your project. The plugin recognizes 21 components. Lumen 4.4 uses Astro 4.4.0 and React or Elements 4.3.0.

**For native apps:** Export React Native, Jetpack Compose for Android, or SwiftUI for iPhone and Mac. Native starters map nine components and nested layouts. React Native and Compose target adapter 4.1.0; SwiftUI targets v5.0.0.

Choose your target, click **Inspect selection**, then copy or save the starter and setup instructions where offered. The optional AI handoff includes visible design text, component properties, and items to review. You connect actions, implement unsupported layers, and check accessibility in your app.

The plugin runs offline. It does not call an AI model or send your design to Lumen. You choose whether to share an export.

[Setup and documentation](https://lumen.santi020k.com/docs/figma) · [Support](https://lumen.santi020k.com/support) · [Privacy](https://lumen.santi020k.com/privacy#figma-plugin) · Built by [santi020k](https://santi020k.com).

## Reviewer walkthrough

1. In an editable file with access to the canonical Lumen team library, enable that library. Place a linked Lumen Button in a frame, change the instance label to **Continue**, and select its parent frame. A detached or copied component definition has a different identity; use the linked instance. Confirm that a reviewer outside the team can open the example before supplying it in the submission.
2. Choose **React**, **Lumen 4.4.0**, and **Inspect selection**. Expect a verified Button, a TSX starter with the edited label, and setup for the React 4.3.0 adapter.
3. Switch to **Web Components** and **Lumen 5.0.0**, then inspect again. Expect an HTML starter and an app setup module. Select **iPhone · SwiftUI** and inspect again to see a SwiftUI view for the same Button.
4. Deselect the frame. The panel should clear the previous result and ask you to select one frame or component. No sign-in to Lumen, network permission, or AI service is required.

## Images

| Asset | Dimensions | Suggested alt text |
| --- | --- | --- |
| [Icon](assets/icon.png) | 128 × 128 PNG | Lumen UI monogram with a warm point of light. |
| [Cover](assets/thumbnail.png) | 1920 × 1080 PNG | Lumen for Figma: inspect canonical components and export web or native code or AI handoff. |

The cover is a feature illustration, not a screenshot or evidence of Figma host verification. Both
images reuse the canonical Lumen logo paths. Add a real Figma screenshot
only after the development plugin has been registered and tested with a representative design.

Regenerate the tracked publishing assets from the repository root using the existing
`@santi020k/og` renderer and bundled fonts:

```bash
pnpm --filter @santi020k/lumen-docs exec santi-og generate --config scripts/generate-figma-plugin-listing.mjs
```

The source artwork and font license live in `apps/docs/public/`; the composition lives in
`apps/docs/scripts/generate-figma-plugin-listing.mjs`. Do not edit the generated PNGs by hand.

## Data practices for submission

Use these factual statements when completing Figma's current disclosure form; verify each question
at submission time rather than treating this as a completed or approved disclosure.

| Topic | Plugin behavior |
| --- | --- |
| Design access | Reads the selected visible structure, text, component identities/properties, layout values, and paint-variable names. |
| Design changes | Does not alter the selection. Adds document-level relaunch metadata only when registered with Figma. |
| Network | Manifest declares no network access. No design data is sent to a server by the plugin. |
| AI processing | No model runs inside the plugin. The user chooses an external coding agent and what to share. |
| Storage | No Lumen server storage or telemetry. Copied or downloaded exports are managed by the user. |
| Credentials | No model API key or separate plugin sign-in is required. Figma handles its own account access. |
| User exports | Can contain sensitive text if it exists in the selection. Review exports before sharing them. |

## Remaining publication steps

Follow the [publication checklist](../README.md#figma-community-publication) in order. The checklist
covers registration and real Figma testing before launch, the public target package/documentation gate,
submission of the approved candidate, and verification and documentation updates after approval.

Listing materials alone do not establish a registered plugin ID, completed host verification, a
submitted review, or an approved Community listing. Record those outcomes with the exact candidate
revision and checksum in the release PR as they happen. Verify public installation after approval before adding a Community plugin link.

Figma's requirements are documented in its [classic plugin publication guide](https://help.figma.com/hc/en-us/articles/360042293394-Publish-classic-plugins-to-the-Figma-Community).
