---
name: lumen-review
description: Review an existing Lumen interface or proposed UI change for component contracts, setup, semantic tokens, accessibility, and responsive behavior. Use for requested Lumen UI audits and reviews.
---

# Review a Lumen interface

Review the requested surface and return actionable findings with file locations, observable
consequences, and suggested fixes. Preserve the user's explicit review scope. A review request
does not authorize edits or dependency upgrades.

Identify the framework and resolved installed Lumen versions. Compare them with `lumen_get_meta`
and `lumen_check_compatibility` when MCP is connected. Read installed public types and documentation
when versions differ; a healthy server is not proof that its catalog matches the application.
Without MCP, use installed types, package READMEs, and `lumen show <component>`.

Inspect public component imports and props, theme/style ownership, and the framework's setup:
Astro runtime once, React hooks/controllers, Elements registration, or native providers/themes.
Look for duplicate primitive implementations, incorrect compound children, raw palettes,
application CSS that breaks public slots, and unsupported adapter APIs.

Review actual interactions and states: keyboard/focus and dismissal, accessible names, validation,
loading/error/empty feedback, touch targets, reduced motion, and phone/desktop layout. Use existing
project checks and rendered evidence when permitted; distinguish source findings from verified
behavior. Native reviews use platform semantics and supported target availability.

For visualization, check that the encoding answers the product question, the selected chart exists
in the installed adapter, and its data shape preserves unique identities, missing values, and real
zeros. Verify localized context, readable exact data, and supported keyboard inspection. Applications
own aggregation, conversion rates, binning, and statistical policy; charts must not invent them.

Use `lumen doctor --json` or `lumen doctor-native --json` for existing diagnostics when installed.
Explain applicability instead of treating every advisory as a defect. Do not upload private
source, credentials, or user data to the public catalog service.

Report only evidence-backed issues in priority order. Say when no actionable findings remain,
list the checks performed, and identify any unverified behavior. Do not claim WCAG certification
from an automated accessibility scan.
