# Lumen exposure playbook

This playbook turns Lumen's open-source surfaces into a repeatable adoption loop. It deliberately
optimizes for useful users, public evidence, and roadmap feedback before revenue.

## Positioning

Use this sentence consistently:

> Lumen is an open-source UI system that keeps accessible product interfaces consistent across
> web, native platforms, Figma, and AI-assisted development.

Lead with the outcome, then prove it with a real screen. Avoid describing Lumen only as a component
library; its distinguishing surface is the shared contract across implementation, design, and AI
workflows.

## Primary conversion paths

Every public post, guide, or demo should lead to one primary next action:

| Audience intent | Destination | Success signal |
| --- | --- | --- |
| Wants to try Lumen | `/guides/ship-a-settings-screen` | Continues to a framework guide or template |
| Wants a working starting point | `/templates` | Opens a template or copies an install command |
| Uses an AI coding tool | `/docs/ai-skill` | Copies the skill installation command |
| Needs structured AI context | `/docs/mcp` | Copies an MCP connection command |
| Built something | `/community` | Submits a showcase issue |
| Evaluating for a team | `/teams` | Submits adoption feedback |
| Wants updates | GitHub repository subscription | Watches releases or repository activity |

Use tagged links when a destination supports analytics:

```text
?utm_source=<channel>&utm_medium=<format>&utm_campaign=<campaign>&utm_content=<asset>
```

Example:

```text
https://lumen.santi020k.com/guides/ship-a-settings-screen?utm_source=reddit&utm_medium=post&utm_campaign=settings-guide&utm_content=astro
```

## Metrics

Review the following once a month. Weekly fluctuations are too noisy for a small project.

| Stage | Metric | Source | Initial target |
| --- | --- | --- | --- |
| Reach | Unique documentation visitors | Cloudflare Web Analytics | Positive three-month trend |
| Interest | Template, guide, Figma, AI skill, and MCP route visits | Cloudflare route analytics | Identify the top two entry paths |
| Trial | npm weekly downloads by public package | npm | Four-week moving average grows |
| Retention proxy | Returning documentation visitors | Privacy-preserving web analytics | Improve after each guide series |
| Community | Showcase submissions and external contributors | GitHub | One qualified submission per month |
| Product learning | Adoption-feedback issues | GitHub | Three actionable responses per quarter |
| Design adoption | Figma Community usage | Figma Community analytics | Positive monthly trend |
| Repository health | Stars, watchers, issues, PRs, contributors | GitHub Insights | Contributors and watchers grow, not stars alone |

The docs site emits a `lumen:exposure` browser event for links marked with
`data-exposure-event`. When `PUBLIC_EXPOSURE_ANALYTICS_ENDPOINT` is configured at build time, the
same event is sent as a small JSON beacon containing only the event name, current path, destination,
and timestamp. Do not add email addresses, IP-derived fields, fingerprints, or form contents.

The community page uses GitHub repository subscriptions by default. To enable the optional email
signup, configure `PUBLIC_NEWSLETTER_FORM_ACTION` with the HTTPS form endpoint from the selected
newsletter provider. The address is submitted directly to that provider; Lumen must not proxy or
log it through the exposure analytics endpoint. Document the provider and its privacy policy when
enabling the form.

## Four-week publishing cycle

Repeat this cycle with a different product problem each month.

### Week 1: useful guide

- Publish one task-oriented guide.
- Include a working screen, product states, and an accessibility verification checklist.
- Use one canonical URL and adapt the introduction for each community instead of duplicating the
  full article.

### Week 2: implementation comparison

- Show the same bounded workflow in Astro, React, and Web Components.
- Explain the framework-native differences; do not imply that identical syntax is the goal.
- Link to the relevant template and package documentation.

### Week 3: design and AI workflow

- Demonstrate the matching Figma tokens or component contract.
- Show an AI agent using the Lumen skill and MCP server to retrieve real APIs.
- Publish the exact prompt and the verification step.

### Week 4: community proof

- Feature one public project or contributor.
- Summarize one adoption lesson and one resulting documentation or component improvement.
- Invite showcase submissions and adoption feedback.

## Short video scripts

Record vertical and landscape crops from the same source. Keep each video between 30 and 60 seconds,
use captions, avoid rapid motion, and show a visible keyboard path when interaction matters.

### Video 1: one screen, three web targets

1. **0–4 seconds:** Show the finished settings screen. Caption: “One accessible product surface.”
2. **4–14 seconds:** Switch between Astro, React, and Elements implementations.
3. **14–25 seconds:** Highlight shared semantic tokens and framework-native imports.
4. **25–38 seconds:** Tab through the form and trigger validation.
5. **38–50 seconds:** End on the guide URL and “Free and MIT licensed.”

### Video 2: from prompt to verified UI

1. **0–5 seconds:** Show the prompt: “Build an accessible settings screen with Lumen.”
2. **5–15 seconds:** Show the agent reading the Lumen skill and querying the MCP catalog.
3. **15–30 seconds:** Show the generated interface and responsive state.
4. **30–42 seconds:** Demonstrate keyboard focus and error feedback.
5. **42–50 seconds:** End on the AI skill installation command.

### Video 3: Figma to native foundations

1. **0–6 seconds:** Show semantic roles in the Figma library.
2. **6–20 seconds:** Move through web, SwiftUI, React Native, and Compose previews.
3. **20–34 seconds:** Change a semantic token and show how the product language remains aligned.
4. **34–45 seconds:** End on “One language. Native behavior.” and the foundations guide.

## Launch copy

Adapt this material to each community's norms. Do not cross-post identical text on the same day.

### General announcement

**Title:** Lumen: an open-source UI system for web, native, Figma, and AI workflows

Lumen now includes more than 150 accessible primitives, installable product templates, shared
native foundations, a Figma Community library, a portable Agent Skill, and an MCP catalog. Astro is
the reference implementation, with React and standards-based Web Components for the web plus
foundations for React Native, SwiftUI, and Jetpack Compose.

Everything remains free and MIT licensed while we focus on adoption and real-world feedback. The
best place to start is the accessible settings-screen guide, then tell us what worked and what was
missing.

### Hacker News

Hacker News asks contributors not to post generated or AI-edited text. The maker should write the
final title and opening comment personally. Use the factual checklist in the campaign manifest to
cover package boundaries, progressive enhancement, standalone CSS, semantic token generation, and
the deterministic MCP snapshot. Review the current
[Show HN guidelines](https://news.ycombinator.com/showhn.html) before submitting and do not solicit
votes or comments.

### Product Hunt

**Tagline:** One accessible product language across code, Figma, and AI.

Use the template gallery as the first gallery asset, the cross-framework settings screen as the
second, and the Figma/AI workflow as the third. The maker comment should explain why the project is
remaining free during the adoption phase.

Product Hunt's current featuring guidelines exclude template-only products. Position Lumen as the
working design-system product and use its templates as supporting proof. The platform requires a
personal account at least one week old and supports creating a draft before scheduling.

### Astro and framework communities

Lead with the concrete framework benefit. For Astro, show progressive enhancement without a client
application runtime. For React, show visual primitives plus behavior hooks. For Web Components,
show standards-based registration and form participation. Always link to the matching framework
guide rather than the home page.

### Design-system communities

Lead with semantic roles, accessibility contracts, Figma variables, and platform-native adapters.
Avoid presenting visual styling as the central innovation.

### Reddit

Read the rules of each community immediately before submitting. Keep titles factual, disclose that
you maintain Lumen, link to the most relevant original guide, and participate outside your own
project posts. Never ask for votes or coordinate engagement.

## Asset checklist

Prepare these once per campaign:

- 1200 × 630 social image with a real product screen and one sentence;
- 16:9 screen recording with captions;
- 9:16 crop for short-form channels;
- one animated or static cross-framework comparison;
- alt text describing the visible interface and interaction;
- canonical guide URL with campaign parameters;
- exact package and skill installation commands;
- a first comment containing architecture details and known limitations.

## Community operating loop

1. Review showcase and adoption-feedback issues monthly.
2. Ask permission before reusing submitted images outside the showcase.
3. Turn repeated friction into a documentation issue or roadmap item.
4. Publish the improvement and credit the reporter when they consent.
5. Invite the reporter to verify the fix.

Do not create a paid tier based on hypothetical demand. Revisit monetization when repeated requests
cluster around a clear outcome such as private catalogs, guaranteed support, migration help, or
maintained application kits.
