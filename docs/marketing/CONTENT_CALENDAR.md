# Four-week content calendar

**Status: draft template, not scheduled.** Days are relative to a chosen cycle start (Week 1 Day 1),
not bound to real calendar dates, because no launch date has been approved. Every row's status
starts at "Draft — needs approval" and may only change after Santiago approves it in
[`PUBLISHING_QUEUE.md`](PUBLISHING_QUEUE.md).

This calendar repeats the four-week cycle from
[`docs/exposure-playbook.md`](../exposure-playbook.md) with concrete per-channel rows. Use a
different real product problem each cycle; do not reuse the same guide topic twice in a row.

## Week 1: useful guide

| Day | Channel | Format | Topic | CTA / destination | Status |
| --- | --- | --- | --- | --- | --- |
| Day 1 | Documentation site | Guide | Publish one task-oriented guide with a working screen and an accessibility checklist | `/guides/<new-guide-slug>` | Draft — needs approval |
| Day 2 | Astro/React/Web Components communities Lumen does not own | Community post | Share the guide with a community-appropriate framing (see `CHANNELS.md`) | Guide URL + UTM | Draft — needs approval |
| Day 3 | Santiago's personal LinkedIn profile, if approved | Maker post | The Week 1 draft in `PERSONAL_LINKEDIN.md`: product problem plus one accessibility decision | Guide URL + UTM | Draft — needs approval |
| Day 4 | GitHub | Release note or discussion | Link the guide from the relevant issue threads or discussions, if any exist | GitHub | Draft — needs approval |
| Day 5 | Instagram | Carousel | Introduction or settings-screen guide, using real UI and an accessibility detail | Canonical domain in caption | Published — `https://www.instagram.com/p/Dc11vZ0keP9/` |

## Week 2: implementation comparison

| Day | Channel | Format | Topic | CTA / destination | Status |
| --- | --- | --- | --- | --- | --- |
| Day 8 | Documentation site | Comparison guide or updated guide section | Same bounded workflow shown in Astro, React, and Web Components | Matching framework guide + `/templates` | Draft — needs approval |
| Day 9 | Framework-specific community | Community post | Framework-native differences, not identical syntax | Framework guide + UTM | Draft — needs approval |
| Day 10 | Santiago's personal LinkedIn profile, if approved | Engineering note | The Week 2 draft in `PERSONAL_LINKEDIN.md`: shared contracts versus framework-native syntax | `/guides/ship-a-settings-screen` + UTM | Draft — needs approval |
| Day 11 | Documentation site | Short video embed | `one-screen-three-web-targets.mp4` (already produced; see `ASSET_BRIEFS.md`) | Guide URL | Draft — needs approval |
| Day 12 | Instagram | Reel | Vertical one-screen, three-web-targets comparison | `/guides/ship-a-settings-screen` + UTM | Held — profile website link not yet active |

## Week 3: design and AI workflow

| Day | Channel | Format | Topic | CTA / destination | Status |
| --- | --- | --- | --- | --- | --- |
| Day 15 | Documentation site | Guide or demo | Matching Figma tokens or component contract | `/docs/figma` | Draft — needs approval |
| Day 16 | Documentation site | Guide | AI agent using the Lumen skill and MCP server, with the exact prompt and verification step shown | `/docs/ai-skill`, `/docs/mcp` | Draft — needs approval |
| Day 17 | Santiago's personal LinkedIn profile, if approved | Build note | The Week 3 draft in `PERSONAL_LINKEDIN.md`: reducing invented component APIs | `/docs/ai-skill` + UTM | Draft — needs approval |
| Day 18 | AI-tooling community Lumen does not own | Community post | `prompt-to-verified-ui.mp4` (already produced; see `ASSET_BRIEFS.md`) | `/docs/mcp` + UTM | Draft — needs approval |
| Day 19 | Instagram | Reel | Vertical prompt-to-verified-UI workflow with captions | `/docs/ai-skill` + UTM | Held — profile website link not yet active |

## Week 4: community proof

| Day | Channel | Format | Topic | CTA / destination | Status |
| --- | --- | --- | --- | --- | --- |
| Day 22 | Documentation site / community page | Feature | One public showcase project or contributor (source only from confirmed `/community` entries or new approved showcase submissions) | `/community` | Draft — needs approval |
| Day 23 | GitHub | Issue/changelog | Summarize one adoption lesson and the resulting documentation or component fix | GitHub changelog | Draft — needs approval |
| Day 24 | Santiago's personal LinkedIn profile, if approved | Learning note | Complete the Week 4 template in `PERSONAL_LINKEDIN.md` with one verified adoption lesson | `/community` + UTM | Draft — needs approval |
| Day 25 | Documentation site | Prompt | Invite showcase submissions and adoption feedback | `/community`, adoption-feedback issue template | Draft — needs approval |
| Day 26 | Instagram | Carousel | Localization boundary: English-first docs and the verified EN/ES `LanguageToggle` example | `/docs/components/language-toggle` + UTM | Held — profile website link not yet active |

## Rules for every row

- One canonical URL per topic; adapt the introduction per community instead of duplicating the full
  article (per `docs/exposure-playbook.md`).
- Never mark a row "Published" without a real, checkable URL or post ID in
  `PUBLISHING_QUEUE.md`.
- Do not schedule the same topic on two channels the same day.
- Every CTA must come from the destination table in `CONTENT_KIT.md`.
- All copy is English-first. A Spanish-language adaptation requires a reviewed English source plus
  an explicit audience, reviewer, and channel decision recorded in `PUBLISHING_QUEUE.md`.
