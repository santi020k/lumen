# Lumen marketing package

**Status: active package.** The `@lumenui.dev` Instagram profile and plugin-launch announcement are
live; consult `PUBLISHING_QUEUE.md` for each item's publication evidence. Other drafts require
their own approval. Claims were first checked on 2026-09-03; the plugin listing and announcement
were verified on 2026-09-08. Re-verify before reusing any sentence publicly
— package versions, playground store status, and readiness gates change frequently in this
repository.

This package makes [`docs/exposure-playbook.md`](../exposure-playbook.md) execution-ready. The
playbook stays canonical for the positioning statement, four-week cycle definition, metrics
categories, video scripts, and community operating loop. This package turns that into exact copy,
channel decisions, a concrete calendar, asset specifications, an approval queue, a reply library, and
a measurement cadence — adapted for developers, design-system engineers, AI-assisted builders, and
product teams evaluating Lumen.

## Start here

1. [`STRATEGY.md`](STRATEGY.md) — canonical positioning, audiences, message pillars, the claim
   ledger every public sentence must trace to, and the actions that require Santiago's explicit
   approval before execution.
2. [`CHANNELS.md`](CHANNELS.md) — which channels exist today, which are earned/one-time, and which
   are deliberately deferred. No new account exists unless this file says "Live."
3. [`CONTENT_KIT.md`](CONTENT_KIT.md) — reusable English-first copy: descriptions, pillar one-liners,
   install snippets, and the CTA/destination table.
4. [`CONTENT_CALENDAR.md`](CONTENT_CALENDAR.md) — the four-week cycle broken into per-channel rows
   with topics and CTAs. Every row starts as "Draft — needs approval."
5. [`ASSET_BRIEFS.md`](ASSET_BRIEFS.md) — accessible, crop-safe specifications for the images and
   videos the calendar references, all reusing assets already committed under
   `apps/docs/public/launch/` and the existing Open Graph generator.
6. [`PERSONAL_LINKEDIN.md`](PERSONAL_LINKEDIN.md) — English-first weekly maker-post drafts and an
   evergreen localization note for Santiago's personal profile; no company page is proposed.
7. [`INSTAGRAM_ACCOUNT_SETUP.md`](INSTAGRAM_ACCOUNT_SETUP.md) — the owner-ready Instagram identity,
   security and moderation defaults, and first-profile content set.
8. [`INSTAGRAM_FIRST_POST.md`](INSTAGRAM_FIRST_POST.md) — the verified first-post permalink, exact
   published caption, and alternative text.
9. [`INSTAGRAM_INTRO_CAROUSEL.md`](INSTAGRAM_INTRO_CAROUSEL.md) — the five-slide follow-up carousel,
   exact caption, and per-image alternative text.
   [`INSTAGRAM_PLUGIN_LAUNCH.md`](INSTAGRAM_PLUGIN_LAUNCH.md) records the ChatGPT and Codex plugin
   announcement, directory evidence, three-slide carousel, caption, and alternative text.
10. [`PUBLISHING_QUEUE.md`](PUBLISHING_QUEUE.md) — the single approval gate between a drafted
   calendar row and any real, external publication.
11. [`COMMUNITY_RESPONSE.md`](COMMUNITY_RESPONSE.md) — reply templates and moderation rules for
   comments, issues, and community threads, kept consistent with the claim ledger.
12. [`MEASUREMENT.md`](MEASUREMENT.md) — the metrics this package tracks and the monthly review
   routine, reusing the categories already defined in the exposure playbook.

## Readiness gates

Treat every gate below as it is recorded in the repository right now. Do not round a "Conditional"
or "Blocked" state up to a plain claim in any draft.

| Surface | Current state | Source | What copy may say |
| --- | --- | --- | --- |
| Lumen 2 coordinated release | Complete (2026-08-28) for package publication; real-consumer and physical-device validation remain post-release qualification work | [`docs/lumen-2-readiness.md`](../lumen-2-readiness.md) readiness ledger | State the coordinated release as complete, always paired with the open post-release qualification note (claim C-10). |
| React Native / SwiftUI / Compose native foundations | Stable and published; not yet proven on physical devices or in external consumer apps | [`docs/lumen-2-readiness.md`](../lumen-2-readiness.md) | Use claim C-02's exact boundary sentence every time. |
| Apple playground | Live on the App Store | Root `README.md` "Native playgrounds" section | May state as available (claim C-11), Apple only. |
| Android playground | Production rollout submitted to Google Play review; not publicly listed | [`docs/playground-publication.md`](../playground-publication.md) Android production record | May say production access was granted and the rollout was submitted (claim C-14). Never say it is available on Google Play until the public listing is verified. |
| React Native playground | Distributed through Expo/TestFlight/APK profiles, not a public store listing | Root `README.md` "Native playgrounds" section | Do not imply a public store listing exists. |
| OpenAI Plugins Directory | Lumen UI 1.0.0 published on 2026-09-08; public Install plugin button verified | [`docs/openai-plugin-submission.md`](../openai-plugin-submission.md) | May say available in ChatGPT and Codex (claim C-12); use the verified directory URL or directory-search installation steps. |
| Localization | Only `LanguageToggle` has a demonstrated English/Spanish default; the docs site and packages are not fully translated | `packages/core/src/language.ts`, `packages/astro/components/LanguageToggle.astro`, live `/docs/components/language-toggle` route | Use claim C-04's exact approved sentence in `CONTENT_KIT.md`. |
| Owned social/community accounts | `@lumenui.dev` is live on Instagram and its first two posts are published. The clickable website and owner-controlled two-factor authentication remain mobile/Accounts Center tasks. The docs site, GitHub repository, Figma Community library, and machine-readable AI surfaces are also current owned channels. | [`CHANNELS.md`](CHANNELS.md) | Use the canonical profile and published-post URLs. Personal-profile use remains a separately approved publishing action. |
| Analytics and email vendors | `PUBLIC_EXPOSURE_ANALYTICS_ENDPOINT` and `PUBLIC_NEWSLETTER_FORM_ACTION` are unset in this package's scope | [`docs/exposure-playbook.md`](../exposure-playbook.md) | Do not describe analytics tracking or an email list as active. |

## What this package does not do

Per the task boundary this package was built under, nothing in `docs/marketing/` by itself may be
used to:

- publish, schedule, or post to any external platform;
- create another social account, handle, or community server beyond the owner-created Instagram
  profile approved on 2026-09-03;
- send outreach messages to any person, company, or moderator;
- add or enable an analytics or email vendor; or
- deploy, commit, or otherwise change state outside this documentation.

Every draft is labeled and every execution step requires Santiago's explicit, dated approval,
recorded in [`PUBLISHING_QUEUE.md`](PUBLISHING_QUEUE.md). See
[`STRATEGY.md`](STRATEGY.md#decision-boundaries-requiring-santiagos-approval) for the full list of
decision boundaries.
