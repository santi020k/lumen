# Lumen launch media

These short, captioned videos are generated from Lumen-owned screenshots and Open Graph artwork.
They are designed as reusable source assets for launch posts rather than platform-specific uploads.

- `one-screen-three-web-targets.mp4` introduces the shared web product surface.
- `prompt-to-verified-ui.mp4` introduces the Agent Skill and contract-driven AI workflow.
- `figma-to-native-foundations.mp4` introduces the design-to-platform story.

Each campaign also has a `-vertical.mp4` export at 1080 × 1920 for short-form channels.

The first Instagram carousel lives under `instagram/lumen-introduction/`. Its five 1080 × 1080 PNG
cards combine Lumen's positioning with real native-playground captures. Regenerate them with:

```bash
node apps/docs/scripts/render-instagram-introduction.mjs
```

The ChatGPT and Codex plugin announcement lives under `instagram/lumen-plugin-launch/`, with three
1080 × 1080 PNGs and its public directory screenshot. Regenerate it with
`node apps/docs/scripts/render-instagram-plugin-launch.mjs`; publication copy and evidence live in
`docs/marketing/INSTAGRAM_PLUGIN_LAUNCH.md`.

Regenerate them from the repository root:

```bash
bash apps/docs/scripts/generate-launch-videos.sh
```

The generator requires FFmpeg. It creates temporary campaign cards through the existing Open Graph
artwork renderer, joins them into three 12-second landscape and three vertical videos, and removes
the temporary files.
Channel-specific scripts, captions, and campaign links live in
[`docs/exposure-playbook.md`](../../../../docs/exposure-playbook.md).

After the site and GitHub issue templates are deployed to the default branch, run the external
launch preflight from the repository root:

```bash
pnpm run check:exposure-launch
```
