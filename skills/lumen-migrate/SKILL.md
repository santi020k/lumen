---
name: lumen-migrate
description: Plan and implement an explicitly requested Lumen version upgrade, including v4 migration diagnostics and consumer verification. Use when updating an application's Lumen dependencies or replacing older Lumen contracts.
---

# Migrate a Lumen consumer

Resolve the installed versions from package metadata and lock files, the requested target, the
framework/platform, and the application's integration boundaries. Preserve existing user changes.
Do not infer an upgrade request from ordinary UI work or pick a newer major than the user requested.

Compare target contracts with MCP metadata using `lumen_check_compatibility`. A latest catalog is
not the installed API. For another version, use a matching published MCP package or installed public
types and release documentation. Treat v4 workspace packages as a candidate until publication.

For v4, run `lumen migrate v4 --cwd <consumer> --dry-run --json` from the target CLI. If shell execution is unavailable, inspect a supplied target-CLI dry-run report and keep
remaining commands explicitly unverified. The report
includes deterministic source edits, manual-review findings, and version inventory. For consumers
older than v2, preview the existing `lumen migrate v2` separately first. Read the target package's
migration guide. When MCP is connected, first read `lumen_get_migration` without a package filter,
then narrow to affected packages so cross-package SDK changes are not missed; do not assume the report covers every
application workaround or native API.

Apply only the reviewed migration scope. Use `--apply` for supported deterministic edits; inspect
their diff. Update coordinated package pins and lock files with the consumer's package manager.
Review date trigger identities, button loading/activation and selectors, hidden content, localized
clipboard feedback, navigation, chart data/formatters, native initializer/sheet changes, and embedded
MCP SDK imports. Keep ambiguous expressions and application-owned policy for explicit review.
Never remove a workaround until the equivalent target behavior is verified.

Run the consumer's relevant types, tests, lint, build, and rendered interaction checks. Include
phone/desktop and keyboard/focus for web changes; use native compilation and accessibility checks
for native adapters. Re-run the dry-run report to establish idempotence. Report remaining manual
findings and local versus published/deployed evidence accurately.
