# Community response and moderation

**Status: draft.** These are prepared answers for comments, issues, and community threads once any
item in [`PUBLISHING_QUEUE.md`](PUBLISHING_QUEUE.md) goes live. Every answer must stay inside the
claim ledger boundaries in [`STRATEGY.md`](STRATEGY.md#claim-ledger); do not improvise a stronger
claim under social pressure to sound impressive or to close an argument.

## Moderation rules

- Respond within one business day where feasible; move anything that needs code changes, reproduction
  steps, or a real bug report to a GitHub issue instead of resolving it in the reply thread.
- Disclose maintainer status plainly ("I maintain Lumen") rather than posing as a neutral third party.
- Never ask for votes or coordinated engagement, and never coordinate replies across
  accounts.
- Do not argue a claim past what the ledger supports. If a commenter is right that something is
  incomplete, say so and link the relevant readiness gate instead of defending the claim.
- Route a suspected security or vulnerability report to
  [`SECURITY.md`](../../SECURITY.md)'s private reporting channel; never discuss a suspected
  vulnerability's details in a public reply.
- Route general bugs, accessibility defects, and documentation gaps to
  `https://github.com/santi020k/lumen/issues/new/choose`, matching `apps/docs/src/pages/support.astro`.
- Leave a community and do not post again if a moderator removes a post; do not message members privately
  to route around moderation.

## Reply library

**"Is this actually production-ready, or just a demo?"**

> The web packages (Astro, React, Web Components) are published and stable. The native foundations
> for React Native, SwiftUI, and Jetpack Compose are also published in the stable Lumen 2 line, but
> real-consumer and physical-device validation remain open post-release qualification work — see
> [`docs/lumen-2-readiness.md`](../lumen-2-readiness.md) for the exact ledger.

**"Does Lumen support Spanish / other languages?"**

> Lumen ships English-first documentation and includes localization-ready primitives, including a
> `LanguageToggle` component with demonstrated English and Spanish defaults. The documentation site
> and packages are not fully translated.

**"Is this on the ChatGPT / OpenAI Plugins Directory?"**

> Yes. Lumen UI 1.0.0 is published in the Plugins Directory for ChatGPT and Codex. Open Plugins,
> search for Lumen UI, and select Install plugin. It bundles the workflow skill and hosted,
> read-only catalog, with no separate Lumen account or local MCP setup.

Verified [directory listing](https://chatgpt.com/plugins/plugin_asdk_app_6a8f6c526c5481918eb8a48806fa112b),
published on 2026-09-08 (claim C-12).

**"Can I get this on Google Play / is the Android app out?"**

> Google Play rejected the latest Compose playground submission because its screenshots did not
> match the reviewed app experience. A corrected resubmission is pending, so it isn't publicly
> listed yet. You can build and install the debug APK directly from the repository in the meantime.

**"Who actually uses this in production? Any customers?"**

> Lumen is dogfooded across the maintainer's own sibling projects and has a small public showcase.
> Those are the maintainer's own products, not paying customers — there's no verified customer list
> or user count to share.

**"Why is this free? What's the catch?"**

> Lumen is free and MIT licensed with no waiting list or account required, while the project focuses
> on adoption and real-world feedback. There's no paid tier planned unless repeated requests cluster
> around a clear outcome like private catalogs or guaranteed support.

**"This looks similar to [other UI library] — why would I switch?"**

> Redirect to a factual, sourced comparison only if one can be made from public documentation; do not
> disparage the other project. If no sourced comparison exists, answer with what Lumen's shared
> contract actually offers (tokens, accessibility behavior, and native foundations across
> frameworks) rather than a head-to-head claim.

**"Can I contribute / report a bug?"**

> Yes — open an issue at `https://github.com/santi020k/lumen/issues/new/choose`, or read
> `CONTRIBUTING.md` before a pull request. User-visible package changes need a changeset.

## Escalation

| Situation | Route |
| --- | --- |
| Suspected security vulnerability | `SECURITY.md` private advisory or `support@santi020k.com`; never discuss publicly |
| Reproducible bug, accessibility defect, or documentation gap | GitHub issue via `support.astro`'s intake |
| A claim in this package turns out to be stale or wrong | Correct the claim ledger entry in `STRATEGY.md` first, then correct any live copy |
| Hostile, off-topic, or bad-faith engagement | Disengage; do not escalate the tone. Report platform abuse through that platform's own tools if needed |
| A commenter shares a private/sensitive detail unrelated to Lumen | Do not quote or repeat it; redirect to the appropriate support channel |

## What this file does not cover

The Instagram account is live at `https://www.instagram.com/lumenui.dev/`. Its first post is
published, but the clickable website link is not yet active. Keep security and moderation aligned
with [`INSTAGRAM_ACCOUNT_SETUP.md`](INSTAGRAM_ACCOUNT_SETUP.md), answer ordinary public questions
using the same evidence boundaries as GitHub, and move technical support to the public support route
rather than collecting repository, account, customer, or security details in direct messages.
