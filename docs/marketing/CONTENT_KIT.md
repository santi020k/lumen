# Content kit

**Status: draft, reusable source material.** English-first. Every sentence here was checked against
`STRATEGY.md`'s claim ledger; do not add a claim that is not already recorded there.

English is the canonical source for every campaign and the primary language for publication. A
reviewed localization may be added later when a specific audience and channel justify it, but it
must remain a separate adaptation of the approved English source. Where Lumen's localization
support is relevant, use the exact approved sentence below rather than paraphrasing.

## Approved wording

**Positioning (use exactly, do not paraphrase):**

> Lumen is an open-source UI system that keeps accessible product interfaces consistent across
> web, native platforms, Figma, and AI-assisted development.

**Localization (use exactly when localization comes up; claim C-04):**

> Lumen ships English-first documentation and includes localization-ready primitives, including a
> `LanguageToggle` component with demonstrated English and Spanish defaults.

Never shorten this to "Lumen supports Spanish" or "available in English and Spanish."

**License and availability (claim C-03):**

> Lumen is free and MIT licensed, with no waiting list or account required to try it.

## Short descriptions

**One-line (≤ 100 characters):**
Open-source UI primitives for web, native, Figma, and AI-assisted development.

**Two-line:**
Lumen is an open-source UI system that keeps accessible product interfaces consistent across web,
native platforms, Figma, and AI-assisted development. Free and MIT licensed.

**Paragraph (bio/about fields, ≤ 500 characters):**
Lumen is an open-source UI system for developers, design-system engineers, and AI-assisted builders.
It ships 150+ accessible web primitives for Astro, React, and Web Components, shared native
foundations for React Native, SwiftUI, and Jetpack Compose, a public Figma library, and a portable
Agent Skill and MCP server. Free and MIT licensed.

## Message pillar one-liners

Reuse directly from `STRATEGY.md`'s message-pillar table; do not invent new pillars here.

- "One accessible product language across Astro, React, and Web Components."
- "Native foundations for React Native, SwiftUI, and Jetpack Compose — not just web."
- "A portable Agent Skill and MCP server give coding agents real component contracts instead of
  guesswork."
- "Free and MIT licensed, with no adoption gate."
- "Localization-ready primitives, including a demonstrated English/Spanish `LanguageToggle`
  default." *(always pair with the full approved sentence above, not this shorthand, in public copy)*
- "Dogfooded across the maintainer's own sibling projects before it reaches anyone else."

## Install snippets

Reuse verbatim from the root `README.md`; do not modify package names, flags, or import paths.

```bash
# Astro
pnpm add @santi020k/lumen-astro

# React
pnpm add @santi020k/lumen-react

# Web Components
pnpm add @santi020k/lumen-elements
```

```bash
npx skills add santi020k/lumen --skill lumen-ui
```

```bash
lumen add analytics-dashboard
lumen add commerce-dashboard --target react
lumen add auth-onboarding --target elements
```

## CTA and destination table

Reuses the conversion paths in [`docs/exposure-playbook.md`](../exposure-playbook.md). Always
append the UTM pattern documented there:

```text
?utm_source=<channel>&utm_medium=<format>&utm_campaign=<campaign>&utm_content=<asset>
```

| Audience intent | Destination |
| --- | --- |
| Wants to try Lumen | `/guides/ship-a-settings-screen` |
| Wants a working starting point | `/templates` |
| Uses an AI coding tool | `/docs/ai-skill` |
| Needs structured AI context | `/docs/mcp` |
| Built something | `/community` |
| Evaluating for a team | `/teams` |

Do not link to any route that is not confirmed live in the current `apps/docs/src/pages` tree.

## Hashtags

No hashtag set is defined. Do not invent trending or platform-specific hashtags. If a channel in
`CHANNELS.md` needs one, propose it there for Santiago's approval before use.

## Account bios

The approved Instagram account fields and English-first bio are in
[`INSTAGRAM_ACCOUNT_SETUP.md`](INSTAGRAM_ACCOUNT_SETUP.md). Do not reuse that bio for another
channel without checking its limits and audience. The live profile and first-post evidence are
recorded in [`INSTAGRAM_FIRST_POST.md`](INSTAGRAM_FIRST_POST.md); do not infer that any later queue
item is published from the account's live state.

## Personal LinkedIn adaptation

If Santiago approves using his existing personal LinkedIn profile, use the prepared drafts in
[`PERSONAL_LINKEDIN.md`](PERSONAL_LINKEDIN.md) rather than creating a Lumen company page. Each one
opens with the engineering problem, shows one real screen or workflow, describes one concrete
design decision, and ends with one CTA from the destination table. Keep the post in English;
mention the English/Spanish `LanguageToggle` default only when localization is the actual subject.

## Reply and outreach language

Community reply templates live in [`COMMUNITY_RESPONSE.md`](COMMUNITY_RESPONSE.md), not here, so
there is one place to keep them current with support and security-reporting routes.

## Visual asset references

Do not reference specific screenshot file paths from this kit; the playground screenshot sets change
frequently and are out of scope for this package (see the top-level task boundary). For static and
video asset specifications, use [`ASSET_BRIEFS.md`](ASSET_BRIEFS.md), which points to the existing
Open Graph image generator and the launch videos already committed under
`apps/docs/public/launch/`.
