---
"@santi020k/lumen": patch
---

Use per-package release targets in consumer rollout and upgrade audits. Verify pnpm
resolutions, including the transitive umbrella, and refuse an apply that would
downgrade a newer resolution. Recognize critical CSS imports and report components
that require the full stylesheet. Group migration review findings with verification steps.
