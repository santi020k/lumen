# Lumen for Figma — Beta listing materials

These are prepared listing materials, not a published Community listing. Registration and Figma
desktop verification remain pending. Publish only after the v4 web packages and documentation are
live and verified, following the [publication workflow](../README.md#figma-community-publication).

## Listing fields

| Field | Prepared value |
| --- | --- |
| Name | Lumen for Figma · Beta |
| Tagline | Turn Lumen Figma components into an Astro starter and AI handoff. |
| Category | Software development |
| Support | <https://lumen.santi020k.com/support> |
| Documentation | <https://lumen.santi020k.com/docs/figma> |
| Author | [santi020k](https://santi020k.com) |

## Description to paste

**Beta version · Astro only.** Bring your Lumen designs into your codebase using real Lumen
components.

Select a frame or component instance, inspect the design, and export an Astro starter or a structured
handoff for your coding agent. The plugin recognizes verified instances from the canonical Lumen
Figma library and highlights items that need your review.

**Supported components:** Button, Input, Field, Card, Tabs, and Dialog.

**What you get:**

- An Astro component starter using `@santi020k/lumen-astro`.
- An AI handoff containing the selected design's structure, visible text, component properties,
  starter code, and checks for your coding agent.
- Review notes for unsupported layers, detached instances, and properties requiring attention.

**Getting started:**

1. Open a design using the Lumen UI Figma library.
2. Select one frame or component instance and choose **Inspect selection**.
3. Review the findings, then copy or save the **Astro starter** or **AI handoff**.
4. Use the handoff with your coding agent to connect application behavior and verify the result.

**Beta limits:** Output is a starting point, not a complete application or a promise of visual
equivalence. Review layout, responsive behavior, accessibility, custom overrides, and action logic.
Detached components, copied libraries, and unsupported layers require manual implementation. Exports
target Lumen Astro v4; verify the version installed in your project.

The plugin runs locally without network access, model API keys, a separate plugin account, or
telemetry. It does not call an AI model. You decide whether to share an exported handoff with your
coding agent; exports include the selected design's visible text and component data.

Documentation and setup: <https://lumen.santi020k.com/docs/figma>

Questions and feedback: <https://lumen.santi020k.com/support>

Built by [santi020k](https://santi020k.com).

## Images

| Asset | Dimensions | Suggested alt text |
| --- | --- | --- |
| [Icon](assets/icon.png) | 128 × 128 PNG | Lumen UI monogram with a warm point of light. |
| [Cover](assets/thumbnail.png) | 1920 × 1080 PNG | Lumen for Figma Beta: inspect six supported components and export an Astro starter or AI handoff. |

The cover is a feature illustration, not a screenshot or evidence of Figma host verification. Both
images reuse the canonical Lumen logo paths. Keep the Beta label visible. Add a real Figma screenshot
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

| Topic | Current beta behavior |
| --- | --- |
| Design access | Reads the selected visible structure, text, component identities/properties, layout values, and paint-variable names. |
| Design changes | Does not alter the selection. Adds document-level relaunch metadata. |
| Network | Manifest declares no network access. No design data is sent to a server by the plugin. |
| AI processing | No model runs inside the plugin. The user chooses an external coding agent and what to share. |
| Storage | No Lumen server storage or telemetry. Copied or downloaded exports are managed by the user. |
| Credentials | No model API key or separate plugin sign-in is required. Figma handles its own account access. |
| User exports | Can contain sensitive text if it exists in the selection. Review exports before sharing them. |

## Remaining publication steps

- Register the classic plugin and commit its Figma-assigned ID.
- Test real component instances, error states, selection changes, clipboard, and downloads in Figma
  desktop. This was deferred while an editable Figma file was unavailable.
- Confirm account prerequisites, including two-factor authentication, in Figma's publishing flow.
- After v4 is public and verified, use the candidate from the approved merged commit, paste this
  listing copy, attach the images, and submit for review.
- After approval, verify public installation and execution, then add the real listing URL to the docs.

Figma's requirements are documented in its [classic plugin publication guide](https://help.figma.com/hc/en-us/articles/360042293394-Publish-classic-plugins-to-the-Figma-Community).
