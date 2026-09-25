# Channel roles and priorities

**Status: draft.** No account listed below exists unless marked "Live." Creating any new account
requires Santiago's explicit approval per [`STRATEGY.md`](STRATEGY.md#decision-boundaries-requiring-santiagos-approval).

## Owned channels (primary)

| Channel | Role | Priority | Current state |
| --- | --- | --- | --- |
| Documentation site (`lumen.santi020k.com`) | Canonical destination for every campaign; hosts guides, templates, community, and teams pages | Primary | Live |
| GitHub repository (`santi020k/lumen`) | Source of truth, issues, releases, showcase and adoption-feedback intake | Primary | Live |
| `llms.txt`, `docs/ai-usage.md`, MCP server | Machine-readable surfaces for AI-assisted builders | Primary | Live |
| Figma Community library | Design-system audience entry point | Primary | Live |
| Instagram product account (`@lumenui.dev`) | Visual explanations of real interfaces, cross-framework comparisons, Figma, native foundations, and AI workflows | Secondary | Live; Business account configured and first two posts published; website link and owner-controlled 2FA remain |

These four already exist and require no new account creation. Every campaign should drive traffic
here first; see the conversion-path table in [`docs/exposure-playbook.md`](../exposure-playbook.md).

## Earned/community channels (secondary)

These are one-time or occasional submissions to communities Lumen does not own. Draft copy for each
lives in [`apps/docs/public/launch/CAMPAIGNS.md`](../../apps/docs/public/launch/CAMPAIGNS.md); this
file only defines role and priority. No submission is recorded in this repository as of 2026-09-03.

| Channel | Role | Priority | Cadence |
| --- | --- | --- | --- |
| Hacker News (Show HN) | One-time credibility launch to a technical audience | Secondary | Single post; personally written by Santiago per HN's no-AI-text rule |
| Product Hunt | Structured launch listing with gallery assets | Secondary | Single scheduled launch |
| Santiago's personal LinkedIn profile | English-first maker and engineering notes that connect Lumen decisions to product-team outcomes | Secondary | At most one post per week during an approved cycle; do not create a company page |
| Reddit (r/astrojs, r/reactjs, r/webdev, design-system communities) | Factual, framework-specific posts linking to the matching guide | Secondary | Opportunistic, one post per community, spaced apart |
| Astro/React/Web Components/design-system forums and Discords Lumen does not own | Participate in existing conversations; do not create a Lumen-branded presence there | Secondary | Ongoing, reactive only |

Read each community's current rules immediately before posting. Disclose maintainer status. Never
ask for votes, coordinated engagement, or artificial comments.

## Deferred channels

No account exists for any of these. Do not create one without Santiago's approval, and do not
imply an account exists in any draft copy.

| Channel | Launch decision | Reason | Reconsider when |
| --- | --- | --- | --- |
| Dedicated X/Twitter account | Not created | No owned channel currently under-serves this audience; GitHub and the docs site already reach developers | Adoption-feedback responses or showcase submissions repeatedly reference wanting a Lumen presence there |
| LinkedIn company page | Not created | Product-team audience is already served by `/teams` and GitHub issues | A product team explicitly asks for a LinkedIn presence during evaluation |
| YouTube channel | Not created | Existing launch videos are distributed as source assets embedded in other channels, not a standalone channel | Video content volume grows enough to need a dedicated archive and search surface |
| Discord server | Not created | GitHub issues and discussions already carry support and feedback; a server adds moderation overhead with no current volume justifying it | Issue volume or community size clearly outgrows GitHub's async model |

## Channel selection rule

Every new content item must map to one row above before it is drafted. If a piece of content does
not fit an owned or earned channel, it does not get produced under this package; propose adding a
row here first, with Santiago's approval, per [`STRATEGY.md`](STRATEGY.md).

The Instagram identity and setup fields are defined in
[`INSTAGRAM_ACCOUNT_SETUP.md`](INSTAGRAM_ACCOUNT_SETUP.md). Do not mark the channel Live until Meta
has accepted the username and the public profile URL has been verified.
