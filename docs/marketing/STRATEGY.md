# Strategy and positioning

**Status: active package.** The `@lumenui.dev` Instagram profile and plugin-launch announcement are
live. `PUBLISHING_QUEUE.md` records publication evidence for each item; other drafts require
their own approval.
Every claim below was checked against the current repository state on 2026-09-03. Re-verify the
claim ledger before reusing any sentence publicly — package versions, playground availability, and
release status change frequently in this repository.

This file is the strategic root of the package indexed from
[`docs/exposure-playbook.md`](../exposure-playbook.md). Read it before writing or approving any
public copy.

## Canonical positioning statement

Use this sentence exactly, everywhere. Do not paraphrase it in ways that drop "web," "native
platforms," "Figma," or "AI-assisted development":

> Lumen is an open-source UI system that keeps accessible product interfaces consistent across
> web, native platforms, Figma, and AI-assisted development.

## Audience and primary intent

| Audience | What they need to see first | Primary CTA | Destination |
| --- | --- | --- | --- |
| Developers evaluating a UI library | A real, runnable component example and a one-line install | Install a package or try a template | `/templates`, package quick starts in the root README |
| Design-system engineers | Shared semantic tokens and cross-platform contract, not just visual styling | Read the shared foundations | `/docs/foundations`, [`docs/cross-platform.md`](../cross-platform.md) |
| AI-assisted builders | A deterministic, agent-usable catalog instead of guesswork | Install the skill or connect the MCP server | `/docs/ai-skill`, `/docs/mcp` |
| Product teams evaluating adoption | A low-risk, evidence-driven path with no sales gate | Start a scoped evaluation | `/teams` |

These four audiences are the only ones this package targets. Do not broaden scope to
general consumer marketing, growth hacking, or paid acquisition; this package covers organic and
community channels only, consistent with the existing [exposure playbook](../exposure-playbook.md).

## Message pillars

| Pillar | Proof | Claim IDs |
| --- | --- | --- |
| One accessible product language across frameworks | Astro, React, and Web Components share tokens, component contracts, and accessibility behavior | C-01, C-13 |
| Native foundations, not only web | Generated React Native, SwiftUI, and Jetpack Compose foundations; coordinated Lumen 2 publication | C-02, C-10 |
| Built for AI-assisted development | Portable Agent Skill, MCP server, `llms.txt`, machine-readable registry | C-05 |
| Free, with no adoption gate | MIT licensed, no waiting list, no account required to evaluate | C-03 |
| Localization-ready primitives | `LanguageToggle` component with demonstrated English and Spanish defaults | C-04 |
| Proven by real use, not claims | Dogfooded across the maintainer's own sibling projects; public showcase entries | C-08, C-09 |

## What Lumen does not claim

Never write copy that implies any of the following, even loosely:

- A specific user count, install count, download count, or "trusted by" list. None is verified or
  public.
- That sibling projects (ContracTrack, PostLens, Astro Doctor, RoadScore, and others in
  [`docs/project-adoption.md`](../project-adoption.md)) are external customers, clients, or paying
  users. They are the maintainer's own products.
- That the Lumen documentation site, packages, or any component ships fully translated content.
  Only the `LanguageToggle` primitive has a demonstrated English/Spanish default; say so precisely
  every time (see the approved sentence in [`CONTENT_KIT.md`](CONTENT_KIT.md)).
- That the public store apps prove external production adoption. The App Store and Google Play
  listings are Lumen-owned playgrounds, not independent consumer applications.
- That OpenAI endorses or certifies Lumen. The published Plugins Directory listing confirms
  availability, not an endorsement.
- That native platform support is production-proven on physical devices, or that real external
  consumer applications have completed qualification. `docs/lumen-2-readiness.md` records both as
  incomplete post-release qualification work.
- Any competitor comparison beyond a factual, sourced statement. Do not disparage other UI systems.
- Any metric, testimonial, or adoption number that is not in this file's claim ledger or directly
  verifiable in the repository at publish time.

## Claim ledger

Every public claim must trace to one of these entries. `SUPPORTED` claims may be used as written.
`CONDITIONAL` claims must include their boundary sentence every time they appear. `BLOCKED` claims
must not appear in public copy at all.

| ID | Claim | Evidence | State | Approved usage boundary |
| --- | --- | --- | --- | --- |
| C-01 | 150+ accessible web primitives across Astro, React, and Web Components | `README.md` project description; `packages/astro` component catalog | SUPPORTED | Web primitive count only; do not add native component counts to this figure. |
| C-02 | Shared native foundations for React Native, SwiftUI, and Jetpack Compose | `packages/react-native`, `packages/swift`, `packages/compose`; [`docs/lumen-2-readiness.md`](../lumen-2-readiness.md) baseline table | CONDITIONAL | Always pair with: "physical-device and real-consumer validation remain post-release qualification work." |
| C-03 | Free and MIT licensed | `LICENSE`, package manifests, README license section | SUPPORTED | State as current policy, not a promotional discount or limited-time offer. |
| C-04 | Localization-ready primitives with a demonstrated English/Spanish `LanguageToggle` default | `packages/core/src/language.ts`, public route `/docs/components/language-toggle`, `docs/ai-usage.md` (`useLanguageToggle`) | CONDITIONAL | Use the exact approved sentence in `CONTENT_KIT.md`. Never imply the docs site or packages ship translated content. |
| C-05 | Portable Agent Skill and MCP server for AI-assisted development | README "AI and design workflows" section; `packages/mcp`; `llms.txt` | SUPPORTED | Name the install command exactly as published; do not claim specific agent/tool compatibility beyond what the skill documents. |
| C-06 | Public Figma Community library | README Figma link; [`docs/figma.md`](../figma.md) | SUPPORTED | Link only to the exact published Figma Community URL in README. |
| C-07 | Five installable template families across three framework targets | README "Dashboards and templates" section; `lumen add` CLI | SUPPORTED | Name the CLI command exactly; do not claim template count beyond five without checking `apps/docs/src/pages/templates`. |
| C-08 | Real-world use across sibling web, SwiftUI, and Jetpack Compose projects in the maintainer's own workspace | [`docs/project-adoption.md`](../project-adoption.md) workspace inventory table | CONDITIONAL | Always describe as the maintainer's own projects, never as customers. Do not state a specific project count in public copy; the inventory table counts package surfaces, not products, so a single project can appear more than once. Re-verify against the current table before citing anything more specific; the audit is dated 2026-08-22 and may be stale. |
| C-09 | Public showcase projects: PostLens, Astro Doctor, Santi020k Themes | `apps/docs/src/pages/community.astro` (live `/community` route) | SUPPORTED | Link only to the exact public URLs already on the live community page. |
| C-10 | Lumen 2 coordinated `2.0.0` release published across the public package family | [`docs/lumen-2-readiness.md`](../lumen-2-readiness.md) readiness ledger | CONDITIONAL | Always note that real-consumer and physical-device validation remain open post-release qualification items. |
| C-11 | The Apple playground (iPhone, iPad, Mac) is live on the App Store | README "Native playgrounds" section; current public App Store listing | SUPPORTED | Link to the exact public listing. Do not imply that the React Native playground has an App Store listing. |
| C-12 | Lumen UI 1.0.0 is published in the shared ChatGPT and Codex Plugins Directory | [`../openai-plugin-submission.md`](../openai-plugin-submission.md), verified public listing on 2026-09-08 | SUPPORTED | May say published and available; link to the exact directory listing or instruct readers to search Plugins for Lumen UI. Do not imply OpenAI endorsement or private-repository access. |
| C-13 | Live CI, CodeQL, and npm badges expose current status | README badges section | CONDITIONAL | Link to the live GitHub Actions and npm pages. Never restate a green or current status without checking it at publication time. |
| C-14 | The Android Compose playground is live on Google Play | [`../playground-publication.md`](../playground-publication.md) Android production record; [current public Google Play listing](https://play.google.com/store/apps/details?id=com.santi020k.lumen.playground.compose) | SUPPORTED | Link to the exact public listing. Do not infer a specific install count or independent production adoption from the playground listing. |

Add new claims here with the same fields before using them anywhere else in this package. If a claim
cannot be verified against a current file, route, or check, it does not get an ID and must not be
published.

## Decision boundaries requiring Santiago's approval

The following actions are out of scope for this package and for any agent working from it. Draft
material may propose them, clearly labeled, but none may be executed without Santiago's explicit
sign-off:

- Creating any social account, handle, or community server other than the Instagram profile Santiago
  approved for owner creation on 2026-09-03 (see
  [`INSTAGRAM_ACCOUNT_SETUP.md`](INSTAGRAM_ACCOUNT_SETUP.md)). Account credentials and the final
  Meta creation step remain owner-controlled.
- Enabling `PUBLIC_EXPOSURE_ANALYTICS_ENDPOINT` or `PUBLIC_NEWSLETTER_FORM_ACTION`, or adding any
  new analytics or email vendor.
- Publishing, scheduling, or posting to any external platform.
- Sending outreach messages to any person, company, or community moderator.
- Any paid promotion or advertising spend. This package covers organic and community channels only.

## Voice

Follow [`docs/brand-guidelines.md`](../brand-guidelines.md) exactly; do not restate its rules here.
In one line: write like a careful engineer explaining a useful tool — clear, specific, confident, not
loud, no hype.

## Monetization

Do not create a paid tier based on hypothetical demand. Revisit monetization only when repeated
adoption-feedback requests cluster around a clear outcome such as private catalogs, guaranteed
support, migration help, or maintained application kits.
