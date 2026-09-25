# Instagram plugin launch

**Status: published on 2026-09-08.** Santiago requested this Instagram announcement after the
approved Lumen UI 1.0.0 plugin was published. Account: `@lumenui.dev`.

Live post: [Lumen UI plugin announcement](https://www.instagram.com/p/DdA_qByERTO/).

Instagram confirmed “Your post has been shared.” The three slides were previewed in order,
and the exact caption and all three custom alternative-text fields were verified before sharing.
Facebook cross-posting remained off. The public profile listed the new post after publication.
Opening the direct permalink confirmed the published caption, account, and all three custom image
descriptions. The launch preflight, generator lint, spelling check, and docs typecheck passed.

## Verified claim and destination

Claim C-12: Lumen UI 1.0.0 is published in the shared ChatGPT and Codex Plugins Directory.
The [public listing](https://chatgpt.com/plugins/plugin_asdk_app_6a8f6c526c5481918eb8a48806fa112b)
was opened while signed out and displays **Install plugin**, the app, the skill, starter prompts,
and version 1.0.0. See [`../openai-plugin-submission.md`](../openai-plugin-submission.md).

The CTA uses directory search. The documentation update is local and has not been deployed;
the caption does not send readers to an unpublished installation guide.

## Assets

Upload these square 1080 × 1080 PNGs in numeric order from
`apps/docs/public/launch/instagram/lumen-plugin-launch/`:

1. `lumen-plugin-launch-1.png` — publication announcement.
2. `lumen-plugin-launch-2.png` — real public directory listing screenshot.
3. `lumen-plugin-launch-3.png` — installation steps and an example prompt.

`directory-listing.jpg` is the unmodified public, signed-out browser capture used by the renderer.
It contains no private account data. Regenerate the slides with:

```bash
node apps/docs/scripts/render-instagram-plugin-launch.mjs
```

## Caption

Lumen UI is now available in ChatGPT and Codex.

The plugin pairs the Lumen workflow skill with a read-only component catalog. Ask for component
suggestions, framework-specific usage, recipes, design tokens, and accessibility guidance.

Try this prompt:
“Find the right Lumen components for an accessible React settings screen.”

To get started, open Plugins in ChatGPT or Codex, search for Lumen UI, and select Install plugin.
Then mention Lumen UI in your request.

No separate Lumen account, API key, or local MCP setup.

\#LumenUI #ChatGPT #Codex #DesignSystems #WebDevelopment

## Alternative text

1. Lumen UI launch card reading “Now in ChatGPT. And Codex.” It describes the Lumen workflow skill
   with a real component catalog and marks version 1.0.0 as published.
2. Lumen UI card titled “A real catalog. Ready to use.” A real screenshot of the public ChatGPT
   Plugins Directory shows Lumen UI, an Install plugin button, and starter prompts for finding
   components, building a React screen, and reviewing accessibility contracts.
3. Lumen UI installation card: open Plugins in ChatGPT or Codex, find Lumen UI and select Install
   plugin, then mention @Lumen UI in a request. Example prompt: “Find the right Lumen components for
   an accessible React settings screen.” No separate Lumen account, API key, or local MCP setup.
