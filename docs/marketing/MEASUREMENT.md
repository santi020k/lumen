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

1. Pull the current value for each metric row above from its listed source.
2. Compare against the prior month's entry in the review log below.
3. Note which `PUBLISHING_QUEUE.md` items shipped that month, if any, so a metric change can be
   tentatively attributed instead of treated as unexplained noise.
4. Decide one of: continue the current four-week cycle unchanged, adjust the next cycle's topic
   selection, or flag a channel in `CHANNELS.md` for reconsideration (never unilaterally create or
   drop a channel from this review alone — that still needs Santiago's approval per `STRATEGY.md`).
5. Record the decision in the log.

## Review log

| Month | Reviewer | Key numbers | Decision |
| --- | --- | --- | --- |
| _(none yet — no cycle has been approved or published)_ | — | — | — |

Do not backfill this table with estimated or assumed numbers. Leave a month blank if no review
happened, rather than inferring a value.
