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
types and release documentation. Verify target publication independently of workspace package metadata.

Read the migration guide and release notes for the requested source and target versions. Determine
which preview/apply commands the target CLI actually supports; do not assume every major has the
same automation. Read [references/v4.md](references/v4.md) only when targeting Lumen 4. When MCP
is connected, read the migration contract without a package filter before narrowing to affected
packages so cross-package changes are not missed. If shell execution is unavailable, inspect a
supplied target-CLI preview and report remaining commands as unverified.

Apply only the reviewed migration scope. Use `--apply` for supported deterministic edits; inspect
their diff. Update coordinated package pins and lock files with the consumer's package manager.
Review the changed public contracts and affected consumer workarounds. Keep ambiguous expressions
and application-owned policy for explicit review.
Never remove a workaround until the equivalent target behavior is verified. For changed setup,
read only the matching target from [framework contracts](../lumen-ui/references/frameworks.md).

Run the consumer's relevant types, tests, lint, build, and rendered interaction checks. Include
phone/desktop and keyboard/focus for web changes; use native compilation and accessibility checks
for native adapters. Re-run the supported preview to establish idempotence. Read
[the interaction checklist](../lumen-ui/references/verification.md) for affected UI behavior.
Report remaining manual findings and local versus published/deployed evidence accurately.
