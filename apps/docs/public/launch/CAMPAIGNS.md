# Lumen campaign manifest

Use this manifest when publishing Lumen's first adoption campaign. Every destination is tagged so
channel traffic can be separated without changing the canonical page.

## Shared positioning

**One-line description:** Lumen is an open-source UI system that keeps accessible product
interfaces consistent across web, native platforms, Figma, and AI-assisted development.

**Availability:** Free, open source, and MIT licensed. No waiting list or email gate.

**Primary proof:** More than 150 public primitives, five installable product template families,
three web targets, native foundations, a public Figma library, an Agent Skill, and an MCP catalog.

## Hacker News

**Destination:**
`https://lumen.santi020k.com/?utm_source=hacker_news&utm_medium=community&utm_campaign=open_source_launch&utm_content=show_hn`

**Asset:** `one-screen-three-web-targets.mp4`

Hacker News explicitly asks contributors not to post generated or AI-edited text. The maker must
write the final title and opening comment personally. Use these facts as a checklist rather than
copying launch prose:

- Lumen can be installed and tried without an account.
- Astro is the reference implementation and uses progressive enhancement.
- React uses framework-native components and behavior hooks.
- Elements uses registered custom elements and standards-based form behavior.
- Semantic tokens generate native foundations for React Native, SwiftUI, and Compose.
- The MCP server ships a deterministic component catalog so agents can retrieve real contracts.
- The most useful feedback areas are API ergonomics, accessibility behavior, and adoption friction.

Review the current [Show HN guidelines](https://news.ycombinator.com/showhn.html) immediately before
submitting. Do not ask anyone to vote or comment.

## Product Hunt

**Name:** Lumen UI

**Tagline:** One accessible product language across code, Figma, and AI.

**Description:** Open-source UI primitives, installable product experiences, native foundations,
Figma resources, and contract-aware AI tooling for teams that ship across platforms.

**Destination:**
`https://lumen.santi020k.com/?utm_source=product_hunt&utm_medium=launch&utm_campaign=open_source_launch&utm_content=product_page`

**Gallery order:**

1. `templates.webp`
2. `one-screen-three-web-targets.mp4`
3. `prompt-to-verified-ui.mp4`
4. `figma-to-native-foundations.mp4`

**Maker comment:**

I built Lumen because consistency across frameworks often means either giving up native authoring
or maintaining several disconnected systems. Lumen takes a different approach: shared semantic
roles and behavior contracts, with framework-native components for Astro, React, Web Components,
React Native, SwiftUI, and Jetpack Compose.

The project also publishes its Figma resources, Agent Skill, and MCP catalog so design handoff and
AI-assisted implementation can use the same real contracts as the code. Everything is free and MIT
licensed while I focus on adoption and real-world feedback.

If you try it, I would especially value feedback about installation, component API clarity,
accessibility behavior, and the cross-platform story.

Product Hunt's current guidelines do not feature template-only products, so launch Lumen as the
working design-system product—not as a template collection. A personal account at least one week
old is required, and the final launch must be scheduled from a draft.

## Reddit

Read each community's current rules immediately before posting. Reddit recommends factual titles,
original sources, appropriate communities, and restrained self-promotion.

### Astro community

**Suggested factual title:** Lumen UI now has 150+ accessible Astro primitives with standalone CSS
and progressive enhancement

**Destination:**
`https://lumen.santi020k.com/docs/frameworks/astro?utm_source=reddit&utm_medium=community&utm_campaign=open_source_launch&utm_content=astro`

**Body focus:** Explain the single stylesheet, one `UIPrimitives` mount, accessible keyboard paths,
and installable product recipes. Disclose that you maintain the project and ask for Astro-specific
API feedback.

### React community

**Suggested factual title:** An open-source React UI system with shared tokens, behavior hooks, and
cross-platform foundations

**Destination:**
`https://lumen.santi020k.com/docs/frameworks/react?utm_source=reddit&utm_medium=community&utm_campaign=open_source_launch&utm_content=react`

**Body focus:** Explain the separation between visual components and behavior hooks, then link to a
specific settings or form guide. Avoid claiming drop-in parity with Astro when framework behavior
is intentionally native.

### Web development community

**Suggested factual title:** I built an MIT-licensed UI system spanning Astro, React, Web
Components, Figma, and native foundations

**Destination:**
`https://lumen.santi020k.com/guides/ship-a-settings-screen?utm_source=reddit&utm_medium=community&utm_campaign=open_source_launch&utm_content=settings_guide`

**Body focus:** Lead with the architectural tradeoff and the working evaluation guide. Invite
criticism about package boundaries and accessibility contracts instead of asking for stars.

## Framework communities

Use `one-screen-three-web-targets.mp4` for long-form posts and
`one-screen-three-web-targets-vertical.mp4` for short-form feeds.

| Audience | Destination | Conversation starter |
| --- | --- | --- |
| Astro | `/docs/frameworks/astro` | Where should progressive enhancement stop and app state begin? |
| React | `/docs/frameworks/react` | Which behavior hooks are most valuable to keep separate from presentation? |
| Web Components | `/docs/frameworks/elements` | Which form-associated controls need the deepest interoperability testing? |
| Design systems | `/docs/figma` | Which semantic roles are hardest to preserve across design and native platforms? |
| AI tooling | `/docs/mcp` | What component metadata most reliably prevents invented APIs? |

Append these campaign parameters to the destination:

```text
?utm_source=<community>&utm_medium=community&utm_campaign=open_source_launch&utm_content=<topic>
```

## Video assets and alt text

| Asset | Format | Alt text |
| --- | --- | --- |
| `one-screen-three-web-targets.mp4` | 1280 × 720 | Three caption cards introduce one accessible product surface across Astro, React, and Web Components, ending with Lumen's free MIT license. |
| `one-screen-three-web-targets-vertical.mp4` | 1080 × 1920 | Vertical caption cards introduce Lumen's shared web component system across Astro, React, and Web Components. |
| `prompt-to-verified-ui.mp4` | 1280 × 720 | Caption cards move from product intent through real component contracts to verified accessible UI. |
| `prompt-to-verified-ui-vertical.mp4` | 1080 × 1920 | Vertical caption cards describe Lumen's Agent Skill and MCP-assisted implementation workflow. |
| `figma-to-native-foundations.mp4` | 1280 × 720 | Caption cards connect Figma variables and semantic product roles to native platform behavior. |
| `figma-to-native-foundations-vertical.mp4` | 1080 × 1920 | Vertical caption cards connect the public Figma library with web and native foundations. |

## Preflight

- Confirm the production site serves `/community`, `/teams`, `/guides`, and every linked framework
  page before submitting anything.
- Confirm the GitHub showcase and adoption-feedback templates are available on the default branch.
- Verify the personal Product Hunt account is eligible to create a draft.
- Read the current rules of every subreddit or community on the day of posting.
- Never ask for votes, coordinated comments, or artificial engagement.
- Be available to answer technical questions after each post goes live.
