# Measurement and review cadence

**Status: draft.** This reuses the metrics categories already defined in
[`docs/exposure-playbook.md`](../exposure-playbook.md#metrics) and adds the review routine and log
this package needs. It does not add, enable, or configure any analytics or email vendor.

## What is already instrumented

- The docs site emits a `lumen:exposure` browser event for links marked `data-exposure-event`. It
  only becomes a network beacon (event name, path, destination, timestamp — no PII) when
  `PUBLIC_EXPOSURE_ANALYTICS_ENDPOINT` is configured at build time. It is not configured by this
  package.
- The community page's email signup is dormant until `PUBLIC_NEWSLETTER_FORM_ACTION` points at an
  approved provider's HTTPS endpoint. It is not configured by this package.
- Do not add a new analytics or email vendor to enable measurement; see
  [`STRATEGY.md`](STRATEGY.md#decision-boundaries-requiring-santiagos-approval).

## Metrics (reused from the exposure playbook)

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

Review these once a month, per the playbook: weekly fluctuations are too noisy for a project this
size to act on.

## Monthly review routine

For the AI positioning rollout, record the deployment date and compare matched 28-day Search Console
windows for the homepage, `/guides/build-ui-with-ai`, `/guides/measure-ai-ui-token-usage`,
`/docs/ai-skill`, and `/docs/mcp`. Track query impressions, clicks, click-through rate, and average
position for relevant AI/UI intents. Mark low-volume or unavailable data explicitly. These are
observational comparisons, not proof that a copy change caused a ranking increase. Use existing
access only; no analytics service or tracking is enabled by the content update.

Keep website discovery metrics separate from the [AI token evaluation](../ai-efficiency.md).
Search clicks cannot establish token savings, and a local generation benchmark cannot establish
search demand or conversion gains.

1. Pull the current value for each metric row above from its listed source.
2. Compare against the prior month's entry in the review log below.
3. Note which `PUBLISHING_QUEUE.md` items shipped that month, if any, so a metric change can be
   tentatively attributed instead of treated as unexplained noise.
4. Decide one of: continue the current four-week cycle unchanged, adjust the next cycle's topic
   selection, or flag a channel in `CHANNELS.md` for reconsideration (never unilaterally create or
   drop a channel from this review alone — that still needs Santiago's approval per `STRATEGY.md`).
5. Record the decision in the log.

## Review log

### Search Console baseline: October 6, 2026

Read from the authenticated `lumen.santi020k.com` domain property. The selected three-month
performance report displayed July 26–October 4, 2026: 20 clicks, approximately 2,000 impressions,
1% CTR, and average position 26.7. These are the report's displayed totals; anonymized queries mean
visible query rows do not sum to them.

The icons landing page had 317 impressions, one click, 0.3% CTR, and average position 7.3. Its
generic `Icons` title is being replaced with an accurate Lucide/web/native title. The visible query
sample is too small to justify a broader keyword strategy or predict a CTR improvement. Compare
matched 28-day periods after deployment, keeping the deployment date separate from this local review.

The indexing report was last updated September 20: 597 indexed URLs and 288 excluded URLs
(171 redirects, 77 noindex, 36 alternate canonicals, one 404, and three crawled URLs not indexed).
These are known URLs, including historical variants, rather than a count of current sitemap pages.
The 404 example was `/cdn-cgi/l/email-protection`. The three crawled URLs not indexed were
two parameterized embedded React Native previews and `/guides/rss.xml`; they do not need search
listings. Explicit noindex headers reinforce the preview's existing HTML policy and exclude the feed.

Priorities: deploy the canonical-aligned Cloudflare artifact through the existing release workflow,
verify the live sitemap and representative canonical URLs return 200 without redirects, then compare
search performance for icons, AI skill, and framework guides. New AI guides are present locally but
were absent from production during this review. Do not interpret local audits as indexing or deployment
evidence, remove intended noindex exclusions, or request validation before the fix is deployed.

| Month | Reviewer | Key numbers | Decision |
| --- | --- | --- | --- |
| _(none yet — no cycle has been approved or published)_ | — | — | — |

Do not backfill this table with estimated or assumed numbers. Leave a month blank if no review
happened, rather than inferring a value.
