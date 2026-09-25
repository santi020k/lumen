# Publishing queue

**Status: active. Published rows include their live evidence.** This file is the single gate between a drafted
[`CONTENT_CALENDAR.md`](CONTENT_CALENDAR.md) row or [`apps/docs/public/launch/CAMPAIGNS.md`](../../apps/docs/public/launch/CAMPAIGNS.md)
entry and any real, external action. Nothing in this repository publishes, schedules, or posts
automatically; every "Approved" row still requires a human to manually perform the external action
and then record it here.

## Approval workflow

1. Draft the copy in `CONTENT_KIT.md` or the calendar row, using only claim ledger IDs from
   [`STRATEGY.md`](STRATEGY.md#claim-ledger).
2. Verify the destination route is live in `apps/docs/src/pages` and the CTA matches
   `CONTENT_KIT.md`'s destination table.
3. Verify any readiness gate the copy touches against [`README.md`](README.md#readiness-gates).
4. Santiago reviews the exact copy, asset, and destination, then records a dated decision in the
   table below. Only Santiago may change a row's status to "Approved."
5. After the external action happens outside this repository, update the row to "Published" with the
   real, checkable URL or post ID. Never mark a row "Published" without one.

| Status | Meaning |
| --- | --- |
| Draft — needs approval | Copy and asset exist; no review has happened |
| Approved — not yet posted | Santiago approved the exact copy/asset/destination; the external action has not happened yet |
| Published | The external action happened; the URL or post ID is recorded |
| Held | Blocked on a readiness gate, route, or asset; reason recorded |

## Queue

| Item | Channel | Source | Copy / asset | Status | Santiago decision | Published URL |
| --- | --- | --- | --- | --- | --- | --- |
| Week 1 guide share | Community post (framework-specific, Lumen does not own) | `CONTENT_CALENDAR.md` Week 1 | Guide URL + community-appropriate framing | Draft — needs approval | — | — |
| Week 1 personal LinkedIn note | Santiago's personal LinkedIn profile | `PERSONAL_LINKEDIN.md` Week 1 | Engineering problem + one accessibility decision + guide CTA | Draft — needs approval | — | — |
| Week 2 implementation comparison | Community post | `CONTENT_CALENDAR.md` Week 2 | Framework-native differences + `one-screen-three-web-targets.mp4` | Draft — needs approval | — | — |
| Week 2 personal LinkedIn note | Santiago's personal LinkedIn profile | `PERSONAL_LINKEDIN.md` Week 2 | Shared contracts versus framework-native syntax | Draft — needs approval | — | — |
| Week 3 AI workflow | AI-tooling community | `CONTENT_CALENDAR.md` Week 3 | `prompt-to-verified-ui.mp4` + exact prompt/verification | Draft — needs approval | — | — |
| Week 3 personal LinkedIn note | Santiago's personal LinkedIn profile | `PERSONAL_LINKEDIN.md` Week 3 | Skill/MCP workflow + exact verification step | Draft — needs approval | — | — |
| Week 4 community proof | Documentation site / `/community` | `CONTENT_CALENDAR.md` Week 4 | Confirmed showcase entry + adoption-feedback invite | Draft — needs approval | — | — |
| Week 4 personal LinkedIn note | Santiago's personal LinkedIn profile | `PERSONAL_LINKEDIN.md` Week 4 | Verified adoption lesson + resulting change; placeholders must be replaced | Draft — needs approval | — | — |
| Instagram logo introduction | `@lumenui.dev` | `INSTAGRAM_FIRST_POST.md` | Existing logo image, published caption, and custom alt text | Published | Santiago requested account configuration and the first post on 2026-09-03 | `https://www.instagram.com/p/Dc1ufqClEkM/` |
| Instagram introduction carousel | `@lumenui.dev` | `INSTAGRAM_INTRO_CAROUSEL.md` | Five final PNG frames, exact caption, per-image alt text, and guide CTA | Published | Santiago explicitly confirmed publication on 2026-09-03 | `https://www.instagram.com/p/Dc11vZ0keP9/` |
| Instagram ChatGPT plugin launch | `@lumenui.dev` | `INSTAGRAM_PLUGIN_LAUNCH.md` | Three-slide announcement, verified directory listing, installation steps, caption, and per-image alt text | Published | Santiago requested an Instagram announcement of the published plugin on 2026-09-08 | `https://www.instagram.com/p/DdA_qByERTO/` |
| Instagram settings-screen carousel | Instagram product account | `INSTAGRAM_ACCOUNT_SETUP.md` first profile set | Real screen, focus and validation states, caption, alt text | Held — profile website link not yet active | — | — |
| Instagram web-targets Reel | Instagram product account | `one-screen-three-web-targets-vertical.mp4` | Final caption, cover, alt text, and guide CTA | Held — profile website link not yet active | — | — |
| Instagram AI-workflow Reel | Instagram product account | `prompt-to-verified-ui-vertical.mp4` | Final caption, cover, transcript, and AI-skill CTA | Held — profile website link not yet active | — | — |
| Instagram localization carousel | Instagram product account | `INSTAGRAM_ACCOUNT_SETUP.md` first profile set | English-first copy with exact C-04 boundary | Held — profile website link not yet active | — | — |
| Hacker News (Show HN) | Hacker News | `CAMPAIGNS.md` | Personally written by Santiago; factual checklist only, no generated prose | Held — HN prohibits AI-authored text; Santiago must write the final title and comment himself | — | — |
| Product Hunt | Product Hunt | `CAMPAIGNS.md` | Tagline, gallery order, maker comment | Draft — needs approval | — | — |
| Reddit framework posts | Reddit (r/astrojs, r/reactjs, r/webdev, design-system communities) | `CHANNELS.md` earned channels | One factual post per community, spaced apart | Draft — needs approval | — | — |

Add a row before drafting any new content item; an item that does not map to a row here or to a
channel listed in `CHANNELS.md` does not get produced under this package.

## Explicit non-automation gate

This queue intentionally has no scheduling integration, API credential, or vendor connection. Do not
add one without Santiago's separate, explicit approval — see
[`STRATEGY.md`](STRATEGY.md#decision-boundaries-requiring-santiagos-approval). Recording a row here
is documentation of intent, not permission to execute it.
