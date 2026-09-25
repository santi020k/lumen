# Personal LinkedIn drafts

**Status: draft only; nothing has been approved, scheduled, or published.** Use Santiago's existing
personal profile only if he approves the exact post and asset in
[`PUBLISHING_QUEUE.md`](PUBLISHING_QUEUE.md). Do not create a Lumen company page for this cycle.

These posts are English-first and written for developers, design-system engineers, AI-assisted
builders, and product teams. Use at most one per week. Replace every bracketed field, recheck the
linked claim IDs in [`STRATEGY.md`](STRATEGY.md#claim-ledger), and verify the destination immediately
before publishing.

## Week 1 — useful guide

**Asset:** the guide's current 1200 × 630 Open Graph image.

> A design system becomes useful when it helps someone finish a real product workflow—not when its
> component count gets larger.
>
> I built this Lumen guide around an accessible settings screen: responsive structure, validation,
> keyboard focus, and the states that are easy to miss when a demo only shows the happy path.
>
> The guide is runnable and Lumen remains free and MIT licensed.
>
> Try the workflow: https://lumen.santi020k.com/guides/ship-a-settings-screen
>
> I would value specific feedback on the component API, keyboard path, and anything that still makes
> adoption harder than it should be.

Claims: C-03. Add a framework claim only after matching it to C-01.

## Week 2 — one screen, three web targets

**Asset:** `apps/docs/public/launch/one-screen-three-web-targets.mp4`.

> Consistency across frameworks should not require pretending every framework is the same.
>
> Lumen uses shared semantic tokens and component contracts across Astro, React, and Web Components,
> while keeping each implementation native to its rendering model. Astro uses progressive
> enhancement, React exposes framework-native components and behavior hooks, and Elements uses
> standards-based custom elements.
>
> The same bounded settings workflow makes the tradeoffs visible:
> https://lumen.santi020k.com/guides/ship-a-settings-screen
>
> If you maintain more than one frontend stack, which behavior is hardest for your team to keep
> consistent?

Claims: C-01. Check the destination before approval.

## Week 3 — AI workflow with real contracts

**Asset:** `apps/docs/public/launch/prompt-to-verified-ui.mp4`.

> AI-generated UI gets unreliable when the agent has to guess which components, props, and tokens
> exist.
>
> Lumen publishes a portable Agent Skill and an MCP catalog so an agent can retrieve the current
> component contract before it writes code. The workflow still ends with ordinary verification:
> type checking, tests, linting, and a rendered accessibility pass.
>
> Start with the skill: https://lumen.santi020k.com/docs/ai-skill
>
> Explore the MCP catalog: https://lumen.santi020k.com/docs/mcp
>
> I am especially interested in which metadata helps your coding agent avoid invented APIs.

Claims: C-05. Claim C-12 also supports the published ChatGPT and Codex plugin as of 2026-09-08;
verify its directory listing again before adapting this draft. This LinkedIn post remains unpublished.

## Week 4 — verified adoption lesson

**Asset:** a real product screen approved for public reuse, with permission recorded in the queue.

Do not publish this template with placeholders.

> Using Lumen in **[VERIFIED MAINTAINER-OWNED PROJECT]** exposed a concrete gap:
> **[ONE OBSERVED ADOPTION PROBLEM]**.
>
> The fix was **[ONE VERIFIED LUMEN CHANGE]**. That change is now documented and covered by
> **[TEST OR CHECK]**, so the lesson is reusable instead of staying as project-specific knowledge.
>
> See the public example: **[APPROVED URL]**
>
> If your team is evaluating a shared UI system, the open adoption path is here:
> https://lumen.santi020k.com/teams

Claims: C-08 and, only for an existing public showcase entry, C-09. Describe the example as a
maintainer-owned product, never as a customer or testimonial.

## Evergreen localization note

Use this outside the four-week cycle only when localization is the actual topic of the conversation.

> Lumen's documentation is English-first, while its primitives are designed to let applications own
> their locale and translated content. `LanguageToggle` demonstrates that boundary with English and
> Spanish defaults; the application still owns its localization provider, persistence, and copy.
>
> That distinction matters: a component library can make localized interaction easier without
> claiming that every consuming product or documentation page is translated.
>
> Component example: https://lumen.santi020k.com/docs/components/language-toggle

Claims: C-04. Keep the approved boundary sentence from [`CONTENT_KIT.md`](CONTENT_KIT.md) in the
final reviewed version.

## Approval card

| Check | Required evidence |
| --- | --- |
| Draft | Exact section and final text |
| Asset | Exact repository path and revision |
| Claims | Claim IDs rechecked against current evidence |
| Destination | Signed-out URL check and date |
| Accessibility | Final alt text or caption transcript |
| Personal/profile fit | Santiago confirms the post belongs on his profile |
| Publication approval | Santiago and date in `PUBLISHING_QUEUE.md` |

Record the live URL and publication date only after a post is actually visible. Do not infer
publication from a prepared draft, an uploaded asset, or an approved queue row.
